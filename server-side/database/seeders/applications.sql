-- /database/data_dummies/applications.sql
-- Data Dummy untuk table applications: table aplikasi internal hotel

USE hotel_db;

-- Kosongkan tabel jika sebelumnya sudah terlanjur menjalankan seeder sebelumnya
-- TRUNCATE TABLE applications; 

-- SEEDER: applications (Master Table Aplikasi)
INSERT INTO applications (id, name, description) VALUES
(1, 'Admin Panel & Config', 'Aplikasi pusat pengaturan pengguna, master data kamar, dan hak akses'),
(2, 'Front Office POS', 'Aplikasi kasir resepsionis untuk pemesanan, check-in, check-out, dan pembayaran'),
(3, 'Housekeeping Management', 'Aplikasi pencatatan status kebersihan kamar dan log pembersihan'),
(4, 'Executive & Finance Dashboard', 'Aplikasi laporan analisis pendapatan, histori refund, dan keterisian kamar');