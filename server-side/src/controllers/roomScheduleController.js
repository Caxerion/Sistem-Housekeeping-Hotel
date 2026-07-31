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
const getAllSchedules = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT
        rms.id, r.room_number AS no_kamar, rms.title, rms.notes,
        e.full_name AS dijadwalkan_oleh, rms.scheduled_date, rms.status,
        rms.started_at, rms.completed_at
     FROM room_maintenance_schedule rms
     JOIN rooms r ON r.id = rms.room_id
     JOIN employees e ON e.id = rms.scheduled_by
     ORDER BY rms.scheduled_date DESC`
  );
  res.json({ success: true, data: rows });
});

// POST /api/room-schedule
// Body: { room_id, scheduled_by, title, notes, scheduled_date, set_immediately }
const createSchedule = asyncHandler(async (req, res) => {
  const { room_id, scheduled_by, title, notes, scheduled_date, set_immediately } = req.body;

  if (!room_id || !scheduled_by || !title || !scheduled_date) {
    return res.status(400).json({
      success: false,
      message: 'room_id, scheduled_by, title, dan scheduled_date wajib diisi.',
    });
  }

  const [roomRows] = await pool.query(`SELECT occupancy_status AS status FROM rooms WHERE id = ?`, [room_id]);
  if (roomRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Kamar tidak ditemukan.' });
  }
  if (roomRows[0].status !== 'available') {
    return res.status(409).json({
      success: false,
      message: `Kamar ini sedang berstatus '${roomRows[0].status}', tidak bisa dijadwalkan maintenance.`,
    });
  }

  const [staffRows] = await pool.query(
    `SELECT e.id FROM employees e JOIN positions p ON p.id = e.position_id WHERE e.id = ? AND p.name IN ('Housekeeping Supervisor', 'Housekeeping Staff')`,
    [scheduled_by]
  );
  if (staffRows.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'scheduled_by harus berupa ID karyawan Housekeeping yang valid.',
    });
  }

  const [busyRows] = await pool.query(
    `SELECT id FROM room_maintenance_schedule WHERE scheduled_by = ? AND status IN ('scheduled', 'in_progress')`,
    [scheduled_by]
  );
  if (busyRows.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'Staf ini sedang bertugas di kamar lain. Selesaikan tugas terlebih dahulu sebelum dialokasikan ke kamar baru.',
    });
  }

  const initialStatus = set_immediately ? 'in_progress' : 'scheduled';
  const startedAt = set_immediately ? new Date() : null;

  const [result] = await pool.query(
    `INSERT INTO room_maintenance_schedule
        (room_id, scheduled_by, title, notes, scheduled_date, status, started_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [room_id, scheduled_by, title, notes || null, scheduled_date, initialStatus, startedAt]
  );

  res.status(201).json({
    success: true,
    message: set_immediately
      ? 'Kamar langsung di-set maintenance dan sudah ditarik dari daftar available.'
      : 'Jadwal maintenance berhasil dibuat. Kamar tetap available sampai tanggal tersebut.',
    data: { id: result.insertId },
  });
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

  res.json({ success: true, message: 'Maintenance dimulai. Kamar ditarik dari daftar available.' });
});

// PUT /api/room-schedule/:id/complete
const completeSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.query(
    `UPDATE room_maintenance_schedule
     SET status = 'completed', completed_at = NOW()
     WHERE id = ? AND status = 'in_progress'`,
    [id]
  );

  if (result.affectedRows === 0) {
    return res.status(409).json({
      success: false,
      message: 'Jadwal tidak ditemukan atau belum berstatus in_progress.',
    });
  }

  res.json({ success: true, message: 'Maintenance selesai. Kamar kembali available.' });
});

// PUT /api/room-schedule/:id/cancel
const cancelSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.query(
    `UPDATE room_maintenance_schedule SET status = 'canceled' WHERE id = ? AND status = 'scheduled'`,
    [id]
  );

  if (result.affectedRows === 0) {
    return res.status(409).json({
      success: false,
      message: 'Jadwal tidak ditemukan atau sudah berjalan/selesai (tidak bisa dibatalkan).',
    });
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
