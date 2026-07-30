-- Set Event Scheduler aktif di server, untuk memastikan event_scheduler sudah berjalan
SET GLOBAL event_scheduler = ON;


DROP EVENT IF EXISTS ev_auto_update_to_reserved;
DELIMITER //

CREATE EVENT ev_auto_lock_reserved_rooms
ON SCHEDULE EVERY 1 DAY
STARTS '29'
STARTS CONCAT(CURDATE() + INTERVAL 1 DAY, ' 00:01:00') -- dimulai besok pukul 00:01
DO
BEGIN
    -- Mengubah status kamar di tabel rooms menjadi 'reserved' 
    -- untuk reservasi yang tanggal check-in-nya jatuh pada hari ini 
    UPDATE rooms r
    JOIN reservation_rooms rr ON r.id = rr.room_id
    JOIN reservations res ON rr.reservation_id = res.id
    SET r.status = 'reserved'
    WHERE rr.check_in_date = CURDATE() 
      AND rr.room_status = 'booked'
      AND res.status = 'confirmed';
END //

DELIMITER ;


-- Update langsung sekarang: uncomment query dibawah
-- UPDATE rooms r
-- JOIN reservation_rooms rr ON r.id = rr.room_id
-- JOIN reservations res ON rr.reservation_id = res.id
-- SET r.status = 'reserved'
-- WHERE rr.check_in_date <= CURDATE() 
--   AND rr.room_status = 'booked'
--   AND res.status = 'confirmed';


-- next update wajib tambah index check_in_date, status, room_status