# 🚀 Panduan Menjalankan Sistem IECC (Web Command Center & Mobile App)

Panduan lengkap tahapan menjalankan ekosistem **IECC (Integrated Emergency Command Center)** secara lokal pada komputer Anda, mencakup **Backend Laravel & Web Command Center**, **Queue Worker AI Gemini**, dan **Mobile App (Expo React Native)**.

---

## 📌 Prasyarat Lingkungan (Prerequisites)
Pastikan dependensi berikut sudah terpasang di komputer/laptop Anda:
- **PHP 8.2+** & Composer
- **Node.js 18+** & npm / npx
- **MySQL / MariaDB** (dengan Spatial GIS support)
- **Redis** (opsional / untuk antrean & session)
- **Expo Go App** (terpasang di iPhone / Android fisik)
- Komputer dan HP berada di **jaringan Wi-Fi lokal yang sama** (LAN IP: `192.168.0.132` atau sesuaikan IP komputer Anda).

---

## 🖥️ BAGIAN 1: Menjalankan Web Backend & Command Center (`web-IECC`)

Buka Terminal pada direktori `web-IECC`:
```bash
cd /Users/macanas/project/web-IECC
```

### 1. Konfigurasi Environment & Database
Pastikan file `.env` sudah sesuai:
```env
APP_NAME=IECC
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=iecc
DB_USERNAME=root
DB_PASSWORD=root123

# Queue Database / Redis
QUEUE_CONNECTION=database

# Google AI Studio Gemini API Key
GEMINI_API_KEY=AIzaSy...your_gemini_api_key...
GEMINI_MODEL=gemini-3.8-flash
```

Jalankan migrasi, seeder, dan link storage (jika pertama kali setup):
```bash
composer install
php artisan migrate --seed
php artisan storage:link
```

---

### 2. Jalankan Server Web Laravel (Terminal 1)
Jalankan server dengan host `0.0.0.0` agar dapat diakses oleh browser PC dan perangkat HP di jaringan Wi-Fi:
```bash
php artisan serve --host=0.0.0.0 --port=8000
```
> 🌐 **Akses Web Command Center**: Buka browser di [http://localhost:8000](http://localhost:8000) atau [http://127.0.0.1:8000](http://127.0.0.1:8000)  
> 🔑 **Akun Default Super Admin**:  
> - **Email**: `admin@iecc.local`  
> - **Password**: `password` (atau `admin123`)

---

### 3. Jalankan Queue Worker AI & Background Job (Terminal 2 - Wajib untuk Multimodal AI)
Queue worker bertugas mengeksekusi analisis visual AI Gemini (foto/video/suara), menghitung keparahan insiden, dan merekomendasikan armada terdekat secara real-time tanpa membuat HP warga loading/timeout:
```bash
cd /Users/macanas/project/web-IECC
php artisan queue:listen --timeout=60
```

---

## 📱 BAGIAN 2: Menjalankan Mobile App (`app-IECC`)

Buka Terminal baru pada direktori `app-IECC`:
```bash
cd /Users/macanas/project/app-IECC
```

### 1. Periksa Konfigurasi IP Backend
Buka file [`src/constants/config.ts`](file:///Users/macanas/project/app-IECC/src/constants/config.ts) dan pastikan menggunakan IP LAN komputer Anda:
```typescript
// Ganti dengan IP LAN komputer Anda jika IP Wi-Fi berubah
export const API_BASE_URL = 'http://192.168.0.132:8000/api/v1';
```

*(Tips: Untuk mengecek IP lokal komputer Anda di Mac, ketik: `ipconfig getifaddr en0`)*

---

### 2. Jalankan Expo Dev Server (Terminal 3)
Jalankan Expo dengan opsi pembersihan cache:
```bash
npx expo start -c
```
*(Atau `npm start`)*

---

### 3. Buka di Perangkat HP
1. Pastikan HP iPhone / Android Anda terhubung ke **Wi-Fi yang sama** dengan komputer.
2. Buka aplikasi **Expo Go** (atau Kamera bawaan iPhone).
3. **Scan QR Code** yang muncul di terminal.
4. Aplikasi akan otomatis bundle dan siap digunakan!

---

## 👤 Akun Login Pengujian di Mobile App

### 1. Akun Warga Pelapor (Citizen):
- **Email**: `warga@iecc.local`
- **Password**: `password`
- **Fitur Tersedia**:
  - 📊 **Dashboard Modern**: Quick SOS, statistik riwayat, nomor hotline darurat 112/110/113/119, panduan P3K.
  - 🚨 **Kirim Laporan Darurat**: Input kategori, foto kamera langsung, video kejadian, koordinat GPS presisi.
  - 🕒 **Riwayat & Monitoring**: Pelacakan progres penanganan live (Laporan Diterima ➔ Verifikasi AI ➔ Armada Meluncur ➔ Petugas di TKP ➔ Selesai) beserta bukti media.
  - 👤 **Profil Pengguna**: Informasi pelapor & modal konfirmasi logout.

### 2. Akun Petugas Lapangan (Field Officer):
- **Email**: `petugas@iecc.local`
- **Password**: `password`
- **Fitur Tersedia**:
  - 🚒 Antarmuka tugas penugasan armada darurat (Terima Tugas / Tolak / Update status di TKP).

---

## 🛠️ Ringkasan Terminal yang Perlu Berjalan Bersamaan

| No | Terminal | Direktori | Perintah | Fungsi |
|---|---|---|---|---|
| **1** | **Backend Server** | `web-IECC` | `php artisan serve --host=0.0.0.0 --port=8000` | API & Web Command Center |
| **2** | **AI Queue Worker** | `web-IECC` | `php artisan queue:listen --timeout=60` | Analisis AI Gemini & Penugasan Armada |
| **3** | **Mobile App** | `app-IECC` | `npx expo start -c` | Server Metro Bundler Mobile |

---

Selamat menggunakan sistem **IECC - Integrated Emergency Command Center**! 🚒🚑🚓
