-- /database/data_dummies/amenities.sql
-- Data Dummy untuk table amenities: table fasilitas kamar (hotel)

USE hotel_db;

-- Kosongkan tabel jika sebelumnya sudah terlanjur menjalankan seeder sebelumnya
-- TRUNCATE TABLE amenities; 


-- SEEDER: amenities (ICON - Lucide React)
-- ICON REFERENCES https://lucide.dev/icons
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

