const pool = require('../config/db');

const getAllRooms = async (req, res) => {
    const [rows] =await pool.query(`
        SELECT
        r.id,
        r.room_number,
        r.status,
        rt.name AS room_type,
        rt.base_price
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.id
    ORDER BY r.room_number ASC
    `);
    res.json({ success: true, data: rows });
};

module.exports = { getAllRooms };