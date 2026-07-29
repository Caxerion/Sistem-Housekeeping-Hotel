
-- /database/data_dummies/users.sql
-- Data Dummy untuk table users: table account users

USE hotel_db;

-- Kosongkan tabel jika sebelumnya sudah terlanjur menjalankan seeder sebelumnya
-- TRUNCATE TABLE users; 

-- WARNING: Pastikan sudah menjalankan script employees.sql !!

-- =====================================================================================================
-- Hash bcrypt di bawah dari: "password123" dengan round: 12 via bcrypt-generator.com
-- =====================================================================================================

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