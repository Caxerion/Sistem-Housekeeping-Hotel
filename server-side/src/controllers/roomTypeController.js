const pool = require('../config/db');

const getRoomTypes = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
            id,
            name,
            base_price
            FROM room_types
            ORDER BY base_price ASC
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

module.exports = { getRoomTypes };