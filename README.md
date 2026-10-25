#  Dynamic CMMS (Computerized Maintenance Management System)

purwarupa (prototype) aplikasi web untuk manajemen, pemeliharaan, dan kalibrasi alat kesehatan di rumah sakit. Dirancang dengan antarmuka yang ringan, responsif, dan mudah digunakan oleh teknisi elektromedis di lapangan.

##  Fitur Utama

1. **Dashboard Cerdas (4 Modul):**
   * **Maintenance:** Registrasi alat baru dan perhitungan otomatis *Equipment Management (EM) Score* berdasarkan standar parameter Kemenkes (Fungsi, Risiko, Pemeliharaan, Riwayat Insiden).
   * **Kalibrasi:** Modul eksekusi uji fungsi dengan tabel *infinity rows* (baris dinamis) dan kalkulasi *error* otomatis terhadap toleransi SOP pabrik.
   * **Perbaikan:** Pencatatan kerusakan tak terduga (*manual override*) dan penggantian status alat.
   * **Inventaris Master:** Database keseluruhan yang memisahkan alat "Berfungsi" dan alat dalam "Perbaikan", lengkap dengan ringkasan statistik.
2. **Peringatan PM (Preventive Maintenance):** Deteksi otomatis jika sebuah alat sudah mendekati atau melewati jadwal kalibrasi/inspeksinya (H-30 hari).
3. **Smart QR Scanner:** Terintegrasi langsung dengan kamera (Webcam/HP) untuk memindai kode inventaris fisik alat medis.
4. **Local Database & Export:** Menggunakan `LocalStorage` browser agar data tidak hilang, dilengkapi fitur *backup* ke format JSON.

##  Teknologi yang Digunakan

* **Front-End:** HTML5, CSS3, Vanilla JavaScript (Tanpa Framework).
* **Database:** Browser LocalStorage.
* **Library Eksternal:** `html5-qrcode` (untuk integrasi kamera).

##  Cara Menjalankan (Lokal)

Karena aplikasi ini dibangun tanpa *backend server*, Anda cukup mengunduh repositori ini dan membuka file `index.html` menggunakan browser modern (Chrome/Edge/Safari), atau menggunakan ekstensi **Live Server** di VS Code. 

*(Catatan: Fitur kamera QR Code membutuhkan koneksi HTTPS atau akses `localhost` untuk dapat menyala karena alasan keamanan browser).*
