const pool = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

const getRiwayatPembersihan = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
       SELECT
        rms.id AS id,
        r.room_number,
        rt.name AS room_type,
        rms.title,
        rms.notes,
        rms.completed_at AS cleaned_at
    FROM room_maintenance_schedule rms
    JOIN rooms r ON r.id = rms.room_id
    JOIN room_types rt ON rt.id = r.room_type_id
    WHERE rms.status = 'completed'
    ORDER BY rms.completed_at DESC 
    `);

    const scheduleIds = rows.map((row) => row.id);
    let staffMap = {};

    if (scheduleIds.length > 0) {
        const [staffRows] = await pool.query(
            `SELECT rss.schedule_id, e.full_name
         FROM room_maintenance_schedule_staff rss
         JOIN employees e ON e.id = rss.employee_id
        WHERE rss.schedule_id IN (?)`,
            [scheduleIds]
        );
        staffRows.forEach((row) => {
            if (!staffMap[row.schedule_id]) staffMap[row.schedule_id] = [];
            staffMap[row.schedule_id].push(row.full_name);
        });
    }

    const data = rows.map((r) => ({
        id: r.id,
        room_number: r.room_number,
        room_type: r.room_type,
        employee_name: (staffMap[r.id] || []).join(', ') || '-',
        action_note: [r.title, r.notes].filter(Boolean).join(' — ') || null,
        cleaned_at: r.cleaned_at,
    }));

    res.json({ success: true, data });
});

const deleteAllRiwayat = asyncHandler(async (req, res) => {
    const [result] = await pool.query(
        `DELETE FROM room_maintenance_schedule WHERE status = 'completed'`
    );

    res.json({
        success: true,
        message: `Berhasil menghapus ${result.affectedRows} riwayat pembersihan.`,
    });
});

module.exports = { getRiwayatPembersihan, deleteAllRiwayat };