-- Trigger untuk sinkronisasi status kamar dengan maintenance schedule
-- Room 101 bisa di-maintenance oleh banyak staff secara bersamaan
-- Room baru 'available' hanya ketika SEMUA maintenance aktif selesai/dibatalkan

USE hotel_db;

DELIMITER //

-- Trigger AFTER INSERT: kalau langsung dibuat dengan status 'in_progress',
-- set kamar menjadi 'maintenance'
CREATE TRIGGER IF NOT EXISTS trg_maintenance_schedule_insert
AFTER INSERT ON room_maintenance_schedule
FOR EACH ROW
BEGIN
    IF NEW.status = 'in_progress' THEN
        UPDATE rooms
        SET status = 'maintenance'
        WHERE id = NEW.room_id;
    END IF;
END //

-- Trigger AFTER UPDATE: sinkronisasi ketika status berubah
CREATE TRIGGER IF NOT EXISTS trg_maintenance_schedule_update
AFTER UPDATE ON room_maintenance_schedule
FOR EACH ROW
BEGIN
    -- Jadwal maintenance resmi dimulai
    IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
        UPDATE rooms
        SET status = 'maintenance'
        WHERE id = NEW.room_id;
    END IF;

    -- Maintenance selesai atau dibatalkan dari status aktif
    IF OLD.status IN ('scheduled', 'in_progress') AND NEW.status IN ('completed', 'canceled') THEN
        IF NOT EXISTS (
            SELECT 1 FROM room_maintenance_schedule
            WHERE room_id = NEW.room_id AND status IN ('scheduled', 'in_progress')
        ) THEN
            UPDATE rooms
            SET status = 'available'
            WHERE id = NEW.room_id;
        END IF;
    END IF;
END //

DELIMITER ;
