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
          WHEN active.employee_id IS NOT NULL THEN 'on_duty'
          ELSE 'offline'
        END AS status
    FROM employees e
    JOIN positions p ON p.id = e.position_id
    LEFT JOIN (
        SELECT DISTINCT rss.employee_id
        FROM room_maintenance_schedule_staff rss
        JOIN room_maintenance_schedule rms ON rms.id = rss.schedule_id
        WHERE rms.status = 'in_progress'
    ) active ON active.employee_id = e.id
    WHERE p.name IN ('Housekeeping Supervisor', 'Housekeeping Staff')
    ORDER BY e.full_name
  `);
 
  res.json({ success: true, data: rows });
});

module.exports = { getStaffOverview };