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
     FROM attendance
     WHERE DATE(check_in_at) = CURDATE()`
  );

  const [staffOnDutyRows] = await pool.query(
    `SELECT COUNT(DISTINCT e.id) AS total
     FROM employees e
     JOIN positions p ON p.id = e.position_id
     WHERE p.name IN ('Housekeeping Supervisor', 'Housekeeping Staff')
       AND EXISTS (
         SELECT 1 FROM room_maintenance_schedule_staff rss
         JOIN room_maintenance_schedule rms ON rms.id = rss.schedule_id
         WHERE rss.employee_id = e.id
           AND rms.status = 'in_progress'
       )`
  );

  const [staffStandbyRows] = await pool.query(
    `SELECT COUNT(DISTINCT e.id) AS total
     FROM employees e
     JOIN positions p ON p.id = e.position_id
     WHERE p.name IN ('Housekeeping Supervisor', 'Housekeeping Staff')
       AND NOT EXISTS (
         SELECT 1 FROM room_maintenance_schedule_staff rss
         JOIN room_maintenance_schedule rms ON rms.id = rss.schedule_id
         WHERE rss.employee_id = e.id
           AND rms.status = 'in_progress'
       )
       AND EXISTS (
         SELECT 1 FROM attendance att
         WHERE att.employee_id = e.id
           AND DATE(att.check_in_at) = CURDATE()
           AND att.status = 'active'
       )`
  );

  const stats = {
    totalKamar: totalRows[0].total,
    available: availableRows[0].total,
    dirty: dirtyRows[0].total,
    cleaning: cleaningRows[0].total,
    sedangMaintenance: maintenanceRows[0].total,
    staffHadirHariIni: staffRows[0].total,
    staffOnDuty: staffOnDutyRows[0].total,
    staffStandby: staffStandbyRows[0].total,
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