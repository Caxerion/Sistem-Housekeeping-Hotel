-- /database/data_dummies/rooms.sql
-- Data Dummy untuk table rooms: table kamar total ada 250 Kamar

-- Settings: 
-- Lantai 1 & 2: Standard Room (100 Kamar)
-- Lantai 3: Superior Room (50 Kamar)
-- Lantai 4: Deluxe Room (50 Kamar)
-- Lantai 5: Executive Suite (40 Kamar) & Presidential Suite (10 Kamar Eksklusif)

USE hotel_db;

-- Kosongkan tabel jika sebelumnya sudah terlanjur menjalankan seeder sebelumnya
-- TRUNCATE TABLE rooms; 


-- ================================================================
-- WARNING: Pastikan sudah menjalankan script room_types.sql!!  !!!
-- ================================================================
-- SEEDER: rooms (Generate 250 Kamar dengan Looping)
DELIMITER //

CREATE PROCEDURE GenerateDummyRooms()
BEGIN
    DECLARE floor_num INT DEFAULT 1;
    DECLARE room_num_on_floor INT;
    DECLARE room_number_str VARCHAR(10);
    DECLARE current_type_id INT;

    -- Loop Lantai 1 sampai 5
    WHILE floor_num <= 5 DO
        SET room_num_on_floor = 1;

        -- Loop 50 Kamar per Lantai
        WHILE room_num_on_floor <= 50 DO
            
            -- Penomoran murni (101, 102, ..., 550)
            SET room_number_str = CONCAT(floor_num, LPAD(room_num_on_floor, 2, '0'));

            -- Pembagian Tipe Kamar berdasarkan Lantai
            IF floor_num = 1 OR floor_num = 2 THEN
                SET current_type_id = 1; -- Lantai 1 & 2 (101-250): Standard Room
            ELSEIF floor_num = 3 THEN
                SET current_type_id = 2; -- Lantai 3 (301-350): Superior Room
            ELSEIF floor_num = 4 THEN
                SET current_type_id = 3; -- Lantai 4 (401-450): Deluxe Room
            ELSEIF floor_num = 5 THEN
                IF room_num_on_floor <= 40 THEN
                    SET current_type_id = 4; -- Kamar 501-540: Executive Suite
                ELSE
                    SET current_type_id = 5; -- Kamar 541-550: Presidential Suite
                END IF;
            END IF;

            -- LANGSUNG SET SEMUA KAMAR MENJADI 'available' (Tersedia)
            INSERT INTO rooms (room_type_id, room_number, status)
            VALUES (current_type_id, room_number_str, 'available');

            SET room_num_on_floor = room_num_on_floor + 1;
        END WHILE;

        SET floor_num = floor_num + 1;
    END WHILE;
END //

DELIMITER ;

CALL GenerateDummyRooms();

DROP PROCEDURE IF EXISTS GenerateDummyRooms;