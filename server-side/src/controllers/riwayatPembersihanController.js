const pool = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

const getRiwayatPembersihan = asyncHandler(async (req, res) => {
    const [maintenanceRows] = await pool.query(`
       SELECT
        rms.id AS id,
        r.room_number,
        rt.name AS room_type,
        rms.title,
        rms.notes,
        rms.created_at,
        rms.started_at,
        rms.completed_at AS ended_at,
        'maintenance' AS type
    FROM room_maintenance_schedule rms
    JOIN rooms r ON r.id = rms.room_id
    JOIN room_types rt ON rt.id = r.room_type_id
    WHERE rms.status = 'completed'
    `);

    const [cleaningRows] = await pool.query(`
       SELECT
        rcs.id AS id,
        r.room_number,
        rt.name AS room_type,
        rcs.title,
        rcs.notes,
        rcs.created_at,
        rcs.started_at,
        rcs.completed_at AS ended_at,
        'pembersihan' AS type
    FROM room_cleaning_schedule rcs
    JOIN rooms r ON r.id = rcs.room_id
    JOIN room_types rt ON rt.id = r.room_type_id
    WHERE rcs.status = 'completed'
    `);

    const rows = [...maintenanceRows, ...cleaningRows].sort((a, b) => new Date(b.ended_at || b.created_at) - new Date(a.ended_at || a.created_at));
    const scheduleIds = rows.map((row) => row.id);
    const maintenanceIds = maintenanceRows.map((row) => row.id);
    const cleaningIds = cleaningRows.map((row) => row.id);
    let staffMap = {};

    if (maintenanceIds.length > 0) {
        const [maintenanceStaffRows] = await pool.query(
            `SELECT rss.schedule_id, e.full_name, e.id AS employee_id
             FROM room_maintenance_schedule_staff rss
             JOIN employees e ON e.id = rss.employee_id
             WHERE rss.schedule_id IN (?)`,
            [maintenanceIds]
        );
        maintenanceStaffRows.forEach((row) => {
            if (!staffMap[row.schedule_id]) staffMap[row.schedule_id] = { names: [], ids: [] };
            if (!staffMap[row.schedule_id].ids.includes(row.employee_id)) {
                staffMap[row.schedule_id].names.push(row.full_name);
                staffMap[row.schedule_id].ids.push(row.employee_id);
            }
        });
    }

    if (cleaningIds.length > 0) {
        const [cleaningStaffRows] = await pool.query(
            `SELECT rss.schedule_id, e.full_name, e.id AS employee_id
             FROM room_cleaning_schedule_staff rss
             JOIN employees e ON e.id = rss.employee_id
             WHERE rss.schedule_id IN (?)`,
            [cleaningIds]
        );
        cleaningStaffRows.forEach((row) => {
            if (!staffMap[row.schedule_id]) staffMap[row.schedule_id] = { names: [], ids: [] };
            if (!staffMap[row.schedule_id].ids.includes(row.employee_id)) {
                staffMap[row.schedule_id].names.push(row.full_name);
                staffMap[row.schedule_id].ids.push(row.employee_id);
            }
        });
    }

    const data = rows.map((r) => {
        const staff = staffMap[r.id] || { names: [], ids: [] };
        return {
            id: r.id,
            room_number: r.room_number,
            room_type: r.room_type,
            employee_name: staff.names.join(', ') || '-',
            employee_ids: staff.ids,
            action_note: [r.title, r.notes].filter(Boolean).join(' — ') || null,
            created_at: r.created_at,
            started_at: r.started_at,
            ended_at: r.ended_at,
            type: r.type,
        };
    });

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