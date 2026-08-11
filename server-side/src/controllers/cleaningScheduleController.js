const pool = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');
const { broadcast } = require('../utils/sse');

const MIN_PHOTOS = 4;

const getRooms = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.room_number, rt.name AS room_type, r.occupancy_status, r.housekeeping_status
       FROM rooms r
       JOIN room_types rt ON rt.id = r.room_type_id
     ORDER BY r.room_number ASC`
  );
  res.json({ success: true, data: rows });
});

const getHousekeepingStaff = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
      e.id AS employee_id,
      e.full_name,
      p.name AS position,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM attendance att
          WHERE att.employee_id = e.id
            AND DATE(att.check_in_at) = CURDATE()
            AND att.status = 'active'
        ) THEN 'standby'
        WHEN EXISTS (
          SELECT 1 FROM attendance att
          WHERE att.employee_id = e.id
            AND DATE(att.check_in_at) = CURDATE()
            AND att.status IN ('completed', 'izin')
        ) THEN 'active_today'
        ELSE NULL
      END AS attendance_status
    FROM employees e
    JOIN positions p ON p.id = e.position_id
    WHERE p.name IN ('Housekeeping Supervisor', 'Housekeeping Staff')
    ORDER BY p.name, e.full_name
  `);
  res.json({ success: true, data: rows });
});

const getAllCleaningSchedules = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT combined.*,
           staff_assign.assigned_staff_names,
           staff_assign.assigned_staff_ids
    FROM (
      SELECT
          rcs.id AS schedule_id,
          r.id AS room_id,
          r.room_number AS no_kamar,
          rt.name AS room_type,
          rcs.title,
          rcs.notes,
          e.full_name AS dijadwalkan_oleh,
          rcs.scheduled_date,
          rcs.ended_at,
          rcs.status,
          rcs.started_at,
          rcs.completed_at,
          rcs.updated_at,
          r.housekeeping_status,
          ROW_NUMBER() OVER (
              PARTITION BY r.id
              ORDER BY
                  CASE rcs.status
                      WHEN 'in_progress' THEN 1
                      WHEN 'scheduled' THEN 2
                      WHEN 'completed' THEN 3
                      WHEN 'canceled' THEN 4
                      ELSE 5
                  END,
                  rcs.scheduled_date DESC
          ) AS rn
      FROM room_cleaning_schedule rcs
      JOIN rooms r ON r.id = rcs.room_id
      JOIN room_types rt ON rt.id = r.room_type_id
      JOIN employees e ON e.id = rcs.scheduled_by

      UNION ALL

      SELECT
          NULL AS schedule_id,
          r.id AS room_id,
          r.room_number AS no_kamar,
          rt.name AS room_type,
          NULL AS title,
          NULL AS notes,
          NULL AS dijadwalkan_oleh,
          NULL AS scheduled_date,
          NULL AS ended_at,
          NULL AS status,
          NULL AS started_at,
          NULL AS completed_at,
          NULL AS updated_at,
          r.housekeeping_status,
          1 AS rn
      FROM rooms r
      JOIN room_types rt ON rt.id = r.room_type_id
      WHERE r.id NOT IN (SELECT DISTINCT room_id FROM room_cleaning_schedule)
    ) combined
    LEFT JOIN (
      SELECT rcss.schedule_id,
             GROUP_CONCAT(DISTINCT emp.full_name ORDER BY emp.full_name SEPARATOR ', ') AS assigned_staff_names,
             GROUP_CONCAT(DISTINCT rcss.employee_id ORDER BY rcss.employee_id) AS assigned_staff_ids
      FROM room_cleaning_schedule_staff rcss
      JOIN employees emp ON emp.id = rcss.employee_id
      GROUP BY rcss.schedule_id
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

const createCleaningSchedule = asyncHandler(async (req, res) => {
  const {
    room_id,
    title,
    notes,
    scheduled_date,
    ended_at,
    set_immediately,
    staff_ids,
  } = req.body;

  if (!room_id || !title || !scheduled_date) {
    return res.status(400).json({
      success: false,
      message: 'room_id, title, dan scheduled_date wajib diisi.',
    });
  }

  const scheduled_by = req.user.employee_id;

  const [roomRows] = await pool.query(
    `SELECT occupancy_status, housekeeping_status FROM rooms WHERE id = ?`,
    [room_id]
  );
  if (roomRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Kamar tidak ditemukan.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const initialStatus = set_immediately ? 'in_progress' : 'scheduled';
    const startedAt = set_immediately ? new Date() : null;

    const [result] = await connection.query(
      `INSERT INTO room_cleaning_schedule
          (room_id, scheduled_by, title, notes, scheduled_date, ended_at, status, started_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [room_id, scheduled_by, title, notes || null, scheduled_date, ended_at || null, initialStatus, startedAt]
    );

    if (initialStatus === 'in_progress') {
      await connection.query(
        `UPDATE rooms SET housekeeping_status = 'cleaning' WHERE id = ?`,
        [room_id]
      );
    }

    if (Array.isArray(staff_ids) && staff_ids.length > 0) {
      const assignments = staff_ids
        .map((employeeId) => Number(employeeId))
        .filter((employeeId) => !Number.isNaN(employeeId))
        .map((employeeId) => [result.insertId, employeeId]);

      if (assignments.length > 0) {
        await connection.query(
          `INSERT IGNORE INTO room_cleaning_schedule_staff (schedule_id, employee_id) VALUES ?`,
          [assignments]
        );
      }
    }

    await connection.commit();

    broadcast('cleaning:created', { id: result.insertId, room_id, status: initialStatus });

    res.status(201).json({
      success: true,
      message: set_immediately
        ? 'Pembersihan dimulai langsung.'
        : 'Jadwal pembersihan berhasil dibuat.',
      data: { id: result.insertId },
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

const updateCleaningSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, notes, scheduled_date, ended_at } = req.body;

  if (!title || !scheduled_date) {
    return res.status(400).json({
      success: false,
      message: 'title dan scheduled_date wajib diisi.',
    });
  }

  const [scheduleRows] = await pool.query(
    `SELECT id, status FROM room_cleaning_schedule WHERE id = ?`,
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
    `UPDATE room_cleaning_schedule SET title = ?, notes = ?, scheduled_date = ?, ended_at = ?, updated_at = NOW() WHERE id = ?`,
    [title, notes || null, scheduled_date, ended_at || null, id]
  );

  res.json({ success: true, message: 'Jadwal berhasil diperbarui.' });
});

const startCleaningSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [scheduleRows] = await pool.query(
    `SELECT room_id, status FROM room_cleaning_schedule WHERE id = ?`,
    [id]
  );

  if (scheduleRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan.' });
  }
  if (scheduleRows[0].status !== 'scheduled') {
    return res.status(409).json({ success: false, message: 'Jadwal ini sudah tidak berstatus scheduled.' });
  }

  await pool.query(
    `UPDATE room_cleaning_schedule SET status = 'in_progress', started_at = NOW() WHERE id = ?`,
    [id]
  );

  await pool.query(
    `UPDATE rooms SET housekeeping_status = 'cleaning' WHERE id = ?`,
    [scheduleRows[0].room_id]
  );

  broadcast('cleaning:started', { id, room_id: scheduleRows[0].room_id });

  res.json({ success: true, message: 'Pembersihan dimulai.' });
});

const completeCleaningSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [scheduleRows] = await pool.query(
    `SELECT room_id FROM room_cleaning_schedule WHERE id = ? AND status = 'in_progress'`,
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
    `UPDATE room_cleaning_schedule SET status = 'completed', completed_at = NOW() WHERE id = ?`,
    [id]
  );

  const [activeSchedules] = await pool.query(
    `SELECT COUNT(*) AS count FROM room_cleaning_schedule WHERE room_id = ? AND status IN ('scheduled', 'in_progress')`,
    [roomId]
  );

  if (activeSchedules[0].count === 0) {
    await pool.query(
      `UPDATE rooms SET housekeeping_status = 'clean' WHERE id = ?`,
      [roomId]
    );
  }

  broadcast('cleaning:completed', { id, room_id: roomId });

  res.json({ success: true, message: 'Pembersihan selesai. Kamar menjadi Clean.' });
});

const cancelCleaningSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [scheduleRows] = await pool.query(
    `SELECT room_id FROM room_cleaning_schedule WHERE id = ? AND status = 'scheduled'`,
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
    `UPDATE room_cleaning_schedule SET status = 'canceled' WHERE id = ?`,
    [id]
  );

  await pool.query(
    `UPDATE rooms SET housekeeping_status = 'dirty' WHERE id = ?`,
    [roomId]
  );

  broadcast('cleaning:canceled', { id, room_id: roomId });

  res.json({ success: true, message: 'Jadwal pembersihan dibatalkan.' });
});

const assignStaffToCleaningSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { employee_ids } = req.body;

  if (!Array.isArray(employee_ids) || employee_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'employee_ids harus berisi minimal satu ID petugas.',
    });
  }

  const [scheduleRows] = await pool.query(
    `SELECT id, status FROM room_cleaning_schedule WHERE id = ?`,
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
      `DELETE FROM room_cleaning_schedule_staff WHERE schedule_id = ?`,
      [id]
    );

    const assignments = employee_ids
      .map((employeeId) => Number(employeeId))
      .filter((employeeId) => !Number.isNaN(employeeId))
      .map((employeeId) => [id, employeeId]);

    if (assignments.length > 0) {
      await connection.query(
        `INSERT IGNORE INTO room_cleaning_schedule_staff (schedule_id, employee_id) VALUES ?`,
        [assignments]
      );
    }

    await connection.commit();
    broadcast('cleaning:staffAssigned', { id, employee_ids });
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

const uploadCleaningPhotos = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employeeId = req.user.employee_id;

  const [scheduleRows] = await pool.query(
    `SELECT id, status, photos FROM room_cleaning_schedule WHERE id = ?`,
    [id]
  );

  if (scheduleRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan.' });
  }
  if (scheduleRows[0].status !== 'in_progress') {
    return res.status(409).json({ success: false, message: 'Pembersihan ini belum sedang berlangsung.' });
  }

  const [assignedRows] = await pool.query(
    `SELECT 1 FROM room_cleaning_schedule_staff WHERE schedule_id = ? AND employee_id = ? LIMIT 1`,
    [id, employeeId]
  );
  if (assignedRows.length === 0 && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak: Anda tidak ditugaskan pada pembersihan ini.',
    });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Tidak ada foto yang diupload.' });
  }

  const existingPhotos = scheduleRows[0].photos ? JSON.parse(scheduleRows[0].photos) : [];
  const newPhotos = req.files.map((file) => `/uploads/maintenance/${file.filename}`);
  const updatedPhotos = [...existingPhotos, ...newPhotos];

  await pool.query(
    `UPDATE room_cleaning_schedule SET photos = ? WHERE id = ?`,
    [JSON.stringify(updatedPhotos), id]
  );

  res.json({ success: true, message: 'Foto berhasil diupload.', photos: updatedPhotos });
});

const getMyCleaningSchedule = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee_id;

  const [rows] = await pool.query(`
    SELECT
       rcs.id AS schedule_id,
       r.id AS room_id,
       r.room_number AS no_kamar,
       rcs.title,
       rcs.notes,
       rcs.scheduled_date,
       rcs.status,
       rcs.started_at,
       rcs.completed_at,
       rcs.photos,
       e.full_name AS dijadwalkan_oleh,
       GROUP_CONCAT(DISTINCT rcss2.employee_id ORDER BY rcss2.employee_id) AS assigned_staff_ids,
       GROUP_CONCAT(DISTINCT emp.full_name ORDER BY emp.full_name) AS assigned_staff_names
     FROM room_cleaning_schedule rcs
     JOIN rooms r ON r.id = rcs.room_id
     LEFT JOIN employees e ON e.id = rcs.scheduled_by
     JOIN room_cleaning_schedule_staff rcss ON rcss.schedule_id = rcs.id
     LEFT JOIN room_cleaning_schedule_staff rcss2 ON rcss2.schedule_id = rcs.id
     LEFT JOIN employees emp ON emp.id = rcss2.employee_id
     WHERE rcss.employee_id = ?
       AND rcs.status IN ('scheduled', 'in_progress')
     GROUP BY rcs.id, r.id, r.room_number, rcs.title, rcs.notes, rcs.scheduled_date,
              rcs.status, rcs.started_at, rcs.completed_at, rcs.photos,
              e.full_name
     ORDER BY rcs.scheduled_date DESC`,
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
  getRooms,
  getHousekeepingStaff,
  getAllCleaningSchedules,
  createCleaningSchedule,
  updateCleaningSchedule,
  startCleaningSchedule,
  completeCleaningSchedule,
  cancelCleaningSchedule,
  assignStaffToCleaningSchedule,
  uploadCleaningPhotos,
  getMyCleaningSchedule,
};
