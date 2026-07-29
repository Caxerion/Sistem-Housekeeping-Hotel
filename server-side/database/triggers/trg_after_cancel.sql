-- TRIGGER AFTER CANCEL

use hotel_db;

DELIMITER //

CREATE TRIGGER trg_room_status_on_cancelled
AFTER UPDATE ON reservation_rooms
FOR EACH ROW
BEGIN
    -- Cek jika status berubah menjadi 'cancelled' dan status sebelumnya bukan 'cancelled'
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
        
        -- Cek apakah tanggal check_in yang dijadwalkan adalah hari ini?
        IF NEW.check_in_date = CURDATE() THEN
            
            -- Jika ya (dibatalkan pada hari H / hari ini), kembalikan status kamar menjadi 'available' (sebelumnya reserved)
            UPDATE rooms
            SET status = 'available'
            WHERE id = NEW.room_id;
            
        END IF;
        
    END IF;
END //

DELIMITER ;