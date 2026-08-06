const pool = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

const getStaffOverview = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
        e.id,
        e.full_name,
        p.name AS position,
        e.phone,
        CASE
          WHEN EXISTS (
              SELECT 1 FROM room_maintenance_schedule_staff rss
              JOIN room_maintenance_schedule rms ON rms.id = rss.schedule_id
              WHERE rss.employee_id = e.id
                AND rms.status = 'in_progress'
          ) THEN 'on_duty'
          WHEN EXISTS (
              SELECT 1 FROM attendance att
              WHERE att.employee_id = e.id
                AND DATE(att.check_in_at) = CURDATE()
                AND att.status = 'active'
          ) THEN 'standby'
          ELSE 'offline'
        END AS status
    FROM employees e
    JOIN positions p ON p.id = e.position_id
    WHERE p.name IN ('Housekeeping Supervisor', 'Housekeeping Staff')
    ORDER BY e.full_name
  `);

  res.json({ success: true, data: rows });
});

module.exports = { getStaffOverview };