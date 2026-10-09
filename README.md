# IECC Mobile App (React Native Expo)

Aplikasi Mobile Resmi Terintegrasi untuk:
1. **Warga (Citizen App)**: Laporan darurat 1-klik (SOS), deteksi koordinat GPS otomatis, pemilihan kategori kejadian.
2. **Petugas Lapangan (Field Officer App)**: Menerima/menolak tugas dispatch, pembaruan status respons lapangan (`EN_ROUTE`, `ARRIVED`, `HANDLING`, `RESOLVED`), tracking GPS berkala, dan Pre-Arrival Notification (Handover Pasien IGD).

---

## Panduan Menjalankan

### 1. Masuk ke direktori aplikasi mobile:
```bash
cd /Users/macanas/project/app-IECC
```

### 2. Install dependensi:
```bash
npm install
```

### 3. Jalankan aplikasi via Expo:
```bash
npm start
```
* Buka **Expo Go** di smartphone (scan QR code) atau tekan `a` untuk Android Emulator, `i` untuk iOS Simulator, atau `w` untuk Web Preview.

---

## Konfigurasi Endpoint Backend
Konfigurasi URL API berada di `src/constants/config.ts`:
- **Android Emulator**: `http://10.0.2.2:8000/api/v1`
- **iOS Simulator / Localhost**: `http://127.0.0.1:8000/api/v1`
- **Real Device (WiFi)**: `http://<IP-Laptop-Anda>:8000/api/v1`
