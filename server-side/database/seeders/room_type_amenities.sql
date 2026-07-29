-- /database/data_dummies/room_type_amenities.sql
-- Data Dummy untuk table room_type_amenities: table fasilitas kamar (hotel)

USE hotel_db;

-- Kosongkan tabel jika sebelumnya sudah terlanjur menjalankan seeder sebelumnya
-- TRUNCATE TABLE room_type_amenities; 

-- WARNING: Pastikan sudah menjalankan script amenities.sql dan room_types.sql
-- SEEDER: room_type_amenities (Relasi Fasilitas & Kamar)
-- Standard (1): AC, WiFi, TV, Safe
INSERT INTO room_type_amenities (room_type_id, amenity_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4);

-- Superior (2): AC, WiFi, TV, Safe, Coffee Maker
INSERT INTO room_type_amenities (room_type_id, amenity_id) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), (2, 6);

-- Deluxe (3): AC, WiFi, TV, Safe, Mini Bar, Coffee Maker, View
INSERT INTO room_type_amenities (room_type_id, amenity_id) VALUES
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 8);

-- Executive Suite (4): Semua + Bathtub & Living Area (tanpa beberapa spesifik VIP)
INSERT INTO room_type_amenities (room_type_id, amenity_id) VALUES
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 7), (4, 8), (4, 9);

-- Presidential (5): Dapat semua fasilitas lengkap
INSERT INTO room_type_amenities (room_type_id, amenity_id) VALUES
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6), (5, 7), (5, 8), (5, 9);