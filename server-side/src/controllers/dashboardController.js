const pool = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

function formatShortDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]}`;
}

function toLocalDateStr(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM rooms`
  );

  const [availableRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM rooms WHERE occupancy_status = 'available'`
  );

  const [dirtyRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM rooms WHERE housekeeping_status='dirty'`
  );

  const [cleaningRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM rooms WHERE housekeeping_status='cleaning'`
  );

  const [maintenanceRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM rooms WHERE occupancy_status = 'maintenance'`
  );

  const [staffRows] = await pool.query(
    `SELECT COUNT(DISTINCT employee_id) AS total
     FROM cleaning_logs
     WHERE DATE(cleaned_at) = CURDATE()`
  );

  const stats = {
    totalKamar: totalRows[0].total,
    available: availableRows[0].total,
    dirty: dirtyRows[0].total,
    cleaning: cleaningRows[0].total,
    sedangMaintenance: maintenanceRows[0].total,
    staffHadirHariIni: staffRows[0].total,
  };

  res.json({ success: true, data: stats });
});

// GET /api/dashboard/maintenance-trend?days=14&offset=0
// offset=0 : 14 hari terakhir (termasuk hari ini)
// offset=1 : 14 hari sebelum itu, dst.
// Menghitung berapa jadwal maintenance DIBUAT per hari (created_at),
// bukan berdasarkan started_at. Hari tanpa data tetap muncul dengan nilai 0.
const getMaintenanceTrend = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 14, 90);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  const [rows] = await pool.query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS total
       FROM room_maintenance_schedule
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC`,
    [offset + days - 1]
  );

  const countMap = {};
  rows.forEach((r) => {
    countMap[r.date] = r.total;
  });

  const trend = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - offset - i);
    const key = toLocalDateStr(d);
    trend.push({ date: key, total: countMap[key] || 0 });
  }

  const startBoundary = new Date();
  startBoundary.setDate(startBoundary.getDate() - offset - (days - 1));
  const endBoundary = new Date();
  endBoundary.setDate(endBoundary.getDate() - offset);

  res.json({ success: true, data: trend, period: `${formatShortDate(toLocalDateStr(startBoundary))} — ${formatShortDate(toLocalDateStr(endBoundary))}` });
});

module.exports = { getDashboardStats, getMaintenanceTrend };