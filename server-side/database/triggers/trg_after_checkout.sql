-- TRIGGER AFTER CHECKOUT
use hotel_db

DELIMITER //

CREATE TRIGGER trg_after_checkout
AFTER UPDATE ON reservation_rooms
FOR EACH ROW
BEGIN
    -- Jika status sebelumnya bukan checked_out, dan status yang baru adalah checked_out
    IF OLD.status != 'checked_out' AND NEW.status = 'checked_out' THEN
        UPDATE rooms
        -- Ubah status kamar menjadi tersedia/available dan kondisi kotor/dirty
        SET status = 'available', 
            clean_status = 'dirty'
        WHERE id = NEW.room_id;  -- NEW.room_id adalah room_id dari row reservation_rooms yang terupdate
    END IF;
END //

DELIMITER ; 