
USE hotel_db;

-- SEEDER: amenities (ICON - Lucide React)
INSERT INTO amenities (id, name, icon, description) VALUES
(1, 'Air Conditioner', 'AirVent', 'AC Split dengan pengatur suhu mandiri'),
(2, 'High-Speed WiFi', 'Wifi', 'Koneksi internet tanpa kabel berkecepatan tinggi gratis'),
(3, 'Smart TV', 'Tv', 'Smart TV 43" - 55" dengan akses Netflix dan YouTube'),
(4, 'Safe Deposit Box', 'Vault', 'Brankas digital di dalam kamar untuk menyimpan barang berharga'),
(5, 'Mini Bar', 'Refrigerator', 'Kulkas mini berisi pilihan makanan ringan dan minuman dingin'),
(6, 'Coffee/Tea Maker', 'Coffee', 'Fasilitas pembuat kopi dan teh gratis setiap hari'),
(7, 'Bathtub', 'Bath', 'Bathtub berendam air panas dan dingin dengan perlengkapan mandi premium'),
(8, 'City/Ocean View', 'Sunset', 'Jendela besar dengan pemandangan laut atau pusat kota'), 
(9, 'Living Area', 'Sofa', 'Area ruang tamu terpisah dengan sofa yang nyaman');

-- 1. SEEDER: room_types (Kelas Kamar)
INSERT INTO room_types (id, name, base_price, description) VALUES
(1, 'Standard Room', 450000.00, 'Kamar yang nyaman dan efisien dengan fasilitas esensial, cocok untuk pelancong bisnis atau liburan singkat.'),
(2, 'Superior Room', 600000.00, 'Kamar yang lebih luas dengan desain interior modern, dilengkapi dengan area kerja khusus yang nyaman.'),
(3, 'Deluxe Room', 850000.00, 'Kamar mewah dengan pemandangan kota yang menawan, area duduk bersantai, dan ranjang ukuran king premium.'),
(4, 'Executive Suite', 1500000.00, 'Suite luas dengan ruang tamu terpisah, akses ke Executive Lounge, dan mesin pembuat espresso pribadi.'),
(5, 'Presidential Suite', 3500000.00, 'Kemewahan paripurna dengan ruang makan tamu, jacuzzi pribadi, dan pemandangan panorama sudut kota.');

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

-- 4. SEEDER: rooms (Generate 250 Kamar dengan Looping)
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

-- SEEDER: positions (Jabatan / Role Pegawai)
INSERT INTO positions (id, name, description) VALUES
(1, 'Super Admin', 'Administrator sistem TI yang mengelola hak akses dan konfigurasi sistem'),
(2, 'General Manager', 'Manajemen eksekutif puncak yang memantau laporan analitik dan kinerja hotel'),
(3, 'Front Office Manager', 'Kepala bagian resepsionis dan layanan reservasi tamu'),
(4, 'Front Office Staff', 'Staf resepsionis yang menangani reservasi, check-in, dan check-out'),
(5, 'Housekeeping Supervisor', 'Pengawas kebersihan dan kondisi kelayakan kamar hotel'),
(6, 'Housekeeping Staff', 'Petugas pembersih kamar dan pemeliharaan fasilitas'),
(7, 'Finance Manager', 'Pengelola laporan keuangan, pembayaran, dan akuntansi hotel');

-- SEEDER: employees (Data Profil Karyawan)
INSERT INTO employees (id, employee_code, full_name, phone, email, position_id, status) VALUES
(1, 'EMP-2026-001', 'Budi Hermawan, S.Kom', '081234567801', 'budi.admin@hotel.com', 1, 'active'),
(2, 'EMP-2026-002', 'Hendra Wijaya', '081234567802', 'hendra.gm@hotel.com', 2, 'active'),
(3, 'EMP-2026-003', 'Siti Rahmawati', '081234567803', 'siti.fom@hotel.com', 3, 'active'),
(4, 'EMP-2026-004', 'Dewi Lestari', '081234567804', 'dewi.fo@hotel.com', 4, 'active'),
(5, 'EMP-2026-005', 'Rizky Pratama', '081234567805', 'rizky.fo@hotel.com', 4, 'active'),
(6, 'EMP-2026-006', 'Agus Supriyanto', '081234567806', 'agus.hk@hotel.com', 5, 'active'),
(7, 'EMP-2026-007', 'Bambang Triyono', '081234567807', 'bambang.hk@hotel.com', 6, 'active'),
(8, 'EMP-2026-008', 'Maya Kartika', '081234567808', 'maya.finance@hotel.com', 7, 'active');

-- SEEDER: users (Akun Autentikasi Login)
INSERT INTO users (id, employee_id, username, password, is_active) VALUES
-- perbaikan pada input is_active, seharusnya awalan false.
(1, 1, 'admin', '$2a$12$WFrbN4/GRt4fKQqFDIbgiORJUgb1XADP3.7LUmhFS04WNgkVg3vCK', TRUE),
(2, 2, 'gm_hendra', '$2a$12$WFrbN4/GRt4fKQqFDIbgiORJUgb1XADP3.7LUmhFS04WNgkVg3vCK', TRUE),
(3, 3, 'fom_siti', '$2a$12$WFrbN4/GRt4fKQqFDIbgiORJUgb1XADP3.7LUmhFS04WNgkVg3vCK', TRUE),
(4, 4, 'fo_dewi', '$2a$12$WFrbN4/GRt4fKQqFDIbgiORJUgb1XADP3.7LUmhFS04WNgkVg3vCK', TRUE),
(5, 5, 'fo_rizky', '$2a$12$WFrbN4/GRt4fKQqFDIbgiORJUgb1XADP3.7LUmhFS04WNgkVg3vCK', TRUE),
(6, 6, 'hk_agus', '$2a$12$WFrbN4/GRt4fKQqFDIbgiORJUgb1XADP3.7LUmhFS04WNgkVg3vCK', TRUE),
(7, 7, 'hk_bambang', '$2a$12$WFrbN4/GRt4fKQqFDIbgiORJUgb1XADP3.7LUmhFS04WNgkVg3vCK', TRUE),
(8, 8, 'finance_maya', '$2a$12$WFrbN4/GRt4fKQqFDIbgiORJUgb1XADP3.7LUmhFS04WNgkVg3vCK', TRUE);

-- SEEDER: applications (Master Table Aplikasi)
INSERT INTO applications (id, name, description) VALUES
(1, 'Admin Panel & Config', 'Aplikasi pusat pengaturan pengguna, master data kamar, dan hak akses'),
(2, 'Front Office POS', 'Aplikasi kasir resepsionis untuk pemesanan, check-in, check-out, dan pembayaran'),
(3, 'Housekeeping Management', 'Aplikasi pencatatan status kebersihan kamar dan log pembersihan'),
(4, 'Executive & Finance Dashboard', 'Aplikasi laporan analisis pendapatan, histori refund, dan keterisian kamar');

-- SEEDER: application_users (Hak Akses Spesifik Aplikasi)
-- Role yang tersedia di enum: 'admin' & 'staff'
INSERT INTO application_users (application_id, user_id, role) VALUES
-- Admin IT (User ID 1): Punya akses Admin di Admin Panel & Front Office
(1, 1, 'admin'),
(2, 1, 'admin'),

-- General Manager (User ID 2): Punya akses Manager di Dashboard Eksekutif
(4, 2, 'admin'),

-- Front Office Manager (User ID 3): Manager di Front Office POS
(2, 3, 'admin'),

-- Front Office Staff (User ID 4 & 5): Staff di Front Office POS
(2, 4, 'staff'),
(2, 5, 'staff'),

-- Housekeeping Supervisor (User ID 6): Manager di Housekeeping App
(3, 6, 'admin'),

-- Housekeeping Staff (User ID 7): Staff di Housekeeping App
(3, 7, 'staff'),

-- Finance Manager (User ID 8): Manager di Dashboard Finance
(4, 8, 'admin');

-- ============================================================
-- Inventory Categories & Items
-- ============================================================

INSERT INTO inventory_categories (name, description) VALUES
('Linen', 'Handuk, seprei, sarung bantal, dll'),
('Toiletries', 'Sabun, sampo, perlengkapan mandi tamu'),
('Cleaning Supplies', 'Cairan pembersih dan alat kebersihan umum'),
('Antiseptik', 'Cairan/perlengkapan antiseptik dan disinfektan')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO inventory_items (category_id, name, unit, current_stock, minimum_stock) VALUES
((SELECT id FROM inventory_categories WHERE name = 'Linen'), 'Handuk Mandi', 'pcs', 80, 20),
((SELECT id FROM inventory_categories WHERE name = 'Toiletries'), 'Sabun Mandi', 'botol', 150, 30),
((SELECT id FROM inventory_categories WHERE name = 'Cleaning Supplies'), 'Cairan Pembersih Lantai', 'botol', 8, 10),
((SELECT id FROM inventory_categories WHERE name = 'Antiseptik'), 'Hand Sanitizer', 'botol', 40, 15),
((SELECT id FROM inventory_categories WHERE name = 'Antiseptik'), 'Cairan Disinfektan Permukaan', 'liter', 12, 15),
((SELECT id FROM inventory_categories WHERE name = 'Antiseptik'), 'Alkohol 70%', 'botol', 25, 10)
ON DUPLICATE KEY UPDATE
  unit = VALUES(unit),
  current_stock = VALUES(current_stock),
  minimum_stock = VALUES(minimum_stock);