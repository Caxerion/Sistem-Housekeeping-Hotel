const pool = require('../config/db');

const getAllRooms = async (req, res) => {
  const [rows] = await pool.query(`
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

// PARTIAL UPDATE: hanya kolom yang benar-benar dikirim di req.body yang di-UPDATE.
// Ini mencegah field yang tidak dikirim (misal occupancy_status/housekeeping_status
// saat form cuma edit room_number/room_type_id) ikut ke-overwrite jadi NULL/default
// oleh MySQL, yang sebelumnya diam-diam mereset kamar 'maintenance' balik ke 'available'.
const ALLOWED_FIELDS = ['room_number', 'room_type_id', 'occupancy_status', 'housekeeping_status'];

const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // Ambil cuma field yang ada di body DAN termasuk kolom yang diizinkan
    const fieldsToUpdate = Object.keys(req.body).filter(
      (key) => ALLOWED_FIELDS.includes(key) && req.body[key] !== undefined
    );

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada field valid yang dikirim untuk diperbarui.',
      });
    }

    const setClause = fieldsToUpdate.map((field) => `${field} = ?`).join(', ');
    const values = fieldsToUpdate.map((field) => req.body[field]);

    const [result] = await pool.query(
      `UPDATE rooms SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Kamar tidak ditemukan.' });
    }

    res.json({
      success: true,
      message: 'Data kamar berhasil diperbarui',
      data: { updatedFields: fieldsToUpdate },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal mengupdate kamar' });
  }
};

module.exports = { getAllRooms, updateRoom };