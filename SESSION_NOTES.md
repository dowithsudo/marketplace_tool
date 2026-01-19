# 📝 Catatan Sesi - 20 Januari 2026

## ✅ Pekerjaan yang Selesai
1.  **HPP & BOM**: Memperbaiki `500 Internal Server Error` saat menghitung HPP (tambah dependency `user_id`).
2.  **File Visibility**: Menambahkan dukungan `.csv` pada input file di halaman Laporan dan Iklan.
3.  **Hapus Laporan**:
    *   Backend: Endpoint `DELETE /imports/reports/{id}` tersedia.
    *   Frontend: Tombol Trash merah di halaman `Reports.jsx` (Histori File).
4.  **Perbaikan Parser Shopee Ads**:
    *   Support auto-create produk jika nama tidak ditemukan di database.
    *   Fix parsing metadata "Nama Iklan" yang mengandung koma/tanda kutip.
    *   Fix pembersihan angka nominal (menghapus separator ribuan).

## ❌ Masalah yang Belum Tuntas ("Belum Bisa")
Pengguna melaporkan import iklan masih belum berhasil sesuai harapan ("belum bisa"). 

### Analisis Kemungkinan Penyebab:
- **Format CSV Variatif**: Meskipun parser sudah diperbaiki untuk satu contoh, mungkin ada format CSV Shopee lain (misal: Iklan Kata Kunci vs Iklan Produk vs Iklan Toko) yang memiliki header berbeda.
- **Mapping Produk**: Jika produk tetap gagal ter-create otomatis, mungkin ada constraint di database atau logic auto-ID yang bentrok.
- **Refresh Data**: Setelah import sukses, mungkin UI tidak otomatis ter-refresh untuk menampilkan data di tabel bawah.

## 🚀 Rencana Besok (Lanjutan)
1.  **Debug Real-Time**: Periksa log backend saat pengguna mencoba upload file tersebut lagi untuk melihat baris mana yang menyebabkan skip.
2.  **Verifikasi Delete**: Pastikan fitur hapus benar-benar membersihkan data terkait hingga ke tabel performa harian (jika diperlukan).
3.  **UI Feedback**: Tambahkan progress bar atau pesan sukses/error yang lebih detail saat import agar pengguna tahu persis data mana yang masuk dan mana yang gagal.

---
*Selamat istirahat! Sampai jumpa di sesi besok.*
