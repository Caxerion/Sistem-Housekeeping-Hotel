const pool = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

// GET /api/attendance/today
const getMyAttendanceToday = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee_id;

  const [rows] = await pool.query(
    `SELECT a.id, a.check_in_at, a.check_out_at, a.status, e.full_name, e.phone
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
      WHERE a.employee_id = ?
        AND DATE(a.check_in_at) = CURDATE()
      ORDER BY a.id DESC
      LIMIT 1`,
    [employeeId]
  );

  res.json({ success: true, data: rows[0] || null });
});

// POST /api/attendance/check-in
const checkIn = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee_id;

  const [existing] = await pool.query(
    `SELECT id FROM attendance
      WHERE employee_id = ? AND DATE(check_in_at) = CURDATE() AND status = 'active'`,
    [employeeId]
  );
  if (existing.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'Anda sudah melakukan absensi hari ini dan belum mengakhirinya.',
    });
  }

  const [result] = await pool.query(
    `INSERT INTO attendance (employee_id, check_in_at, status) VALUES (?, NOW(), 'active')`,
    [employeeId]
  );

  const [rows] = await pool.query(
    `SELECT a.id, a.check_in_at, e.full_name, e.phone
       FROM attendance a JOIN employees e ON e.id = a.employee_id
      WHERE a.id = ?`,
    [result.insertId]
  );

  res.status(201).json({ success: true, message: 'Absensi dimulai. Status Anda sekarang Standby.', data: rows[0] });
});

// POST /api/attendance/:id/check-out
// multipart/form-data -> fields: notes (wajib), files: photos[] (min 3, divalidasi di frontend)
// Foto disimpan sebagai JSON array di kolom `photos`, bukan tabel terpisah.
const checkOut = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  const employeeId = req.user.employee_id;

  if (!notes || !notes.trim()) {
    return res.status(400).json({ success: false, message: 'Catatan wajib diisi.' });
  }

  const [rows] = await pool.query(
    `SELECT id FROM attendance WHERE id = ? AND employee_id = ? AND status = 'active'`,
    [id, employeeId]
  );
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Sesi absensi aktif tidak ditemukan.' });
  }

  const photoUrls = (req.files || []).map((file) => `/uploads/attendance/${file.filename}`);

  await pool.query(
    `UPDATE attendance
        SET check_out_at = NOW(), status = 'completed', notes = ?, photos = ?
      WHERE id = ?`,
    [notes, JSON.stringify(photoUrls), id]
  );

  res.json({ success: true, message: 'Absensi berhasil diakhiri.' });
});

// POST /api/attendance/:id/izin
// Body: { reason }
const submitIzin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const employeeId = req.user.employee_id;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, message: 'Alasan izin wajib diisi.' });
  }

  const [rows] = await pool.query(
    `SELECT id FROM attendance WHERE id = ? AND employee_id = ? AND status = 'active'`,
    [id, employeeId]
  );
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Sesi absensi aktif tidak ditemukan.' });
  }

  await pool.query(
    `UPDATE attendance SET check_out_at = NOW(), status = 'izin', izin_reason = ? WHERE id = ?`,
    [reason, id]
  );

  res.json({ success: true, message: 'Izin berhasil dicatat.' });
});

// GET /api/attendance/logs
// Housekeeping Supervisor / Admin -> lihat SEMUA logs staff, bisa filter by employee_id
// Staff biasa -> cuma lihat logs milik sendiri
// Otomatis dibatasi 4 minggu terakhir.
const getAttendanceLogs = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee_id;
  const requestedEmployeeId = req.query.employee_id;

  const [positionRows] = await pool.query(
    `SELECT p.name AS position FROM employees e JOIN positions p ON p.id = e.position_id WHERE e.id = ?`,
    [employeeId]
  );
  const isSupervisor = positionRows[0]?.position === 'Housekeeping Supervisor';

  const baseQuery = `
    SELECT
        a.id, a.employee_id, e.full_name, a.check_in_at, a.check_out_at,
        a.status, a.notes, a.photos, a.izin_reason
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    WHERE a.check_in_at >= (NOW() - INTERVAL 4 WEEK)
  `;

  let data;
  if (isSupervisor && requestedEmployeeId) {
    const [rows] = await pool.query(`${baseQuery} AND a.employee_id = ? ORDER BY a.check_in_at DESC`, [requestedEmployeeId]);
    data = rows.map((r) => ({ ...r, photos: (r.photos || []).map(p => `${req.protocol}://${req.get('host')}${p}`) }));
  } else if (isSupervisor) {
    const [rows] = await pool.query(`${baseQuery} ORDER BY a.check_in_at DESC`);
    data = rows.map((r) => ({ ...r, photos: (r.photos || []).map(p => `${req.protocol}://${req.get('host')}${p}`) }));
  } else {
    const [rows] = await pool.query(`${baseQuery} AND a.employee_id = ? ORDER BY a.check_in_at DESC`, [employeeId]);
    data = rows.map((r) => ({ ...r, photos: (r.photos || []).map(p => `${req.protocol}://${req.get('host')}${p}`) }));
  }

  res.json({ success: true, data, scope: isSupervisor ? 'all' : 'own' });
});

module.exports = { getMyAttendanceToday, checkIn, checkOut, submitIzin, getAttendanceLogs };