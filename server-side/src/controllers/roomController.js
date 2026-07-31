const pool = require('../config/db');

const getAllRooms = async (req, res) => {
    const [rows] =await pool.query(`
        SELECT
        r.id,
        r.room_number,
        r.room_type_id,
        r.occupancy_status,
        r.housekeeping_status,
        rt.name AS room_type,
        rt.base_price
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.id
    ORDER BY r.room_number ASC
    `);
    res.json({ success: true, data: rows });
};

const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            room_number,
            room_type_id,
            occupancy_status,
            housekeeping_status
        } = req.body;
        await pool.query(`
            UPDATE rooms SET
            room_number = ?,
            room_type_id = ?,
            occupancy_status = ?,
            housekeeping_status = ?
            WHERE id = ? `, [ room_number, room_type_id, occupancy_status, housekeeping_status, id ]
        );
        res.json({ success: true, message: "Data kamar berhasil diperbarui" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Gagal mengupdate kamar" });
    }
};

module.exports = { getAllRooms, updateRoom };
