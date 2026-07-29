-- database/seeders/inventory.seeder.sql
-- Seed data untuk inventory_categories & inventory_items
-- Jalankan setelah init.sql (tabel sudah harus ada)

USE hotel_db;

-- 1. Seed kategori
INSERT INTO inventory_categories (name, description) VALUES
('Linen', 'Handuk, seprei, sarung bantal, dll'),
('Toiletries', 'Sabun, sampo, perlengkapan mandi tamu'),
('Cleaning Supplies', 'Cairan pembersih dan alat kebersihan umum'),
('Antiseptik', 'Cairan/perlengkapan antiseptik dan disinfektan')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 2. Seed barang (category_id diambil via subquery berdasarkan nama kategori)
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