const pool = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM rooms`
  );

  const [availableRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM rooms WHERE status = 'available'`
  );

  const [maintenanceRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM rooms WHERE status = 'maintenance'`
  );

  const [staffRows] = await pool.query(
    `SELECT COUNT(DISTINCT employee_id) AS total
     FROM cleaning_logs
     WHERE DATE(cleaned_at) = CURDATE()`
  );

  const stats = {
    totalKamar: totalRows[0].total,
    available: availableRows[0].total,
    sedangMaintenance: maintenanceRows[0].total,
    staffHadirHariIni: staffRows[0].total,
  };

  res.json({ success: true, data: stats });
});

module.exports = { getDashboardStats };