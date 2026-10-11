# PRD: Aplikasi Absensi WFH & Monitoring Karyawan

**Versi:** 1.0 (Draft)\
**Tanggal:** 8 Oktober 2026\
**Status:** Untuk review\
**Pemilik Produk:** HRD / Product Owner

## 1. Ringkasan Eksekutif

Dokumen ini mendefinisikan kebutuhan produk untuk dua aplikasi berbasis web yang saling terhubung:

1. **Aplikasi Absensi WFH Karyawan** – karyawan login, melakukan absen dengan pencatatan otomatis tanggal dan waktu, serta mengunggah foto sebagai bukti bekerja dari rumah.
2. **Aplikasi Monitoring Karyawan (Admin HRD)** – admin HRD mengelola data master karyawan (tambah dan ubah) serta memantau (view only) absensi yang telah disubmit karyawan.

Kedua aplikasi menggunakan satu database dan satu backend yang sama, dengan dua antarmuka berbeda sesuai peran pengguna.

## 2. Latar Belakang & Masalah

Dengan adanya kerja dari rumah (WFH), perusahaan kesulitan memverifikasi kehadiran karyawan secara terukur. Pencatatan manual (chat, email, spreadsheet) rawan manipulasi, tidak seragam, dan menyulitkan HRD untuk merekap data.

**Masalah utama:**

- Tidak ada bukti kehadiran yang terstandar dan dapat diaudit.
- Waktu absen bisa dimanipulasi jika dicatat manual.
- HRD membutuhkan waktu lama untuk merekap kehadiran.
- Data karyawan tersebar dan tidak terpusat.

## 3. Tujuan & Metrik Keberhasilan

### 3.1 Tujuan Produk

- Menyediakan proses absensi WFH yang cepat (kurang dari 1 menit per absen).
- Menjamin keabsahan waktu absen melalui timestamp dari server.
- Menyediakan bukti visual (foto) untuk setiap absen.
- Memusatkan data master karyawan dan memberi HRD visibilitas kehadiran secara real-time.

### 3.2 Metrik Keberhasilan (KPI)

| Metrik | Target |
| --- | --- |
| Adopsi karyawan WFH yang aktif memakai aplikasi | ≥ 95% dalam 1 bulan setelah rilis |
| Waktu rata-rata menyelesaikan satu absen | ≤ 60 detik |
| Tingkat keberhasilan upload foto | ≥ 98% |
| Waktu HRD merekap kehadiran harian | Turun ≥ 70% dibanding manual |
| Uptime sistem pada jam kerja | ≥ 99% |

## 4. Ruang Lingkup

### 4.1 In Scope (MVP)

- Login dan logout karyawan serta admin HRD.
- Absen dengan capture tanggal/waktu otomatis dan upload foto.
- Riwayat absensi pribadi karyawan.
- CRUD data master karyawan oleh admin HRD (tambah, ubah, nonaktifkan).
- Daftar dan detail absensi (view only) untuk admin HRD, dengan filter dan pencarian.
- Ekspor laporan absensi (CSV/Excel).

### 4.2 Out of Scope (MVP)

- Perhitungan gaji/payroll.
- Pengajuan cuti, izin, atau lembur.
- Aplikasi mobile native (MVP berupa web responsif).
- Pengenalan wajah (face recognition) otomatis.
- Integrasi dengan sistem HRIS pihak ketiga.

## 5. Persona & Peran Pengguna

| Peran | Deskripsi | Kebutuhan Utama |
| --- | --- | --- |
| **Karyawan** | Pegawai yang bekerja WFH | Absen cepat, mudah dipakai dari HP/laptop, melihat riwayat sendiri |
| **Admin HRD** | Staf HRD pengelola data karyawan | Kelola data karyawan, pantau absensi, rekap laporan |

**Prinsip hak akses:** Admin HRD hanya **melihat** absensi (view only) dan **tidak dapat** mengubah atau menghapus absensi yang sudah disubmit, demi menjaga integritas data.

## 6. User Stories

### Karyawan

- Sebagai karyawan, saya ingin login dengan akun saya agar absensi tercatat atas nama saya.
- Sebagai karyawan, saya ingin absen masuk dengan mengambil/mengunggah foto agar kehadiran saya terbukti.
- Sebagai karyawan, saya ingin melihat tanggal dan waktu absen saya otomatis tanpa input manual.
- Sebagai karyawan, saya ingin melihat riwayat absensi saya untuk memastikan semuanya tercatat.
- Sebagai karyawan, saya ingin mengganti password saya agar akun tetap aman.

### Admin HRD

- Sebagai admin HRD, saya ingin menambah karyawan baru agar mereka dapat login dan absen.
- Sebagai admin HRD, saya ingin mengubah data karyawan agar informasi selalu akurat.
- Sebagai admin HRD, saya ingin menonaktifkan karyawan yang resign tanpa menghapus riwayat absensinya.
- Sebagai admin HRD, saya ingin melihat daftar absensi per tanggal, karyawan, atau departemen.
- Sebagai admin HRD, saya ingin melihat foto bukti absen untuk memverifikasi kehadiran.
- Sebagai admin HRD, saya ingin mengekspor rekap absensi untuk keperluan pelaporan.

## 7. Kebutuhan Fungsional

### 7.1 Modul A – Aplikasi Absensi Karyawan

**FR-A1: Autentikasi**

- Login menggunakan ID karyawan/email dan password.
- Logout dan sesi otomatis berakhir setelah tidak aktif (default 30 menit).
- Fitur ganti password; reset password dilakukan oleh admin HRD pada MVP.
- Akun nonaktif tidak dapat login.
- Pembatasan percobaan login gagal (misal 5 kali, lalu terkunci sementara 15 menit).

**FR-A2: Dashboard Karyawan**

- Menampilkan nama, jam dan tanggal saat ini, serta status absen hari ini (belum absen / sudah absen masuk / sudah absen pulang).
- Tombol aksi utama: **Absen Masuk** atau **Absen Pulang** sesuai status.

**FR-A3: Proses Absen**

- Karyawan menekan tombol absen, lalu mengambil foto langsung dari kamera perangkat (**wajib kamera langsung, foto tidak dapat dipilih dari galeri** untuk mengurangi kecurangan).
- Sistem mencatat **tanggal dan waktu dari server** (bukan dari jam perangkat) saat submit.
- Karyawan dapat melihat pratinjau foto sebelum submit dan mengambil ulang.
- Opsional: kolom catatan singkat (misal ringkasan rencana kerja hari itu).
- Setelah sukses, tampil konfirmasi berisi waktu tercatat.
- Satu karyawan hanya dapat memiliki satu absen masuk dan satu absen pulang per hari. Absen yang sudah disubmit tidak dapat diubah oleh karyawan.

**FR-A4: Validasi Foto**

- Format yang diterima: JPG, JPEG, PNG.
- Ukuran maksimal 5 MB; sistem melakukan kompresi/resize otomatis di sisi klien (target ≤ 1 MB).
- Validasi tipe file di sisi server (bukan hanya ekstensi).
- Foto wajib ada; absen tanpa foto ditolak.

**FR-A5: Riwayat Absensi**

- Daftar absensi milik karyawan sendiri, urut terbaru, dengan filter bulan.
- Menampilkan tanggal, jam masuk, jam pulang, status, dan thumbnail foto.

**FR-A6: Status Kehadiran**

- Status otomatis: **Hadir** atau **Terlambat** (jika absen masuk melewati jam batas yang dikonfigurasi, misal 09:00), dan **Tidak Hadir** (tidak ada absen sampai akhir hari).

### 7.2 Modul B – Aplikasi Monitoring (Admin HRD)

**FR-B1: Autentikasi Admin**

- Login terpisah/berbasis peran. Hanya akun dengan peran Admin HRD yang dapat mengakses modul ini.

**FR-B2: Manajemen Data Master Karyawan**

- **Tambah karyawan** dengan field: ID/NIK karyawan (unik), nama lengkap, email (unik), nomor telepon, departemen, jabatan, tanggal bergabung, status (aktif/nonaktif), dan password awal.
- **Ubah data karyawan** pada semua field di atas, serta reset password.
- **Nonaktifkan/aktifkan** karyawan (soft delete). Data karyawan dan riwayat absensi tidak dihapus permanen.
- **Daftar karyawan** dengan pencarian (nama/ID), filter (departemen, status), dan paginasi.
- Validasi: ID dan email tidak boleh duplikat; format email dan telepon valid.

**FR-B3: Monitoring Absensi (View Only)**

- Daftar absensi dengan kolom: tanggal, ID, nama, departemen, jam masuk, jam pulang, status.
- Filter: rentang tanggal, karyawan, departemen, status kehadiran.
- Pencarian berdasarkan nama atau ID karyawan.
- Detail absensi: menampilkan foto bukti ukuran penuh, timestamp, dan catatan.
- **Tidak ada** tombol ubah atau hapus pada data absensi.

**FR-B4: Dashboard Ringkasan**

- Ringkasan harian: jumlah karyawan aktif, sudah absen, terlambat, dan belum absen.
- Daftar karyawan yang belum absen pada hari berjalan.

**FR-B5: Ekspor Laporan**

- Ekspor hasil filter ke CSV atau Excel (tanpa foto; berisi tautan ke foto jika diperlukan).

**FR-B6: Audit Log**

- Setiap penambahan/perubahan data karyawan oleh admin dicatat: siapa, kapan, dan apa yang diubah.

## 8. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
| --- | --- |
| **Keamanan** | Password di-hash (bcrypt/argon2); HTTPS wajib; proteksi CSRF/XSS/SQL injection; role-based access control; token sesi aman (HttpOnly, Secure cookie) |
| **Integritas Data** | Timestamp dari server (zona waktu WIB/Asia/Jakarta, disimpan UTC); absensi immutable bagi karyawan dan admin |
| **Privasi** | Foto hanya dapat diakses karyawan pemilik dan admin HRD; URL foto bertanda tangan (signed URL) atau dilindungi autentikasi; kebijakan retensi foto (misal 12 bulan) |
| **Kinerja** | Halaman dimuat ≤ 3 detik pada koneksi 4G; proses submit absen ≤ 5 detik; mendukung minimal 500 pengguna aktif bersamaan |
| **Ketersediaan** | Uptime ≥ 99% pada jam kerja; backup database harian |
| **Kompatibilitas** | Responsif (mobile-first untuk modul karyawan); Chrome, Safari, Firefox, Edge versi terbaru |
| **Aksesibilitas & Bahasa** | Antarmuka berbahasa Indonesia; kontras dan ukuran font yang memadai |
| **Skalabilitas** | Penyimpanan foto di object storage agar mudah diperluas |

## 9. Alur Pengguna Utama

**Alur Absen Karyawan**

1. Karyawan membuka aplikasi dan login.
2. Dashboard menampilkan status absen hari ini.
3. Karyawan menekan **Absen Masuk**.
4. Karyawan mengambil foto, melihat pratinjau, lalu submit.
5. Server memvalidasi, mencatat tanggal/waktu server, dan menyimpan foto.
6. Sistem menampilkan konfirmasi; data muncul di riwayat karyawan dan di monitoring HRD.

**Alur Admin HRD**

1. Admin login ke modul monitoring.
2. Menambah/mengubah data karyawan pada menu **Data Karyawan**.
3. Membuka menu **Monitoring Absensi**, menerapkan filter, dan membuka detail untuk melihat foto bukti.
4. Mengekspor laporan bila diperlukan.

## 10. Model Data (Tingkat Tinggi)

**Tabel `employees`**

- id, employee\_code (unik), full\_name, email (unik), phone, department, position, join\_date, role (`employee` / `hr_admin`), password\_hash, is\_active, created\_at, updated\_at

**Tabel `attendances`**

- id, employee\_id (FK), attendance\_date, type (`check_in` / `check_out`), captured\_at (waktu server), photo\_url, note, status (`on_time` / `late`), created\_at
- Constraint unik: (employee\_id, attendance\_date, type)

**Tabel `audit_logs`**

- id, actor\_id, action, target\_table, target\_id, changes (JSON), created\_at

**Tabel `settings`**

- key, value (misal jam masuk, batas keterlambatan, jam pulang, batas ukuran foto)

## 11. Kebutuhan Antarmuka (Daftar Halaman)

**Modul Karyawan:** Login · Dashboard & Absen · Form Absen (kamera/upload) · Riwayat Absensi · Ganti Password

**Modul Admin HRD:** Login · Dashboard Ringkasan · Daftar Karyawan · Form Tambah/Ubah Karyawan · Monitoring Absensi · Detail Absensi (foto) · Ekspor Laporan · Audit Log

## 12. Rekomendasi Teknologi (Saran)

- **Frontend:** React atau Vue (responsif), Tailwind CSS
- **Backend:** Node.js (Express/NestJS), Laravel, atau Django – REST API
- **Database:** PostgreSQL atau MySQL
- **Penyimpanan Foto:** Object storage (AWS S3, Google Cloud Storage, atau MinIO)
- **Autentikasi:** JWT atau session berbasis cookie
- **Deployment:** Docker, CI/CD, hosting cloud

*Stack final ditentukan oleh tim engineering sesuai keahlian dan infrastruktur perusahaan.*

## 13. Asumsi & Batasan

- Semua karyawan memiliki perangkat dengan kamera dan koneksi internet.
- Jam kerja standar dan batas keterlambatan ditentukan HRD dan disimpan sebagai konfigurasi.
- Akun admin HRD pertama dibuat melalui seeding database.
- Pada MVP, tidak ada verifikasi lokasi (GPS) maupun pengenalan wajah, sehingga keabsahan foto bergantung pada pemeriksaan manual HRD.

## 14. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Karyawan mengunggah foto lama/palsu | Bukti tidak valid | Wajibkan kamera langsung; simpan metadata (EXIF bila ada); pertimbangkan watermark waktu pada foto di fase berikutnya |
| Kebocoran foto pribadi | Pelanggaran privasi | Akses terautentikasi, enkripsi penyimpanan, kebijakan retensi, kepatuhan UU PDP |
| Izin kamera ditolak browser | Karyawan tidak bisa absen | Panduan izin kamera; bantuan teknis dari HRD jika kamera bermasalah |
| Koneksi tidak stabil saat upload | Absen gagal | Kompresi foto, indikator progres, retry otomatis |
| Penolakan karyawan terhadap pemantauan | Adopsi rendah | Sosialisasi tujuan dan batas penggunaan data |

## 15. Kepatuhan & Privasi

Foto dan data karyawan termasuk data pribadi. Perusahaan perlu memastikan persetujuan karyawan, tujuan penggunaan yang jelas, pembatasan akses, dan masa retensi sesuai ketentuan perlindungan data pribadi yang berlaku di Indonesia (UU No. 27 Tahun 2022).

## 16. Rencana Rilis (Usulan)

| Fase | Cakupan | Estimasi |
| --- | --- | --- |
| **Fase 0** | Finalisasi PRD, desain UI/UX | 1–2 minggu |
| **Fase 1 (MVP)** | Login, absen + foto, riwayat karyawan, CRUD karyawan, monitoring view only | 4–6 minggu |
| **Fase 2** | Ekspor laporan, dashboard ringkasan, audit log, notifikasi pengingat | 2–3 minggu |
| **Fase 3 (Opsional)** | Verifikasi lokasi (GPS), watermark foto, integrasi cuti/izin, laporan lanjutan | Menyesuaikan |

## 17. Kriteria Penerimaan (MVP)

- Karyawan aktif dapat login dan melakukan absen masuk dan pulang dengan foto; waktu tercatat dari server.
- Karyawan tidak dapat absen dua kali untuk jenis yang sama pada hari yang sama.
- Karyawan nonaktif tidak dapat login.
- Admin HRD dapat menambah dan mengubah data karyawan dengan validasi duplikasi.
- Admin HRD dapat melihat, memfilter, dan membuka foto absensi, tanpa opsi mengubah atau menghapus.
- Karyawan hanya dapat melihat data absensinya sendiri.
- Seluruh halaman dapat digunakan dengan baik di layar ponsel dan desktop.

## 18. Pertanyaan Terbuka

1. Sudah diputuskan: foto wajib diambil langsung dari kamera, tanpa unggah dari galeri.
2. Sudah diputuskan: absen masuk dan absen pulang sama-sama dicatat.
3. Berapa jam masuk dan batas toleransi keterlambatan yang berlaku?
4. Apakah perlu verifikasi lokasi (GPS) pada fase selanjutnya?
5. Berapa lama masa retensi foto yang diinginkan perusahaan?
6. Apakah perlu lebih dari satu level admin (misal super admin dan admin HRD)?
7. Apakah dibutuhkan integrasi SSO dengan sistem perusahaan yang sudah ada?
