const pool = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

const getRoomLogs = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT 
            r.room_number,
            u1.username AS check_in_by,
            rr.checked_in_at,
            u2.username AS check_out_by,
            rr.checked_out_at,
            rr.room_status
        FROM reservation_rooms rr
        JOIN rooms r ON r.id = rr.room_id
        LEFT JOIN users u1 ON u1.id = rr.check_in_by
        LEFT JOIN users u2 ON u2.id = rr.check_out_by
        WHERE rr.checked_in_at IS NOT NULL OR rr.checked_out_at IS NOT NULL
        ORDER BY COALESCE(rr.checked_out_at, rr.checked_in_at) DESC
    `);

    res.json({ success: true, data: rows });
});

module.exports = { getRoomLogs };
