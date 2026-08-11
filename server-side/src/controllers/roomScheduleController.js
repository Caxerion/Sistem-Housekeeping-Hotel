const pool = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

const MIN_PHOTOS = 4;

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
const getAllSchedules = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT combined.*,
           staff_assign.assigned_staff_names,
           staff_assign.assigned_staff_ids
    FROM (
      SELECT
          rms.id AS schedule_id,
          r.id AS room_id,
          r.room_number AS no_kamar,
          rms.title,
          rms.notes,
          e.full_name AS dijadwalkan_oleh,
          rms.scheduled_date,
          rms.ended_at,
          rms.status,
          rms.started_at,
          rms.completed_at,
          rms.updated_at,
          r.housekeeping_status,
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
          NULL AS title,
          NULL AS notes,
          NULL AS dijadwalkan_oleh,
          NULL AS scheduled_date,
          NULL AS ended_at,
          NULL AS status,
          NULL AS started_at,
          NULL AS completed_at,
          NULL AS updated_at,
          NULL AS housekeeping_status,
          1 AS rn
      FROM rooms r
      WHERE r.id NOT IN (SELECT DISTINCT room_id FROM room_maintenance_schedule)
    ) combined
    LEFT JOIN (
      SELECT rss.schedule_id,
             GROUP_CONCAT(DISTINCT emp.full_name ORDER BY emp.full_name SEPARATOR ', ') AS assigned_staff_names,
             GROUP_CONCAT(DISTINCT rss.employee_id ORDER BY rss.employee_id) AS assigned_staff_ids
      FROM room_maintenance_schedule_staff rss
      JOIN employees emp ON emp.id = rss.employee_id
      GROUP BY rss.schedule_id
    ) staff_assign ON staff_assign.schedule_id = combined.schedule_id
    WHERE rn = 1
    ORDER BY no_kamar ASC, scheduled_date DESC
  `);

  const data = rows.map((r) => {
    const assignedStaffIds = r.assigned_staff_ids ? r.assigned_staff_ids.split(',') : [];
    const assignedStaffNames = r.assigned_staff_names ? r.assigned_staff_names.split(',') : [];
    return {
      ...r,
      assigned_staff_ids: assignedStaffIds,
      assigned_staff: assignedStaffNames,
    };
  });

  res.json({ success: true, data });
});

// POST /api/room-schedule
// Body: { room_id, title, notes, scheduled_date, ended_at?, set_immediately }
const createSchedule = asyncHandler(async (req, res) => {
  const {
    room_id,
    title,
    notes,
    scheduled_date,
    ended_at,
    set_immediately,
  } = req.body;

  if (!room_id || !title || !scheduled_date) {
    return res.status(400).json({
      success: false,
      message: 'room_id, title, dan scheduled_date wajib diisi.',
    });
  }

  const scheduled_by = req.user.employee_id;

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

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const initialStatus = set_immediately ? 'in_progress' : 'scheduled';
    const startedAt = set_immediately ? new Date() : null;

    const [result] = await connection.query(
      `INSERT INTO room_maintenance_schedule
          (room_id, scheduled_by, title, notes, scheduled_date, ended_at, status, started_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [room_id, scheduled_by, title, notes || null, scheduled_date, ended_at || null, initialStatus, startedAt]
    );

    if (initialStatus === 'in_progress') {
      await connection.query(
        `UPDATE rooms SET occupancy_status = 'maintenance', housekeeping_status = 'maintenance' WHERE id = ?`,
        [room_id]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: set_immediately
        ? 'Kamar langsung di-set maintenance dan sudah ditarik dari daftar available.'
        : 'Jadwal maintenance berhasil dibuat. Kamar tetap available sampai tanggal tersebut.',
      data: { id: result.insertId },
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

// PUT /api/room-schedule/:id
const updateSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, notes, scheduled_date, ended_at } = req.body;

  if (!title || !scheduled_date) {
    return res.status(400).json({
      success: false,
      message: 'title dan scheduled_date wajib diisi.',
    });
  }

  const [scheduleRows] = await pool.query(
    `SELECT id, status FROM room_maintenance_schedule WHERE id = ?`,
    [id]
  );

  if (scheduleRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan.' });
  }

  if (['completed', 'canceled'].includes(scheduleRows[0].status)) {
    return res.status(409).json({
      success: false,
      message: 'Tidak dapat mengubah jadwal yang sudah selesai atau dibatalkan.',
    });
  }

  await pool.query(
    `UPDATE room_maintenance_schedule SET title = ?, notes = ?, scheduled_date = ?, ended_at = ?, updated_at = NOW() WHERE id = ?`,
    [title, notes || null, scheduled_date, ended_at || null, id]
  );

  res.json({ success: true, message: 'Jadwal berhasil diperbarui.' });
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

  await pool.query(
    `UPDATE rooms SET occupancy_status = 'maintenance', housekeeping_status = 'maintenance' WHERE id = ?`,
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
    `SELECT room_id FROM room_maintenance_schedule WHERE id = ? AND status IN ('scheduled', 'in_progress')`,
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

  const [activeSchedules] = await pool.query(
    `SELECT COUNT(*) AS count FROM room_maintenance_schedule WHERE room_id = ? AND status IN ('scheduled', 'in_progress')`,
    [roomId]
  );

  if (activeSchedules[0].count === 0) {
    await pool.query(
      `UPDATE rooms SET occupancy_status = 'available', housekeeping_status = 'dirty' WHERE id = ?`,
      [roomId]
    );
  }

  res.json({ success: true, message: 'Jadwal maintenance dibatalkan.' });
});

// POST /api/room-schedule/request
const requestMaintenance = asyncHandler(async (req, res) => {
  const { room_id, request_notes } = req.body;
  const requestedBy = req.user.employee_id;

  if (!room_id) {
    return res.status(400).json({ success: false, message: 'room_id wajib diisi.' });
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
      message: `Kamar ini sedang berstatus '${roomRows[0].status}', tidak bisa diminta maintenance.`,
    });
  }

  const [result] = await pool.query(
    `INSERT INTO room_maintenance_schedule
       (room_id, scheduled_by, requested_by, request_notes, title, scheduled_date, status)
     VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`,
    [room_id, null, requestedBy, request_notes || null, 'Permintaan Maintenance', new Date().toISOString().slice(0, 10)]
  );

  res.status(201).json({
    success: true,
    message: 'Permintaan maintenance berhasil dikirim ke supervisor.',
    data: { id: result.insertId },
  });
});

// PUT /api/room-schedule/:id/assign-staff
const assignStaffToSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { employee_ids } = req.body;

  if (!Array.isArray(employee_ids) || employee_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'employee_ids harus berisi minimal satu ID petugas.',
    });
  }

  const [scheduleRows] = await pool.query(
    `SELECT id, status FROM room_maintenance_schedule WHERE id = ?`,
    [id]
  );

  if (scheduleRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan.' });
  }

  if (['completed', 'canceled'].includes(scheduleRows[0].status)) {
    return res.status(409).json({
      success: false,
      message: 'Tidak dapat menugaskan staf pada jadwal yang sudah selesai atau dibatalkan.',
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `DELETE FROM room_maintenance_schedule_staff WHERE schedule_id = ?`,
      [id]
    );

    const assignments = employee_ids
      .map((employeeId) => Number(employeeId))
      .filter((employeeId) => !Number.isNaN(employeeId))
      .map((employeeId) => [id, employeeId]);

    if (assignments.length > 0) {
      await connection.query(
        `INSERT IGNORE INTO room_maintenance_schedule_staff (schedule_id, employee_id) VALUES ?`,
        [assignments]
      );
    }

    await connection.commit();
    res.json({
      success: true,
      message: 'Petugas berhasil ditugaskan pada jadwal pembersihan.',
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

// POST /api/room-schedule/:id/upload-photos
const uploadPhotos = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employeeId = req.user.employee_id;

  const [scheduleRows] = await pool.query(
    `SELECT id, status, photos FROM room_maintenance_schedule WHERE id = ?`,
    [id]
  );

  if (scheduleRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan.' });
  }
  if (scheduleRows[0].status !== 'in_progress') {
    return res.status(409).json({ success: false, message: 'Maintenance ini belum sedang berlangsung.' });
  }

  const [assignedRows] = await pool.query(
    `SELECT 1 FROM room_maintenance_schedule_staff WHERE schedule_id = ? AND employee_id = ? LIMIT 1`,
    [id, employeeId]
  );
  if (assignedRows.length === 0 && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak: Anda tidak ditugaskan pada maintenance ini.',
    });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Tidak ada foto yang diupload.' });
  }

  const existingPhotos = scheduleRows[0].photos ? JSON.parse(scheduleRows[0].photos) : [];
  const newPhotos = req.files.map((file) => `/uploads/maintenance/${file.filename}`);
  const updatedPhotos = [...existingPhotos, ...newPhotos];

  await pool.query(
    `UPDATE room_maintenance_schedule SET photos = ? WHERE id = ?`,
    [JSON.stringify(updatedPhotos), id]
  );

  res.json({ success: true, message: 'Foto berhasil diupload.', photos: updatedPhotos });
});

// GET /api/room-schedule/my-schedule
const getMySchedule = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee_id;

  const [rows] = await pool.query(
    `SELECT
       rms.id AS schedule_id,
       r.id AS room_id,
       r.room_number AS no_kamar,
       rms.title,
       rms.notes,
       rms.scheduled_date,
       rms.status,
       rms.started_at,
       rms.completed_at,
       rms.photos,
       rms.request_notes,
       e.full_name AS dijadwalkan_oleh,
       GROUP_CONCAT(DISTINCT rss2.employee_id ORDER BY rss2.employee_id) AS assigned_staff_ids,
       GROUP_CONCAT(DISTINCT emp.full_name ORDER BY emp.full_name) AS assigned_staff_names
     FROM room_maintenance_schedule rms
     JOIN rooms r ON r.id = rms.room_id
     LEFT JOIN employees e ON e.id = rms.scheduled_by
     JOIN room_maintenance_schedule_staff rss ON rss.schedule_id = rms.id
     LEFT JOIN room_maintenance_schedule_staff rss2 ON rss2.schedule_id = rms.id
     LEFT JOIN employees emp ON emp.id = rss2.employee_id
     WHERE rss.employee_id = ?
       AND rms.status IN ('scheduled', 'in_progress')
     GROUP BY rms.id, r.id, r.room_number, rms.title, rms.notes, rms.scheduled_date,
              rms.status, rms.started_at, rms.completed_at, rms.photos, rms.request_notes,
              e.full_name
     ORDER BY rms.scheduled_date DESC`,
    [employeeId]
  );

  const data = rows.map((r) => {
    const assignedStaffIds = r.assigned_staff_ids ? r.assigned_staff_ids.split(',') : [];
    const assignedStaffNames = r.assigned_staff_names ? r.assigned_staff_names.split(',') : [];
    return {
      ...r,
      assigned_staff_ids: assignedStaffIds,
      assigned_staff: assignedStaffNames,
    };
  });

  res.json({ success: true, data });
});

module.exports = {
  getAvailableRooms,
  getHousekeepingStaff,
  getAllSchedules,
  createSchedule,
  updateSchedule,
  startSchedule,
  completeSchedule,
  cancelSchedule,
  requestMaintenance,
  assignStaffToSchedule,
  uploadPhotos,
  getMySchedule,
};
