-- /database/data_dummies/employees.sql
-- Data Dummy untuk table employees: table pegawai hotel

USE hotel_db;

-- Kosongkan tabel jika sebelumnya sudah terlanjur menjalankan seeder sebelumnya
-- TRUNCATE TABLE employees; 

-- WARNING: Pastikan sudah menjalankan script positions.sql !!

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