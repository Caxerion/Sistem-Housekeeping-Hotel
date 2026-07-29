-- /database/data_dummies/application_users.sql
-- Data Dummy untuk table application_users: table pivot applications dan users

USE hotel_db;

-- Kosongkan tabel jika sebelumnya sudah terlanjur menjalankan seeder sebelumnya
-- TRUNCATE TABLE application_users; 

-- WARNING: Pastikan sudah menjalankan script applications.sql dan users.sql
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