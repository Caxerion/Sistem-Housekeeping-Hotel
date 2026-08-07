const pool = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

// GET /api/attendance/today
const getMyAttendanceToday = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee_id;

  const [rows] = await pool.query(
    `SELECT a.id, a.check_in_at, a.check_out_at, a.status, e.full_name, e.phone,
             a.izin_reason, a.izin_start_at, a.izin_end_at
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
    `SELECT check_out_at FROM attendance
       WHERE employee_id = ?
       ORDER BY id DESC
       LIMIT 1`,
    [employeeId]
  );
  if (existing.length > 0) {
    const lastCheckout = new Date(existing[0].check_out_at);
    if (existing[0].check_out_at && !isNaN(lastCheckout)) {
      const nextAvailable = new Date(lastCheckout.getTime() + 7 * 60 * 60 * 1000);
      const now = new Date();
      if (now < nextAvailable) {
        const formatted = nextAvailable.toLocaleString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        return res.status(409).json({
          success: false,
          message: `Anda baru saja selesai absensi. Absensi berikutnya tersedia pada ${formatted}.`,
        });
      }
    }
  }

  const [result] = await pool.query(
    `INSERT INTO attendance (employee_id, check_in_at, status) VALUES (?, NOW(), 'active')`,
    [employeeId]
  );

  const [rows] = await pool.query(
    `SELECT a.id, a.check_in_at, a.status, e.full_name, e.phone
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
// Body: { reason, start_date?, end_date? }
const submitIzin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, start_date, end_date } = req.body;
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

  let izinStart = parseLocalDate(start_date) || new Date();
  let izinEnd = parseLocalDate(end_date) || new Date(izinStart.getTime() + 24 * 60 * 60 * 1000);

  if (izinEnd <= izinStart) {
    izinEnd = new Date(izinStart.getTime() + 24 * 60 * 60 * 1000);
  }

  await pool.query(
    `UPDATE attendance
        SET check_out_at = NOW(),
            status = 'izin',
            izin_reason = ?,
            izin_start_at = ?,
            izin_end_at = ?
      WHERE id = ?`,
    [reason, izinStart, izinEnd, id]
  );

  res.json({ success: true, message: 'Izin berhasil dicatat.' });
});

// POST /api/attendance/izin-direct
// Body: { reason, start_date, end_date? }
// Membuat attendance baru dengan status izin tanpa perlu check-in aktif sebelumnya
const submitIzinDirect = asyncHandler(async (req, res) => {
  const { reason, start_date, end_date } = req.body;
  const employeeId = req.user.employee_id;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, message: 'Alasan izin wajib diisi.' });
  }

  if (!start_date) {
    return res.status(400).json({ success: false, message: 'Tanggal mulai izin wajib diisi.' });
  }

  const [existingToday] = await pool.query(
    `SELECT id FROM attendance WHERE employee_id = ? AND DATE(check_in_at) = CURDATE() AND status IN ('active', 'izin')`,
    [employeeId]
  );
  if (existingToday.length > 0) {
    return res.status(409).json({ success: false, message: 'Anda sudah memiliki catatan absensi/izin hari ini.' });
  }

  let izinStart = parseLocalDate(start_date);
  let izinEnd = parseLocalDate(end_date);

  if (!izinStart) {
    return res.status(400).json({ success: false, message: 'Tanggal mulai izin wajib diisi.' });
  }

  if (!izinEnd || izinEnd <= izinStart) {
    izinEnd = new Date(izinStart.getTime() + 24 * 60 * 60 * 1000);
  }

  const [result] = await pool.query(
    `INSERT INTO attendance (employee_id, check_in_at, check_out_at, status, izin_reason, izin_start_at, izin_end_at)
     VALUES (?, ?, NOW(), 'izin', ?, ?, ?)`,
    [employeeId, izinStart, reason, izinStart, izinEnd]
  );

  res.status(201).json({ success: true, message: 'Izin berhasil dicatat.', data: { id: result.insertId } });
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
        a.status, a.notes, a.photos, a.izin_reason, a.izin_start_at, a.izin_end_at
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

module.exports = { getMyAttendanceToday, checkIn, checkOut, submitIzin, submitIzinDirect, getAttendanceLogs };