-- /database/data_dummies/room_types.sql
-- Data Dummy untuk table room_types: table kelas dari ruangan

-- Settings: 
-- Lantai 1 & 2: Standard Room (100 Kamar)
-- Lantai 3: Superior Room (50 Kamar)
-- Lantai 4: Deluxe Room (50 Kamar)
-- Lantai 5: Executive Suite (40 Kamar) & Presidential Suite (10 Kamar Eksklusif)

USE hotel_db;

-- Kosongkan tabel jika sebelumnya sudah terlanjur menjalankan seeder sebelumnya
-- TRUNCATE TABLE room_types; 


-- SEEDER: room_types (Kelas Kamar)
INSERT INTO room_types (id, name, base_price, description) VALUES
(1, 'Standard Room', 450000.00, 'Kamar yang nyaman dan efisien dengan fasilitas esensial, cocok untuk pelancong bisnis atau liburan singkat.'),
(2, 'Superior Room', 600000.00, 'Kamar yang lebih luas dengan desain interior modern, dilengkapi dengan area kerja khusus yang nyaman.'),
(3, 'Deluxe Room', 850000.00, 'Kamar mewah dengan pemandangan kota yang menawan, area duduk bersantai, dan ranjang ukuran king premium.'),
(4, 'Executive Suite', 1500000.00, 'Suite luas dengan ruang tamu terpisah, akses ke Executive Lounge, dan mesin pembuat espresso pribadi.'),
(5, 'Presidential Suite', 3500000.00, 'Kemewahan paripurna dengan ruang makan tamu, jacuzzi pribadi, dan pemandangan panorama sudut kota.');