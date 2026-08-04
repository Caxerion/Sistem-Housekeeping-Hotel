const pool = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

// GET /api/room-schedule/rooms-available
const getAvailableRooms = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.room_number, rt.name AS room_type
       FROM rooms r
       JOIN room_types rt ON rt.id = r.room_type_id
       WHERE r.occupancy_status = 'available'
      ORDER BY r.room_number`
  );
  res.json({ success: true, data: rows });
});

// GET /api/room-schedule/staff
const getHousekeepingStaff = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT e.id AS employee_id, e.full_name, p.name AS position
    FROM employees e
    JOIN positions p ON p.id = e.position_id
    WHERE p.name IN ('Housekeeping Supervisor', 'Housekeeping Staff')
    ORDER BY p.name, e.full_name
  `);
  res.json({ success: true, data: rows });
});

// GET /api/room-schedule
// Menampilkan SEMUA kamar (urut room_number 101 -> 550), digabung dengan
// histori jadwal maintenance-nya:
//   - Kamar yang PERNAH dijadwalkan -> tetap muncul SEMUA barisnya (histori),
//     jadi 1 kamar bisa muncul lebih dari sekali kalau pernah dimaintenance
//     berkali-kali.
//   - Kamar yang BELUM PERNAH dijadwalkan sama sekali -> muncul 1 baris
//     kosong (title/tanggal/petugas/status = null), supaya semua kamar
//     tetap kelihatan di tabel.
const getAllSchedules = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT * FROM (
      SELECT
          rms.id AS schedule_id,
          r.id AS room_id,
          r.room_number AS no_kamar,
          r.housekeeping_status,
          rms.title,
          rms.notes,
          e.full_name AS dijadwalkan_oleh,
          rms.scheduled_date,
          rms.status,
          rms.started_at,
          rms.completed_at,
          rms.updated_at,
          ROW_NUMBER() OVER (
              PARTITION BY r.id
              ORDER BY 
                  CASE rms.status
                      WHEN 'in_progress' THEN 1
                      WHEN 'scheduled' THEN 2
                      WHEN 'completed' THEN 3
                      WHEN 'canceled' THEN 4
                      ELSE 5
                  END,
                  rms.scheduled_date DESC
          ) AS rn
      FROM room_maintenance_schedule rms
      JOIN rooms r ON r.id = rms.room_id
      JOIN employees e ON e.id = rms.scheduled_by

      UNION ALL

      SELECT
          NULL AS schedule_id,
          r.id AS room_id,
          r.room_number AS no_kamar,
          r.housekeeping_status,
          NULL AS title,
          NULL AS notes,
          NULL AS dijadwalkan_oleh,
          NULL AS scheduled_date,
          NULL AS status,
          NULL AS started_at,
          NULL AS completed_at,
          NULL AS updated_at,
          1 AS rn
      FROM rooms r
      WHERE r.id NOT IN (SELECT DISTINCT room_id FROM room_maintenance_schedule)
    ) combined
    WHERE rn = 1
    ORDER BY no_kamar ASC, scheduled_date DESC
  `);

  const scheduleIds = rows.map((r) => r.schedule_id).filter(Boolean);
  let staffMap = {};

  if (scheduleIds.length > 0) {
    const [staffRows] = await pool.query(
      `SELECT rss.schedule_id, e.full_name
         FROM room_maintenance_schedule_staff rss
         JOIN employees e ON e.id = rss.employee_id
        WHERE rss.schedule_id IN (?)`,
      [scheduleIds]
    );
    staffRows.forEach((row) => {
      if (!staffMap[row.schedule_id]) staffMap[row.schedule_id] = [];
      staffMap[row.schedule_id].push(row.full_name);
    });
  }

  const data = rows.map((r) => ({
    ...r,
    id: r.schedule_id, // dipakai frontend untuk key & aksi (null kalau belum dijadwalkan)
    assigned_staff: r.schedule_id ? staffMap[r.schedule_id] || [] : [],
  }));

  res.json({ success: true, data });
});

// POST /api/room-schedule
// Body: { room_id, title, notes, scheduled_date, set_immediately, staff_ids: [] }
const createSchedule = asyncHandler(async (req, res) => {
  const {
    room_id,
    title,
    notes,
    scheduled_date,
    set_immediately,
    staff_ids = [],
  } = req.body;

  if (!room_id || !title || !scheduled_date) {
    return res.status(400).json({
      success: false,
      message: 'room_id, title, dan scheduled_date wajib diisi.',
    });
  }

  const scheduled_by = req.user.employee_id;

  const [schedulerRows] = await pool.query(
    `SELECT e.id FROM employees e JOIN positions p ON p.id = e.position_id WHERE e.id = ? AND p.name IN ('Housekeeping Supervisor', 'Housekeeping Staff')`,
    [scheduled_by]
  );
  if (schedulerRows.length === 0) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak: Anda bukan Housekeeping Supervisor/Staff.',
    });
  }

  const [roomRows] = await pool.query(
    `SELECT occupancy_status AS status FROM rooms WHERE id = ?`,
    [room_id]
  );
  if (roomRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Kamar tidak ditemukan.' });
  }
  if (roomRows[0].status !== 'available') {
    return res.status(409).json({
      success: false,
      message: `Kamar ini sedang berstatus '${roomRows[0].status}', tidak bisa dijadwalkan maintenance.`,
    });
  }

  const validStaffIds = Array.isArray(staff_ids) ? staff_ids.filter(Boolean) : [];

  if (validStaffIds.length > 0) {
    const placeholders = validStaffIds.map(() => '?').join(',');
    const [staffRows] = await pool.query(
      `SELECT e.id FROM employees e
         JOIN positions p ON p.id = e.position_id
        WHERE e.id IN (${placeholders})
          AND p.name IN ('Housekeeping Supervisor', 'Housekeeping Staff')`,
      validStaffIds
    );
    const validIds = staffRows.map((r) => r.id);
    const invalidIds = validStaffIds.filter((id) => !validIds.includes(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Beberapa petugas yang dipilih bukan Housekeeping Supervisor/Staff yang valid.',
      });
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const initialStatus = set_immediately ? 'in_progress' : 'scheduled';
    const startedAt = set_immediately ? new Date() : null;

    const [result] = await connection.query(
      `INSERT INTO room_maintenance_schedule
          (room_id, scheduled_by, title, notes, scheduled_date, status, started_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [room_id, scheduled_by, title, notes || null, scheduled_date, initialStatus, startedAt]
    );

    const scheduleId = result.insertId;

    if (initialStatus === 'in_progress') {
      // occupancy_status -> maintenance, DAN housekeeping_status -> cleaning
      // (selama maintenance berlangsung, dianggap "Sedang Cleaning" di dashboard)
      await connection.query(
        `UPDATE rooms SET occupancy_status = 'maintenance', housekeeping_status = 'cleaning' WHERE id = ?`,
        [room_id]
      );
    }

    if (validStaffIds.length > 0) {
      const staffValues = validStaffIds.map((empId) => [scheduleId, empId]);
      await connection.query(
        `INSERT INTO room_maintenance_schedule_staff (schedule_id, employee_id) VALUES ?`,
        [staffValues]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: set_immediately
        ? 'Kamar langsung di-set maintenance dan sudah ditarik dari daftar available.'
        : 'Jadwal maintenance berhasil dibuat. Kamar tetap available sampai tanggal tersebut.',
      data: { id: scheduleId },
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

// PUT /api/room-schedule/:id/start
const startSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [scheduleRows] = await pool.query(
    `SELECT room_id, status FROM room_maintenance_schedule WHERE id = ?`,
    [id]
  );

  if (scheduleRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan.' });
  }
  if (scheduleRows[0].status !== 'scheduled') {
    return res.status(409).json({ success: false, message: 'Jadwal ini sudah tidak berstatus scheduled.' });
  }

  await pool.query(
    `UPDATE room_maintenance_schedule SET status = 'in_progress', started_at = NOW() WHERE id = ?`,
    [id]
  );

  // occupancy_status -> maintenance, housekeeping_status -> cleaning
  await pool.query(
    `UPDATE rooms SET occupancy_status = 'maintenance', housekeeping_status = 'cleaning' WHERE id = ?`,
    [scheduleRows[0].room_id]
  );

  res.json({ success: true, message: 'Maintenance dimulai. Kamar ditarik dari daftar available.' });
});

// PUT /api/room-schedule/:id/complete
const completeSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [scheduleRows] = await pool.query(
    `SELECT room_id FROM room_maintenance_schedule WHERE id = ? AND status = 'in_progress'`,
    [id]
  );

  if (scheduleRows.length === 0) {
    return res.status(409).json({
      success: false,
      message: 'Jadwal tidak ditemukan atau belum berstatus in_progress.',
    });
  }

  const roomId = scheduleRows[0].room_id;

  await pool.query(
    `UPDATE room_maintenance_schedule SET status = 'completed', completed_at = NOW() WHERE id = ?`,
    [id]
  );

  const [activeSchedules] = await pool.query(
    `SELECT COUNT(*) AS count FROM room_maintenance_schedule WHERE room_id = ? AND status IN ('scheduled', 'in_progress')`,
    [roomId]
  );

  if (activeSchedules[0].count === 0) {
    // Maintenance beneran selesai (nggak ada jadwal aktif lain nempel di kamar ini):
    // occupancy_status -> available, housekeeping_status -> clean (BUKAN dirty,
    // karena 'dirty' itu khusus jalur checkout tamu, bukan dari maintenance).
    await pool.query(
      `UPDATE rooms SET occupancy_status = 'available', housekeeping_status = 'clean' WHERE id = ?`,
      [roomId]
    );
  }

  res.json({ success: true, message: 'Maintenance selesai. Kamar kembali available.' });
});

// PUT /api/room-schedule/:id/cancel
const cancelSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [scheduleRows] = await pool.query(
    `SELECT room_id FROM room_maintenance_schedule WHERE id = ? AND status = 'scheduled'`,
    [id]
  );

  if (scheduleRows.length === 0) {
    return res.status(409).json({
      success: false,
      message: 'Jadwal tidak ditemukan atau sudah berjalan/selesai (tidak bisa dibatalkan).',
    });
  }

  const roomId = scheduleRows[0].room_id;

  await pool.query(
    `UPDATE room_maintenance_schedule SET status = 'canceled' WHERE id = ?`,
    [id]
  );

  // Catatan: cancel cuma bisa dilakukan selagi status masih 'scheduled' (belum
  // pernah 'in_progress'), jadi housekeeping_status kamar itu belum pernah
  // ikut diubah jadi 'cleaning' -> tidak perlu direset di sini.
  const [activeSchedules] = await pool.query(
    `SELECT COUNT(*) AS count FROM room_maintenance_schedule WHERE room_id = ? AND status IN ('scheduled', 'in_progress')`,
    [roomId]
  );

  if (activeSchedules[0].count === 0) {
    await pool.query(
      `UPDATE rooms SET occupancy_status = 'available' WHERE id = ?`,
      [roomId]
    );
  }

  res.json({ success: true, message: 'Jadwal maintenance dibatalkan.' });
});

module.exports = {
  getAvailableRooms,
  getHousekeepingStaff,
  getAllSchedules,
  createSchedule,
  startSchedule,
  completeSchedule,
  cancelSchedule,
};