# Sistem-Housekeeping-Hotel

Aplikasi web internal untuk membantu **Supervisor Housekeeping** memonitor kondisi kamar, mengelola data petugas & absensi, mencatat riwayat pembersihan kamar, serta memantau stok inventory perlengkapan kebersihan hotel — **Grand Nusantara Hotel**.

Proyek ini merupakan bagian dari **Project Kelompok B**, yang saling terhubung dengan sistem reservasi milik **Kelompok A** melalui tabel `rooms` sebagai satu sumber data status kamar yang sama.

---

## 📌 Fungsi Aplikasi

| Fitur | Deskripsi |
|---|---|
| **Login** | Autentikasi staff (Supervisor / Room Boy / Room Maid) menggunakan JWT |
| **Dashboard / Overview** | Ringkasan pekerjaan housekeeping yang sedang berjalan, jumlah kamar per status |
| **Data Staff & Absensi** | Kelola data petugas housekeeping beserta status kehadiran harian (Hadir / Libur / Sakit) |
| **Status Kamar** | Melihat status tiap kamar (Available / Dibersihkan / Selesai / Maintenance) beserta petugas yang menangani |
| **Riwayat Pembersihan** | Log histori pekerjaan pembersihan kamar per petugas |
| **Inventory** | Kelola stok perlengkapan kebersihan (linen, toiletries, cleaning supplies) beserta transaksi keluar-masuk barang |
| **Pencarian** | Pencarian cepat data staff / kamar dari sidebar |

Saat kamar selesai ditempati tamu (check-out) atau pekerjaan housekeeping berubah status, **status kamar tersinkron otomatis** lewat database trigger — tidak perlu update manual di dua tempat berbeda.

---

## 🛠️ Teknologi yang Digunakan

| Layer | Teknologi |
|---|---|
| **Backend** | Node.js + **Express.js**, MySQL (`mysql2`), JWT untuk autentikasi, bcryptjs untuk hashing password |
| **Frontend** | **React** (Vite), React Router, Axios untuk konsumsi REST API |
| **Database** | MySQL / MariaDB |

---

## 📁 Struktur Repository

```
Sistem-Housekeeping-Hotel/
│
├── server-side/                 # Backend (Express)
│   ├── node_modules/
│   ├── config/
│   │   └── db.js                 # koneksi ke MySQL
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── staffController.js
│   │   ├── roomController.js
│   │   ├── maintenanceController.js
│   │   └── inventoryController.js
│   ├── middleware/
│   │   ├── auth.js                # verifikasi JWT & role
│   │   └── errorHandler.js        # penanganan error terpusat
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── staffRoutes.js
│   │   ├── roomRoutes.js
│   │   ├── maintenanceRoutes.js
│   │   └── inventoryRoutes.js
│   ├── database/
│   │   └── schema.sql             # struktur tabel + data contoh
│   ├── .env                       # tidak ikut di-push ke GitHub
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── server.js                  # entry point: setup Express + jalankan server
│
└── react-frontend/               # Frontend (React)
    ├── public/                  # favicon ...
    ├── src/
    │   ├── assets/                 
    │   ├── pages/                  # Login, Dashboard, Staff, Rooms, Inventory
    │   ├── components/
    │   ├── services/               # axios instance & pemanggilan API
    │   └── App.jsx
    ├── index.html
    ├── .env.example
    └── package.json
```

---

## 🚀 Cara Menggunakan Repo (Mulai dari Fork)

Panduan ini untuk anggota tim/kontributor baru yang ingin mulai berkontribusi dari nol.

### 1. Fork repository

1. Buka halaman repository **Sistem-Housekeeping-Hotel** ini di GitHub.
2. Klik tombol **Fork** di pojok kanan atas → pilih akun GitHub kamu sebagai tujuan fork.
3. Setelah selesai, kamu akan punya salinan repo ini di akun GitHub-mu sendiri, misalnya:
   `https://github.com/<username-kamu>/Sistem-Housekeeping-Hotel`

### 2. Clone hasil fork ke komputer lokal

```bash
git clone https://github.com/<username-kamu>/Sistem-Housekeeping-Hotel.git
cd Sistem-Housekeeping-Hotel
```

### 3. Hubungkan ke repo asli (upstream)

Supaya kamu bisa menarik update terbaru dari repo tim:

```bash
git remote add upstream https://github.com/Caxerion2/Sistem-Housekeeping-Hotel.git
git remote -v
```

### 4. Siapkan database

1. Buat database MySQL baru:
   ```sql
   CREATE DATABASE grand_nusantara_hotel;
   ```
2. Import skema dan data contoh:
   ```bash
   mysql -u root -p grand_nusantara_hotel < server-side/database/schema.sql
   ```

### 5. Jalankan Backend (server-side)

```bash
cd server-side
npm install
```

Buat file `.env` di dalam folder `server-side/` (belum ada di repo karena di-`.gitignore`), isinya:

```
# APP CONFIG
NODE_ENV=development
APP_NAME=Housekeeping Management
PORT=3000

# DATABASE
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=MYDBkenn128344
DB_NAME=hotel_db

# AUTH
JWT_SECRET="your_super_secret_jwt_key_here"
JWT_EXPIRES_IN=9h

# CORS
FRONTEND_URL=http://localhost:5173
```

Jalankan server:

```bash
npm run dev
```

Backend akan berjalan di `http://localhost:5000`. Cek apakah sudah aktif lewat:

```bash
curl http://localhost:5000/api/health
```

### 6. Jalankan Frontend (react-frontend)

Buka terminal baru:

```bash
cd react-frontend
npm install
cp .env.example .env
```

Pastikan `.env` frontend mengarah ke URL backend:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

Jalankan aplikasi:

```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:5173` (default Vite).

### 7. Login dengan akun contoh

Gunakan salah satu akun dari data contoh di `schema.sql`:

| Username | Password | Role |
|---|---|---|
| `sugiono` | `hashed_pw` | Supervisor Housekeeping |

> ⚠️ Password di data contoh masih plaintext untuk kemudahan testing lokal. **Jangan pernah dipakai di lingkungan production** — ganti dengan password yang di-hash menggunakan bcrypt sebelum deploy.

### 8. Membuat perubahan & mengirim Pull Request

1. Buat branch baru untuk fitur/perbaikan yang kamu kerjakan:
   ```bash
   git checkout -b fitur/nama-fiturmu
   ```
2. Lakukan perubahan, lalu commit:
   ```bash
   git add .
   git commit -m "Menambahkan fitur ..."
   ```
3. Push ke fork kamu:
   ```bash
   git push origin fitur/nama-fiturmu
   ```
4. Buka GitHub → repo fork kamu → klik **Compare & pull request** → arahkan ke branch `main` di repo asli tim.
5. Tulis deskripsi perubahan yang jelas, lalu submit PR untuk di-review anggota tim lain.

### 9. Menyinkronkan fork dengan update terbaru dari tim

Sebelum mulai kerjakan fitur baru, selalu tarik update terbaru dulu:

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

---

## 📡 Ringkasan Endpoint API

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Login staff | ❌ |
| GET | `/api/auth/me` | Profil staff yang sedang login | ✅ |
| GET | `/api/staff` | Daftar staff + status absensi hari ini | ✅ |
| POST | `/api/staff` | Tambah staff baru | ✅ (Supervisor) |
| PUT | `/api/staff/:id/attendance` | Update absensi staff hari ini | ✅ (Supervisor) |
| GET | `/api/rooms` | Daftar kamar + status + petugas aktif | ✅ |
| PUT | `/api/rooms/:id/status` | Update status kamar manual | ✅ |
| GET | `/api/maintenance` | Pekerjaan housekeeping yang sedang berjalan | ✅ |
| GET | `/api/maintenance/history` | Riwayat pembersihan kamar | ✅ |
| POST | `/api/maintenance` | Buat penugasan pembersihan/perbaikan baru | ✅ |
| PUT | `/api/maintenance/:id/status` | Update status pekerjaan (memicu sinkronisasi status kamar) | ✅ |
| GET | `/api/inventory` | Daftar stok inventory | ✅ |
| POST | `/api/inventory/:id/transaction` | Catat transaksi masuk/keluar barang | ✅ |

Semua endpoint yang butuh login mengharuskan header:
```
Authorization: Bearer <token>
```

---

## 👥 Tim

Project Kelompok B — Sistem Housekeeping Hotel
*(isi nama anggota tim di sini)*

## 📄 Lisensi

Proyek ini dibuat untuk keperluan tugas akademik.


<!-- test -->
