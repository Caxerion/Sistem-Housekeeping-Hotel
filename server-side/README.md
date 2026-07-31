# Server-Side — Backend Manajemen Housekeeping

API Express.js untuk sistem **Manajemen Housekeeping Grand Nusantara Hotel**.

## Prasyarat

- **Node.js** >= 18
- **npm** (sudah termasuk dalam Node.js)
- **MySQL** / **MariaDB** (disarankan 8.0+)
- **Git**

## Instalasi

```bash
cd server-side
npm install
```

## Konfigurasi Environment

Buat file `.env` di direktori root `server-side/`:

```env
# KONFIGURASI APLIKASI
NODE_ENV=development
APP_NAME=Housekeeping Management
PORT=3000

# DATABASE
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_mysql_anda
DB_NAME=hotel_db

# AUTENTIKASI
JWT_SECRET=kunci_rahasia_jwt_super_anda
JWT_EXPIRES_IN=9h

# CORS
FRONTEND_URL=http://localhost:5173
```

## Pengaturan Database

### 1. Buat database dan tabel

```bash
mysql -u root -p < database/init.sql
```

### 2. Jalankan seeder (secara berurutan)

Seeder harus dijalankan sesuai urutan dependensinya. Gunakan file gabungan atau jalankan satu per satu:

```bash
# Opsi A — file seed gabungan (direkomendasikan)
mysql -u root -p hotel_db < database/seeders_full_version.sql

# Opsi B — seeder individual (sesuai urutan ini)
mysql -u root -p hotel_db < database/seeders/positions.sql
mysql -u root -p hotel_db < database/seeders/employees.sql
mysql -u root -p hotel_db < database/seeders/users.sql
mysql -u root -p hotel_db < database/seeders/applications.sql
mysql -u root -p hotel_db < database/seeders/application_users.sql
mysql -u root -p hotel_db < database/seeders/room_types.sql
mysql -u root -p hotel_db < database/seeders/rooms.sql
mysql -u root -p hotel_db < database/seeders/room_type_amenities.sql
mysql -u root -p hotel_db < database/seeders/amenities.sql
mysql -u root -p hotel_db < database/seeders/inventory.sql
```

### 3. Buat view database

```bash
mysql -u root -p hotel_db < database/views/vw_account.sql
```

### 4. (Opsional) Jalankan trigger

```bash
mysql -u root -p hotel_db < database/triggers/trg_after_checkin.sql
mysql -u root -p hotel_db < database/triggers/trg_after_checkout.sql
mysql -u root -p hotel_db < database/triggers/trg_after_cancel.sql
mysql -u root -p hotel_db < database/triggers/trg_maintenance_schedule_sync.sql
```

## Menjalankan Server

### Development (dengan auto-restart via nodemon)

```bash
npm run dev
```

### Production

```bash
npm start
```

Server akan tersedia di `http://localhost:3000`.

## Struktur Proyek

```
server-side/
├── index.js                          # Entry point: setup aplikasi Express & start server
├── .env                              # Variabel environment (tidak masuk git)
├── package.json
├── config/
│   └── db.js                         # Connection pool MySQL
├── src/
│   ├── controllers/
│   │   ├── authController.js         # Register, login, logout
│   │   ├── roomController.js         # Daftar kamar
│   │   ├── roomScheduleController.js # Penjadwalan tugas housekeeping
│   │   └── dashboardController.js    # Statistik dashboard
│   ├── middlewares/
│   │   ├── auth.js                   # Verifikasi JWT & pengecekan role
│   │   └── validations/
│   │       └── authValidation.js     # Validasi request body
│   ├── routes/
│   │   ├── authRoutes.js             # /api/auth/*
│   │   ├── roomRoutes.js             # /api/rooms/*
│   │   ├── roomScheduleRoutes.js     # /api/room-schedule/*
│   │   └── dashboardRoutes.js        # /api/dashboard/*
│   └── utils/
│       └── asyncHandler.js           # Wrapper async untuk controller
├── database/
│   ├── init.sql                      # Skema: tabel, constraint, index
│   ├── seeders_full_version.sql      # Data seed gabungan
│   ├── seeders/                      # File seed individual
│   ├── views/
│   │   └── vw_account.sql            # View login (users + employees + positions + apps)
│   └── triggers/                     # Trigger sinkronisasi status kamar
```

## Endpoint API

Base URL: `http://localhost:3000`

### Auth

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Registrasi pegawai baru + akun user | Tidak |
| POST | `/api/auth/login` | Login dengan username atau email, mengembalikan token JWT | Tidak |
| POST | `/api/auth/logout` | Logout (invalidasi token di sisi client) | Tidak |

### Rooms

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/rooms` | Ambil semua kamar beserta tipe, status, dan amenitas | Tidak |

### Room Schedule (Tugas Housekeeping)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/room-schedule/rooms-available` | Ambil kamar yang tersedia untuk housekeeping | Ya |
| GET | `/api/room-schedule/staff` | Ambil daftar staf housekeeping | Ya |
| GET | `/api/room-schedule` | Ambil semua jadwal housekeeping | Ya |
| POST | `/api/room-schedule` | Buat jadwal housekeeping baru | Ya |
| PUT | `/api/room-schedule/:id/start` | Tandai jadwal sebagai sedang berlangsung | Ya |
| PUT | `/api/room-schedule/:id/complete` | Tandai jadwal sebagai selesai | Ya |
| PUT | `/api/room-schedule/:id/cancel` | Batalkan jadwal | Ya |

### Dashboard

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/dashboard/stats` | Ambil statistik ringkasan dashboard | Ya |

## Autentikasi

Endpoint yang terproteksi membutuhkan token JWT pada header Authorization:

```
Authorization: Bearer <token_jwt_anda>
```

Token dikembalikan oleh endpoint `/api/auth/login`. Payload token mencakup:

```json
{
  "user_id": 1,
  "employee_id": 1,
  "username": "admin",
  "employee_name": "Budi Hermawan, S.Kom",
  "employee_position": "Super Admin",
  "current_app": "Housekeeping Management",
  "role": "admin",
  "access_rights": [...]
}
```

## Kredensial Contoh

Semua user hasil seed menggunakan password `password123` (di-hash dengan bcrypt):

| Username | Email | Posisi |
|----------|-------|--------|
| `admin` | budi.admin@hotel.com | Super Admin |
| `gm_hendra` | hendra.gm@hotel.com | General Manager |
| `fom_siti` | siti.fom@hotel.com | Front Office Manager |
| `fo_dewi` | dewi.fo@hotel.com | Front Office Staff |
| `fo_rizky` | rizky.fo@hotel.com | Front Office Staff |
| `hk_agus` | agus.hk@hotel.com | Housekeeping Supervisor |
| `hk_bambang` | bambang.hk@hotel.com | Housekeeping Staff |
| `finance_maya` | maya.finance@hotel.com | Finance Manager |

## Perintah Berguna

```bash
# Server development dengan nodemon (auto-restart saat file berubah)
npm run dev

# Jalankan server production
npm start
```

cihuyy - kata rifqi