-- TRIGGER AFTER CHECKIN

use hotel_db;

DELIMITER //

CREATE TRIGGER after_room_check_in
AFTER UPDATE ON reservation_rooms
FOR EACH ROW
BEGIN
    -- Jika status reservasi kamar berubah menjadi 'checked_in'
    IF NEW.status = 'checked_in' AND OLD.status != 'checked_in' THEN
        -- Ubah status kamar menjadi terisi/occupied
        UPDATE rooms 
        SET status = 'occupied'
        WHERE id = NEW.room_id; 
    END IF;
END //

DELIMITER ;