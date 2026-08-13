const pool = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');
const { broadcast } = require('../utils/sse');
const { getLocalToday } = require('../utils/dateUtils');

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
  const today = getLocalToday();
  const [rows] = await pool.query(`
    SELECT
      e.id AS employee_id,
      e.full_name,
      p.name AS position,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM attendance att
          WHERE att.employee_id = e.id
            AND att.status = 'active'
        ) THEN 'standby'
        WHEN EXISTS (
          SELECT 1 FROM attendance att
          WHERE att.employee_id = e.id
            AND DATE(att.check_in_at) = ?
            AND att.status IN ('completed', 'izin')
        ) AND NOT EXISTS (
          SELECT 1 FROM attendance att2
          WHERE att2.employee_id = e.id
            AND att2.status = 'active'
        ) THEN 'active_today'
        ELSE NULL
      END AS attendance_status
    FROM employees e
    JOIN positions p ON p.id = e.position_id
    WHERE p.name IN ('Housekeeping Supervisor', 'Housekeeping Staff')
    ORDER BY p.name, e.full_name
  `, [today]);
  res.json({ success: true, data: rows });
});

const getAllCleaningSchedules = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
        r.id AS room_id,
        r.room_number AS no_kamar,
        rt.name AS room_type,
        r.housekeeping_status,
        rcs.id AS schedule_id,
        rcs.title,
        rcs.notes,
        e.full_name AS dijadwalkan_oleh,
        rcs.scheduled_date,
        rcs.ended_at,
        rcs.status,
        rcs.started_at,
        rcs.completed_at,
        rcs.updated_at,
        rcs.inspection_status,
        rcs.inspection_note,
        rcs.photos,
        staff_assign.assigned_staff_names,
        staff_assign.assigned_staff_ids
    FROM rooms r
    JOIN room_types rt ON rt.id = r.room_type_id
    LEFT JOIN room_cleaning_schedule rcs ON rcs.id = (
        SELECT id FROM room_cleaning_schedule rcs2
        WHERE rcs2.room_id = r.id
        ORDER BY rcs2.scheduled_date DESC, rcs2.id DESC
        LIMIT 1
    )
    LEFT JOIN employees e ON e.id = rcs.scheduled_by
    LEFT JOIN (
        SELECT rcss.schedule_id,
               GROUP_CONCAT(DISTINCT emp.full_name ORDER BY emp.full_name SEPARATOR ', ') AS assigned_staff_names,
               GROUP_CONCAT(DISTINCT rcss.employee_id ORDER BY rcss.employee_id) AS assigned_staff_ids
        FROM room_cleaning_schedule_staff rcss
        JOIN employees emp ON emp.id = rcss.employee_id
        GROUP BY rcss.schedule_id
    ) staff_assign ON staff_assign.schedule_id = rcs.id
    ORDER BY r.room_number ASC
  `);

  const data = rows.map((r) => {
    const assignedStaffIds = r.assigned_staff_ids ? r.assigned_staff_ids.split(',') : [];
    const assignedStaffNames = r.assigned_staff_names ? r.assigned_staff_names.split(',') : [];
    return {
      room_id: r.room_id,
      no_kamar: r.no_kamar,
      room_type: r.room_type,
      housekeeping_status: r.housekeeping_status,
      schedule_id: r.schedule_id,
      title: r.title,
      notes: r.notes,
      dijadwalkan_oleh: r.dijadwalkan_oleh,
      scheduled_date: r.scheduled_date,
      ended_at: r.ended_at,
      status: r.status,
      started_at: r.started_at,
      completed_at: r.completed_at,
      updated_at: r.updated_at,
      inspection_status: r.inspection_status,
      inspection_note: r.inspection_note,
      photos: r.photos,
      assigned_staff_ids: assignedStaffIds,
      assigned_staff: assignedStaffNames,
    };
  });

  res.json({ success: true, data });
});

const createCleaningSchedule = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee_id;

  const [attendanceRows] = await pool.query(
    `SELECT id FROM attendance WHERE employee_id = ? AND status = 'active' LIMIT 1`,
    [employeeId]
  );
  if (attendanceRows.length === 0) {
    return res.status(403).json({ success: false, message: 'Anda belum melakukan absensi. Silakan absen terlebih dahulu.' });
  }

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
  const employeeId = req.user.employee_id;

  const [attendanceRows] = await pool.query(
    `SELECT id FROM attendance WHERE employee_id = ? AND status = 'active' LIMIT 1`,
    [employeeId]
  );
  if (attendanceRows.length === 0) {
    return res.status(403).json({ success: false, message: 'Anda belum melakukan absensi. Silakan absen terlebih dahulu.' });
  }

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
  const employeeId = req.user.employee_id;

  const [attendanceRows] = await pool.query(
    `SELECT id FROM attendance WHERE employee_id = ? AND status = 'active' LIMIT 1`,
    [employeeId]
  );
  if (attendanceRows.length === 0) {
    return res.status(403).json({ success: false, message: 'Anda belum melakukan absensi. Silakan absen terlebih dahulu.' });
  }

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
  const employeeId = req.user.employee_id;

  const [attendanceRows] = await pool.query(
    `SELECT id FROM attendance WHERE employee_id = ? AND status = 'active' LIMIT 1`,
    [employeeId]
  );
  if (attendanceRows.length === 0) {
    return res.status(403).json({ success: false, message: 'Anda belum melakukan absensi. Silakan absen terlebih dahulu.' });
  }

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
    `UPDATE room_cleaning_schedule 
        SET status = 'completed', completed_at = NOW(), inspection_status = 'pending' 
      WHERE id = ?`,
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

  res.json({ success: true, message: 'Pembersihan selesai. Menunggu pemeriksaan supervisor.' });
});

const revertCleaningSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employeeId = req.user.employee_id;

  const [scheduleRows] = await pool.query(
    `SELECT room_id, status, inspection_status FROM room_cleaning_schedule WHERE id = ?`,
    [id]
  );

  if (scheduleRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan.' });
  }

  if (scheduleRows[0].inspection_status !== 'pending') {
    return res.status(409).json({ success: false, message: 'Jadwal ini tidak dalam status menunggu pemeriksaan.' });
  }

  const [assignedRows] = await pool.query(
    `SELECT employee_id FROM room_cleaning_schedule_staff WHERE schedule_id = ? AND employee_id = ?`,
    [id, employeeId]
  );

  if (assignedRows.length === 0 && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Akses ditolak: Anda bukan petugas yang ditugaskan pada jadwal ini.' });
  }

  await pool.query(
    `UPDATE room_cleaning_schedule 
       SET status = 'in_progress', inspection_status = NULL, inspection_by = NULL, inspection_note = NULL, inspected_at = NULL 
     WHERE id = ?`,
    [id]
  );

  await pool.query(
    `UPDATE rooms SET housekeeping_status = 'cleaning' WHERE id = ?`,
    [scheduleRows[0].room_id]
  );

  broadcast('cleaning:inspected', { id, room_id: scheduleRows[0].room_id, action: 'reverted' });

  res.json({ success: true, message: 'Pengajuan dibatalkan. Anda dapat melanjutkan pembersihan.' });
});

const inspectCleaningSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, note } = req.body;
  const inspectorId = req.user.employee_id;
  const inspectorRole = req.user.role;

  if (inspectorRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Akses ditolak: Hanya admin yang dapat melakukan pemeriksaan.' });
  }

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Aksi tidak valid. Gunakan approve atau reject.' });
  }

  const [scheduleRows] = await pool.query(
    `SELECT room_id, status, inspection_status FROM room_cleaning_schedule WHERE id = ?`,
    [id]
  );

  if (scheduleRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan.' });
  }

  if (scheduleRows[0].inspection_status !== 'pending') {
    return res.status(409).json({ success: false, message: 'Jadwal ini belum menunggu pemeriksaan.' });
  }

  if (action === 'approve') {
    await pool.query(
      `UPDATE room_cleaning_schedule 
         SET inspection_status = 'approved', inspection_by = ?, inspection_note = ?, inspected_at = NOW() 
       WHERE id = ?`,
      [inspectorId, note || null, id]
    );

    broadcast('cleaning:inspected', { id, room_id: scheduleRows[0].room_id, action: 'approved' });

    res.json({ success: true, message: 'Pembersihan disetujui.' });
  } else {
    await pool.query(
      `UPDATE room_cleaning_schedule 
         SET status = 'in_progress', inspection_status = 'revision', inspection_by = ?, inspection_note = ?, inspected_at = NOW() 
       WHERE id = ?`,
      [inspectorId, note || null, id]
    );

    await pool.query(
      `UPDATE rooms SET housekeeping_status = 'cleaning' WHERE id = ?`,
      [scheduleRows[0].room_id]
    );

    broadcast('cleaning:inspected', { id, room_id: scheduleRows[0].room_id, action: 'revision' });

    res.json({ success: true, message: 'Pembersihan direvisi. Staff perlu memperbaiki sesuai catatan.' });
  }
});

const cancelCleaningSchedule = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee_id;

  const [attendanceRows] = await pool.query(
    `SELECT id FROM attendance WHERE employee_id = ? AND status = 'active' LIMIT 1`,
    [employeeId]
  );
  if (attendanceRows.length === 0) {
    return res.status(403).json({ success: false, message: 'Anda belum melakukan absensi. Silakan absen terlebih dahulu.' });
  }

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
  const employeeId = req.user.employee_id;

  const [attendanceRows] = await pool.query(
    `SELECT id FROM attendance WHERE employee_id = ? AND status = 'active' LIMIT 1`,
    [employeeId]
  );
  if (attendanceRows.length === 0) {
    return res.status(403).json({ success: false, message: 'Anda belum melakukan absensi. Silakan absen terlebih dahulu.' });
  }

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

  const [attendanceRows] = await pool.query(
    `SELECT id FROM attendance WHERE employee_id = ? AND status = 'active' LIMIT 1`,
    [employeeId]
  );
  if (attendanceRows.length === 0) {
    return res.status(403).json({ success: false, message: 'Anda belum melakukan absensi. Silakan absen terlebih dahulu.' });
  }

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

  let existingPhotos = [];
  const rawPhotos = scheduleRows[0].photos;
  if (rawPhotos) {
    if (Array.isArray(rawPhotos)) {
      existingPhotos = rawPhotos;
    } else if (typeof rawPhotos === 'string') {
      const trimmed = rawPhotos.trim();
      if (trimmed.startsWith('[')) {
        try {
          existingPhotos = JSON.parse(trimmed);
        } catch {
          existingPhotos = [trimmed];
        }
      } else {
        existingPhotos = [trimmed];
      }
    }
  }
  const newPhotos = req.files.map((file) => `/uploads/maintenance/${file.filename}`);
  const updatedPhotos = [...existingPhotos, ...newPhotos];

  await pool.query(
    `UPDATE room_cleaning_schedule SET photos = ? WHERE id = ?`,
    [JSON.stringify(updatedPhotos), id]
  );

  res.json({ success: true, message: 'Foto berhasil diupload.', photos: updatedPhotos });
});

const deleteCleaningPhoto = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { photo } = req.body;

  if (!photo || typeof photo !== 'string') {
    return res.status(400).json({ success: false, message: 'Photo path harus dikirim.' });
  }

  const [scheduleRows] = await pool.query(
    `SELECT photos FROM room_cleaning_schedule WHERE id = ?`,
    [id]
  );

  if (scheduleRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan.' });
  }

  let existingPhotos = [];
  const rawPhotos = scheduleRows[0].photos;
  if (rawPhotos) {
    if (Array.isArray(rawPhotos)) {
      existingPhotos = rawPhotos;
    } else if (typeof rawPhotos === 'string') {
      const trimmed = rawPhotos.trim();
      if (trimmed.startsWith('[')) {
        try {
          existingPhotos = JSON.parse(trimmed);
        } catch {
          existingPhotos = [trimmed];
        }
      } else {
        existingPhotos = [trimmed];
      }
    }
  }

  const filteredPhotos = existingPhotos.filter((p) => p !== photo);
  await pool.query(
    `UPDATE room_cleaning_schedule SET photos = ? WHERE id = ?`,
    [JSON.stringify(filteredPhotos), id]
  );

  res.json({ success: true, message: 'Foto berhasil dihapus.', photos: filteredPhotos });
});

const getMyCleaningSchedule = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee_id;

  const [attendanceRows] = await pool.query(
    `SELECT id FROM attendance WHERE employee_id = ? AND status = 'active' LIMIT 1`,
    [employeeId]
  );
  if (attendanceRows.length === 0) {
    return res.status(403).json({ success: false, message: 'Anda belum melakukan absensi. Silakan absen terlebih dahulu.' });
  }

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
       rcs.inspection_status,
       rcs.inspection_note,
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
      AND (rcs.status IN ('scheduled', 'in_progress') OR (rcs.status = 'completed' AND rcs.inspection_status IN ('pending', 'revision')))
    GROUP BY rcs.id, r.id, r.room_number, rcs.title, rcs.notes, rcs.scheduled_date,
             rcs.status, rcs.started_at, rcs.completed_at, rcs.photos,
             rcs.inspection_status, rcs.inspection_note, e.full_name
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
  inspectCleaningSchedule,
  revertCleaningSubmission,
  cancelCleaningSchedule,
  assignStaffToCleaningSchedule,
  uploadCleaningPhotos,
  deleteCleaningPhoto,
  getMyCleaningSchedule,
};
