# AbsenKan — Aplikasi Absensi WFH & Monitoring Karyawan

Monorepo dua aplikasi web yang saling terhubung, dibangun dari [PRD](PRD%20-%20Aplikasi%20Absensi%20WFH%20&%20Monitoring%20Karyawan.md).

- **`backend/`** — REST API, NestJS + TypeScript + TypeORM + MySQL + JWT
- **`frontend/`** — SPA, Vite + React + TypeScript + Tailwind CSS

Satu database dan satu backend untuk dua antarmuka: **modul Karyawan** (absen WFH + foto dari kamera) dan **modul Admin HRD** (CRUD karyawan, monitoring view-only, dashboard, ekspor CSV).

## Prasyarat
- Node.js ≥ 20 (dikembangkan di Node 26)
- Docker + Docker Compose (untuk MySQL)

## Menjalankan

### 1. Database
```bash
docker compose up -d
```
Mengangkat MySQL `absenkan_db` di port `3306`.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env        # sesuaikan bila perlu
npm run start:dev           # http://localhost:3000/api
```
Seed otomatis saat proses `onModuleInit`: ada admin HRD `admin` / `Admin#12345` (pertama kali hanya jika belum ada).

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

## Akun Seed (MVP)
| Peran | Login | Password |
| --- | --- | --- |
| Admin HRD | `admin` | `Admin#12345` |
| Karyawan | `EMP` + kode / dibuat via menu absen | dibuat via admin |

Akun karyawan contoh dibuat lewat modul admin (Data Karyawan → Tambah).

## Fitur
- **Watermark timestamp** — setiap foto absen diberi stempel waktu WIB otomatis di server (anti-bohong).
- **Ekspor laporan** — CSV dan **Excel (.xlsx)** dari hasil filter monitoring.
- **Rekap bulanan** — ringkasan hadir/terlambat/tidak-hadir per karyawan per bulan.
- **Pengingat otomatis (cron WIB)** — pengingat absen masuk (08:30) & pulang (17:30), serta alert HRD karyawan tidak hadir (21:00), disimpan sebagai notifikasi.
- **Notifikasi admin** — lonceng notifikasi di header untuk melihat pengingat/alert.

## Arsitektur & Alur Auth
- Login menghasilkan **JWT yang disimpan di cookie `HttpOnly`, `Secure` (prod), `SameSite=Lax`**. `credentials: include` dipakai frontend.
- Foto absen wajib dari kamera langsung (input `capture`), dikompresi di klien, divalidasi tipe di server (magic bytes) dan ukuran ≤ 5 MB.
- Timestamp absen diambil dari **server** (jam UTC, ditampilkan WIB).
- Absensi immutable: satu check-in & satu check-out per karyawan per hari (constraint unik), tidak bisa dihapus/diubah oleh siapa pun.
- Foto disimpan di `backend/uploads/`, disajikan melalui endpoint terautentikasi dengan cek kepemilikan (karyawan → hanya fotonya; admin → semua).

## Verifikasi Cepat (curl)
```bash
# login admin, simpan cookie
curl -s -c /tmp/ck http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"admin","password":"Admin#12345"}'
curl -s -b /tmp/ck http://localhost:3000/api/employees?page=1
```
