-- /database/data_dummies/positions.sql
-- Data Dummy untuk table positions: table jabatan untuk pegawai hotel

USE hotel_db;

-- Kosongkan tabel jika sebelumnya sudah terlanjur menjalankan seeder sebelumnya
-- TRUNCATE TABLE positions; 


-- SEEDER: positions (Jabatan / Role Pegawai)
INSERT INTO positions (id, name, description) VALUES
(1, 'Super Admin', 'Administrator sistem TI yang mengelola hak akses dan konfigurasi sistem'),
(2, 'General Manager', 'Manajemen eksekutif puncak yang memantau laporan analitik dan kinerja hotel'),
(3, 'Front Office Manager', 'Kepala bagian resepsionis dan layanan reservasi tamu'),
(4, 'Front Office Staff', 'Staf resepsionis yang menangani reservasi, check-in, dan check-out'),
(5, 'Housekeeping Supervisor', 'Pengawas kebersihan dan kondisi kelayakan kamar hotel'),
(6, 'Housekeeping Staff', 'Petugas pembersih kamar dan pemeliharaan fasilitas'),
(7, 'Finance Manager', 'Pengelola laporan keuangan, pembayaran, dan akuntansi hotel');