-- Trigger untuk sinkronisasi status kamar dengan maintenance schedule

USE hotel_db;

DELIMITER //

-- Trigger AFTER INSERT: kalau langsung dibuat dengan status 'in_progress'
-- (misal set_immediately = true), kamar langsung masuk maintenance
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

    -- Maintenance selesai atau dibatalkan dari status in_progress
    IF OLD.status = 'in_progress' AND NEW.status IN ('completed', 'canceled') THEN
        UPDATE rooms
        SET status = 'available'
        WHERE id = NEW.room_id;
    END IF;
END //

DELIMITER ;
