-- =============== ===
--  DATABASE HOTEL ===
-- =============== ===

CREATE DATABASE IF NOT EXISTS hotel_db;
USE hotel_db;


-- 1. MASTER TABLE: positions (Jabatan / Role)
CREATE TABLE IF NOT EXISTS positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Contoh: 'Admin', 'Front Office', 'Housekeeping'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- 2. TABLE: employees (Data Profil Pegawai & Jabatan)
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_code VARCHAR(30) NOT NULL UNIQUE, 
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE,
    position_id INT NOT NULL, -- Jabatan
    status ENUM('active', 'inactive', 'resigned') DEFAULT 'active', -- Status pegawai, jika resigned maka akunnya tidak bisa dipakai (block)s
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT,
    INDEX idx_employee_name (full_name)
);


-- 3. TABLE: users (Data Autentikasi)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL UNIQUE, -- 1 Karyawan = 1 Akun
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Hashed dengan bcrypt
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- updated_at berfungsi ganda: mencatat perubahan data sekaligus penanda last_login jika is_active off
    -- (saat sistem mengupdate sesi/token login, kolom ini akan otomatis berubah)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Jika data pegawai dihapus, akun loginnya otomatis terhapus
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
-- 4. MASTER TABLE: applications (Daftar Aplikasi Sistem)
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Contoh: 'Front Office', 'Housekeeping', 'Admin Panel'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO applications (id, name, description) VALUES
(1, 'Admin Panel & Config', 'Aplikasi pusat pengaturan pengguna, master data kamar, dan hak akses'),
(2, 'Supervisor', 'Aplikasi untuk supervisor untuk mengawasi dan mengelola operasional hotel'),
(3, 'Front Office POS', 'Aplikasi kasir resepsionis untuk pemesanan, check-in, check-out, dan pembayaran'),
(4, 'Housekeeping Management', 'Aplikasi pencatatan status kebersihan kamar dan log pembersihan'),
(5, 'Executive & Finance Dashboard', 'Aplikasi laporan analisis pendapatan, histori refund, dan keterisian kamar');
-- 5. PIVOT TABLE: application_users (Hak Akses Aplikasi)
CREATE TABLE IF NOT EXISTS application_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('admin', 'staff') DEFAULT 'staff', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE, 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, 
    CONSTRAINT unique_application_user UNIQUE (application_id, user_id)
);


-- 6. MASTER TABLE: supervisors (Supervisor Auth)
CREATE TABLE IF NOT EXISTS supervisors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. MASTER TABLE: room_types (Tipe Kamar)
CREATE TABLE IF NOT EXISTS room_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Contoh: Standard, Deluxe, Presidential Suite
    base_price DECIMAL(10, 2) NOT NULL, -- Harga terpusat di sini
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- 8. TABLE: rooms (Data Fisik Kamar)
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_type_id INT NOT NULL,
    room_number VARCHAR(10) NOT NULL UNIQUE,
    status ENUM('available','reserved','occupied','maintenance') DEFAULT 'available', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE RESTRICT
);

-- 9. MASTER TABLE: amenities (Daftar Fasilitas)
CREATE TABLE IF NOT EXISTS amenities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Contoh: AC, Smart TV, WiFi, Mini Fridge, Bathtub
    icon VARCHAR(50), -- Sangat berguna untuk frontend/UI (misal pake ikon dari FontAwesome atau Material UI)
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 10. PIVOT TABLE: room_type_amenities (Relasi N:M)
CREATE TABLE IF NOT EXISTS room_type_amenities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_type_id INT NOT NULL,
    amenity_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE,
    CONSTRAINT unique_type_amenity UNIQUE (room_type_id, amenity_id)
);


-- 11. MASTER TABLE: guests | tamu
CREATE TABLE IF NOT EXISTS guests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender ENUM('male','female'),
    -- Identity
    identity_type ENUM('identity_card', 'passport') NOT NULL, 
    identity_number VARCHAR(50) NOT NULL UNIQUE, 
    -- Contact
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- 1. HEADER TABLE: reservations (Parents)
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_code VARCHAR(30) NOT NULL UNIQUE, 
    guest_id INT NOT NULL,     
    user_id INT NOT NULL,      -- Pegawai (Resepsionis) yang membuat pesanan
    status ENUM('pending', 'confirmed', 'active', 'completed', 'canceled') DEFAULT 'pending',    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);
-- 2. DETAIL TABLE: reservation_rooms (Kamar yang Dipesan)
CREATE TABLE IF NOT EXISTS reservation_rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    room_id INT NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL, -- Harga snapshot saat pesanan dibuat 
    -- Jumlah tamu yang menempati kamar
    total_adults INT DEFAULT 1,
    total_children INT DEFAULT 0,
    -- Rencana
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    room_status ENUM('booked', 'checked_in', 'checked_out', 'canceled') DEFAULT 'booked',    
    -- Yang Terjadi
    checked_in_at TIMESTAMP NULL,
    check_in_by INT NULL, 
    checked_out_at TIMESTAMP NULL,
    check_out_by INT NULL, 
    
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    FOREIGN KEY (check_in_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (check_out_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_dates CHECK (check_out_date > check_in_date),
    INDEX idx_room_availability (room_id, room_status, check_in_date, check_out_date)
);
-- 3. TRANSACTION TABLE: payments (Uang Masuk)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    user_id INT NOT NULL, -- Kasir yang menerima uang
    amount DECIMAL(12, 2) NOT NULL, -- Pasti bernilai positif
    payment_method ENUM('cash', 'debit_card', 'credit_card', 'transfer', 'qris') NOT NULL, 
    payment_type ENUM('down_payment', 'settlement') NOT NULL, -- Tipe refund dihapus
    reference_number VARCHAR(100), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);
-- 4. TRANSACTION TABLE: refunds (Uang Keluar / Pengembalian)
CREATE TABLE IF NOT EXISTS refunds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT NOT NULL, -- Merujuk tepat ke ID pembayaran mana yang dikembalikan
    user_id INT NOT NULL,    -- Kasir/Manager yang memproses pengembalian dana
    amount DECIMAL(12, 2) NOT NULL, -- Nominal yang dikembalikan
    reason TEXT NOT NULL,           -- Alasan refund (wajib ada untuk audit)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Mencegah pembayaran dihapus jika sudah ada riwayat refund-nya
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);


-- 1. TABLE: cleaning_logs (Riwayat Pembersihan Kamar oleh Housekeeping) // tambahan untuk kelompok B, entah cocok atau tidak.
CREATE TABLE IF NOT EXISTS cleaning_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL, -- Ruangan yang dibersihkan
    employee_id INT NOT NULL, -- Petugas Housekeeping yang bertugas
    action_note TEXT,         -- Catatan kecil (misal: "Ganti seprei, isi ulang sabun, lalala..")
    cleaned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Waktu selesai dibersihkan
    CONSTRAINT fk_cleaning_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cleaning_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    INDEX idx_cleaning_room (room_id),
    INDEX idx_cleaning_date (cleaned_at)
);

-- Tabel housekeeping_tasks (BUKAN attendance) -> untuk tabel di screenshot ini
CREATE TABLE housekeeping_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    employee_id INT NOT NULL,
    assigned_by INT NOT NULL,
    status ENUM('scheduled','in_progress','completed','canceled') DEFAULT 'scheduled',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_by) REFERENCES employees(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS room_maintenance_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    scheduled_by INT NOT NULL,          -- staff Housekeeping yang menjadwalkan (biasanya Supervisor)
    title VARCHAR(150) NOT NULL,        -- contoh: "Perawatan AC berkala", "Cek plumbing kamar"
    notes TEXT,
    scheduled_date DATE NOT NULL,       -- tanggal rencana maintenance dilakukan
    status ENUM('scheduled','in_progress','completed','canceled') NOT NULL DEFAULT 'scheduled',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    FOREIGN KEY (scheduled_by) REFERENCES employees(id) ON DELETE RESTRICT,
    INDEX idx_schedule_room (room_id),
    INDEX idx_schedule_date (scheduled_date)
);


-- =============== ===
--  MODUL INVENTORY ===
-- =============== ===

-- 12. MASTER TABLE: inventory_categories (Kategori Barang Inventaris)
CREATE TABLE IF NOT EXISTS inventory_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Contoh: Linen, Toiletries, Cleaning Supplies, Antiseptik
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 13. TABLE: inventory_items (Data Barang & Stok)
CREATE TABLE IF NOT EXISTS inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,             -- Nama barang, Contoh: Handuk Mandi, Sabun Mandi, Cairan Antiseptik
    unit VARCHAR(20) NOT NULL DEFAULT 'pcs', -- Satuan: pcs, botol, liter, dus, dll
    current_stock INT NOT NULL DEFAULT 0,   -- Stok saat ini
    minimum_stock INT NOT NULL DEFAULT 0,   -- Ambang batas stok minimum
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES inventory_categories(id) ON DELETE RESTRICT,
    CONSTRAINT chk_stock_non_negative CHECK (current_stock >= 0),
    CONSTRAINT chk_minimum_non_negative CHECK (minimum_stock >= 0),
    INDEX idx_inventory_category (category_id),
    INDEX idx_inventory_name (name)
);
-- Catatan: kolom "Status" (Aman/Menipis) TIDAK disimpan di tabel.
-- Dihitung on-the-fly di query, contoh:
-- SELECT *, CASE WHEN current_stock <= minimum_stock THEN 'Menipis' ELSE 'Aman' END AS status
-- FROM inventory_items;

-- 13. TRANSACTION TABLE: inventory_stock_logs (Riwayat Keluar/Masuk Stok Barang)
CREATE TABLE IF NOT EXISTS inventory_stock_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    employee_id INT NOT NULL, -- Pegawai yang mencatat/melakukan perubahan stok
    type ENUM('in', 'out', 'adjustment') NOT NULL, -- in = restock/pembelian, out = pemakaian, adjustment = koreksi stok opname
    quantity INT NOT NULL,    -- Selalu bernilai positif, arah perubahan ditentukan oleh kolom "type"
    note TEXT,                -- Contoh: "Restock dari supplier", "Dipakai untuk cleaning kamar 101"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
    INDEX idx_stock_log_item (item_id),
    INDEX idx_stock_log_date (created_at)
);

