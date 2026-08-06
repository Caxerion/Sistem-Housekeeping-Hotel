# Sistem Housekeeping Hotel

Aplikasi web internal untuk membantu **Supervisor Housekeeping** memonitor kondisi kamar, mengelola data petugas & absensi, mencatat riwayat pembersihan kamar, serta memantau stok inventory perlengkapan kebersihan hotel — **Grand Nusantara Hotel**.

Proyek ini saling terhubung dengan sistem reservasi milik **Kelompok A** melalui tabel `rooms` sebagai satu sumber data status kamar yang sama.

---

## Fitur

| Fitur | Deskripsi |
|---|---|
| **Login** | Autentikasi staff (Supervisor / Room Boy / Room Maid) menggunakan JWT |
| **Dashboard** | Ringkasan pekerjaan housekeeping yang sedang berjalan, jumlah kamar per status |
| **Data Staff & Absensi** | Kelola data petugas housekeeping beserta status kehadiran harian (Hadir / Libur / Sakit) |
| **Status Kamar** | Melihat status tiap kamar (Available / Dibersihkan / Selesai / Maintenance) beserta petugas yang menangani |
| **Riwayat Pembersihan** | Log histori pekerjaan pembersihan kamar per petugas |
| **Inventory** | Kelola stok perlengkapan kebersihan beserta transaksi keluar-masuk barang |
| **Pencarian** | Pencarian cepat data staff / kamar dari sidebar |

Saat kamar selesai ditempati tamu (check-out) atau pekerjaan housekeeping berubah status, **status kamar tersinkron otomatis** lewat database trigger — tidak perlu update manual di dua tempat berbeda.

---

## Teknologi

| Layer | Teknologi |
|---|---|
| **Backend** | Node.js + Express.js, JWT (JSON Web Token), bcrypt, multer |
| **Frontend** | React.js (Vite), React Router, Axios, Bootstrap, Tailwind CSS, Recharts, SweetAlert2 |
| **Database** | MySQL(`mysql2`) / MariaDB |

---

## Struktur Proyek

```
Sistem-Housekeeping-Hotel/
│
├── server-side/                 # Backend (Express)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # koneksi MySQL
│   │   ├── controllers/
│   │   ├── middlewares/         # middleware dan validasi auth
│   │   │   └── validations/
│   │   ├── routes/
│   │   └── utils/
│   │       └── asyncHandler.js
│   ├── database/                # database berisikan file sql yang harus dijalankan
│   │   ├── seeders/
│   │   ├── triggers/
│   │   └── views/
│   │       └── vw_account.sql
│   ├── uploads/                 # file upload (disarankan di- .gitignore)
│   ├── .env
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
│
└── client-side/                 # Frontend (React + Vite)
    ├── src/
    │   ├── components/          # Komponen React
    │   ├── context/
    │   │   └── AuthContext.jsx  # Untuk menyimpan data auth
    │   ├── pages/               # Halaman
    │   ├── services/
    │   │   └── api.js           # untuk menghubungkan ke server-side
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── eslint.config.js
    ├── package.json
    └── package-lock.json
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [MySQL](https://dev.mysql.com/downloads/mysql/) atau MariaDB
- npm atau yarn

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

Buat database MySQL baru:

```sql
CREATE DATABASE hotel_db;
```

Import skema dan data contoh:

```bash
mysql -u root -p hotel_db < server-side/database/init.sql
mysql -u root -p hotel_db < server-side/database/seeders_full_version.sql
```

Atau import per-file jika ingin kontrol lebih detail:

```bash
mysql -u root -p hotel_db < server-side/database/seeders/employees.sql
mysql -u root -p hotel_db < server-side/database/seeders/rooms.sql
# ... dst
```

Atau bisa juga jalankan semua script sql nya di workbench ataupun phpmyadmin

### 5. Konfigurasi environment backend

Buat file `.env` di dalam folder `server-side/`:

```env
# APP
NODE_ENV=development
APP_NAME=Housekeeping Management
PORT=3000

# DATABASE
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_mysql_kamu
DB_NAME=hotel_db

# AUTH
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=9h

# CORS
FRONTEND_URL=http://localhost:5173
```

### 6. Jalankan Backend

```bash
cd server-side
npm install
npm run dev
```

Server berjalan di `http://localhost:3000`.

### 7. Konfigurasi environment frontend

Buat file `.env` di dalam folder `client-side/` (jika perlu):

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 8. Jalankan Frontend

Buka terminal baru:

```bash
cd client-side
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

### 9. Membuat perubahan & mengirim Pull Request

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

### 10. Menyinkronkan fork dengan update terbaru dari tim

Sebelum mulai kerjakan fitur baru, selalu tarik update terbaru dulu:

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

---

## Akun Contoh

| Username | Password | Role |
|---|---|---|
| `hk_agus` | `password123` | Supervisor Housekeeping |

> Password di data contoh masih plaintext untuk kemudahan testing lokal. **Jangan pernah dipakai di lingkungan production**.

---

## Catatan Port

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

Pastikan kedua port tersedia sebelum menjalankan aplikasi.

## Stack Teknologi

Dibangun dengan React (Vite) dan Express (Node.js) dengan dukungan basis data MySQl.

## 👥 Tim

Project Kelompok B — Sistem Housekeeping Hotel

## Lisensi

MIT License - Lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.

---
