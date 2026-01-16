# 🚀 MartTool - Marketplace Business Control Center

**MartTool** adalah platform analisis bisnis marketplace yang dirancang untuk membantu penjual mengelola HPP, menghitung harga jual secara otomatis (Forward & Reverse Pricing), serta menganalisis efektivitas iklan (ROAS) dengan indikator kesehatan bisnis yang cerdas.

---

## 📚 Dokumentasi
Untuk panduan lebih mendalam, silakan merujuk ke file berikut:
- 📖 **[Panduan Cepat (QUICKREF.md)](./QUICKREF.md)**: Referensi cepat alur kerja dan troubleshooting.
- 🛠️ **[Dokumentasi Developer (DEVELOPER.md)](./DEVELOPER.md)**: Detail teknis, arsitektur backend, dan state management.
- 📝 **[Catatan Perubahan (CHANGELOG.md)](./CHANGELOG.md)**: Riwayat pembaruan versi.

---

## 🏗️ Arsitektur Sitem
- **Backend**: Python + FastAPI
- **Frontend**: React (Vite)
- **Database**: PostgreSQL (Docker) atau SQLite (Lokal)
- **Deployment**: Docker Compose

## Setup Docker (Rekomendasi)

Ini adalah cara termudah untuk menjalankan aplikasi secara lokal dengan database yang persisten.

```bash
# Jalankan aplikasi (Backend, Frontend, & Database)
docker-compose up -d --build
```

Aplikasi akan berjalan di: **http://localhost:8080**

### Seeding Data (Docker)
Untuk mengisi database dengan data contoh:
```bash
docker exec -it marttool-backend python seed_db.py
```
Default Login: `admin@example.com` / `admin123`

### Menghentikan Aplikasi
Jika Anda ingin menghentikan aplikasi agar tidak memakan sumber daya atau bentrok dengan port project lain:
```bash
# Menghentikan kontainer tanpa menghapus data
docker-compose stop

# Menghentikan dan menghapus kontainer (data DB tetap aman di volume)
docker-compose down
```

## Setup Manual (Development)

### Setup Backend
```bash
# Aktifkan virtual environment
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Jalankan server
cd backend
python run.py
```

### Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

## Fitur

### FASE 1 ✓
- CRUD Materials (bahan baku)
- CRUD Products
- CRUD BOM (Bill of Materials)
- Perhitungan HPP

### FASE 2 ✓
- CRUD Marketplaces
- CRUD Stores
- CRUD Store Products (harga per toko)
- CRUD Discounts
- CRUD Marketplace Cost Types (dinamis)
- CRUD Store Marketplace Costs
- Forward Pricing Calculation

### FASE 3 ✓
- Reverse Pricing (cari harga jual minimum)
- Break-even ROAS & Max CPA

### FASE 4 ✓
- CRUD Ads (data iklan)
- Ads Analysis (GMV, ROAS, AOV, CPA)
- Decision Engine & Grading
- Alerts & Recommendations

### FASE 5 ✓ (Business Intelligence & UX Enhancement)

#### **Dashboard - Pusat Kontrol Bisnis**
- **Business Health Summary**: Status kesehatan bisnis real-time
- **Rule-Based Task Management**: Daftar tugas penting otomatis berdasarkan kondisi bisnis
- **Quick Profit Calculator**: Simulasi margin produk (client-side only)
- **Ads Effectiveness Calculator**: Simulasi ROAS dan ROI iklan (client-side only)
- **Smart Navigation**: Quick access ke fitur-fitur penting
- **User-Friendly Language**: Bahasa sederhana tanpa jargon teknis

#### **Materials - Usage Awareness & Impact Analysis**
- **Usage Tracking**: Menampilkan bahan dipakai di produk mana (badge "📦 X produk")
- **High Impact Indicator**: Icon warning (⚠️) untuk bahan yang berkontribusi >20% ke HPP
- **HPP Contribution Info**: Tooltip menampilkan persentase kontribusi bahan ke biaya produksi
- **Duplicate Function**: Copy bahan untuk input cepat (beda supplier/ukuran)
- **Smart Tooltips**: Informasi detail saat hover (nama produk, persentase kontribusi)
- **Visual Indicators**: Warna dan icon yang jelas untuk decision making

#### **Ads Performance - Actionable Insights**
- **Actionable Status Labels**: Label user-friendly (Aman, Perlu Diperbaiki, dll)
- **Net Profit After Ads**: Tampilan jelas profit/loss setelah biaya iklan
- **Visual Break-Even Indicator**: Gradient bar untuk performa vs break-even
- **Trend Indicators**: Arrow indicators untuk performa campaign
- **Enhanced Reverse Pricing**: Simulasi harga dengan feedback dinamis
- **Diagnosa & Saran**: Section dengan rekomendasi aksi berdasarkan grade
- **User-Friendly Metrics**: Istilah sederhana (Untung Produk, Sisa Untung, dll)

## API Endpoints

### Materials
- `POST /materials` - Create material
- `GET /materials` - Get all materials
- `GET /materials/{id}` - Get material by ID
- `PUT /materials/{id}` - Update material
- `DELETE /materials/{id}` - Delete material

### Products
- `POST /products` - Create product
- `GET /products` - Get all products
- `GET /products/{id}` - Get product by ID
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product (cascade BOM)

### BOM
- `POST /bom` - Create BOM entry
- `GET /bom/{product_id}` - Get BOM for product
- `PUT /bom/{id}` - Update BOM entry
- `DELETE /bom/{id}` - Delete BOM entry

### HPP
- `GET /hpp/{product_id}` - Calculate HPP

### Pricing
- `POST /pricing/calc` - Forward pricing calculation
- `POST /pricing/reverse` - Reverse pricing calculation

### Decision
- `GET /decision/{store_id}/{product_id}` - Get grading & alerts

## Database Schema

Semua data disimpan di `marketplace.db` (SQLite).

### Tables
- materials
- products
- bom
- marketplaces
- stores
- store_products
- discounts
- marketplace_cost_types
- store_marketplace_costs
- ads

## Contoh Workflow

1. **Setup Master Data**
   - Tambah materials (bahan baku)
   - Tambah products
   - Hubungkan dengan BOM

2. **Setup Marketplace & Store**
   - Tambah marketplace (Shopee, Tokopedia, dll)
   - Tambah stores
   - Tambah marketplace cost types (Fee, Ongkir, dll)
   - Set biaya per store

3. **Set Pricing**
   - Tambah store_products dengan harga jual
   - (Opsional) Tambah discounts
   - Calculate forward pricing

4. **Reverse Pricing**
   - Tentukan target profit
   - Dapatkan rekomendasi harga jual

5. **Ads & Grading**
   - Input data iklan
   - Lihat grading & alerts
   - Evaluasi kelayakan produk

6. **Business Intelligence (NEW)**
   - Cek Dashboard untuk health overview
   - Gunakan Quick Calculator untuk simulasi cepat
   - Review Materials page untuk analisis bahan high-impact
   - Monitor Ads Performance untuk optimasi campaign

## Panduan Fitur Baru (Fase 5)

### 📊 Dashboard - Pusat Kontrol Bisnis

**Cara Menggunakan:**
1. Buka halaman Dashboard (menu utama)
2. **Business Health Summary** akan menampilkan:
   - Status kesehatan bisnis (Healthy/Needs Attention)
   - Jumlah produk, toko, dan bahan baku
3. **Daftar Tugas Penting** menampilkan action items otomatis:
   - Klik item untuk langsung ke halaman terkait
   - Contoh: "Belum ada toko" → klik → redirect ke halaman Stores
4. **Simulasi & Kalkulator** (klik tombol di header):
   - Tab "Simulasi Margin Produk": Hitung profit berdasarkan harga, HPP, fee, dll
   - Tab "Simulasi Iklan (ROAS)": Hitung efektivitas iklan tanpa save ke database
5. **Quick Navigation Cards**: Klik untuk akses cepat ke Produk, Toko, atau Bahan Baku

**Tips:**
- Gunakan Quick Calculator sebelum input data real untuk validasi
- Perhatikan "Tugas Penting" untuk prioritas harian
- Dashboard di-refresh otomatis saat data berubah

---

### 🧪 Materials - Usage Awareness & Impact Analysis

**Cara Menggunakan:**
1. Buka halaman **Bahan Baku**
2. **Kolom "Penggunaan"** menampilkan:
   - Badge "📦 X produk" jika bahan dipakai
   - "Belum dipakai" jika belum ada produk yang menggunakan
3. **Hover badge** untuk melihat daftar nama produk yang menggunakan bahan tersebut
4. **Icon Warning (⚠️)** di nama bahan:
   - Muncul jika bahan berkontribusi >20% ke HPP produk
   - Hover untuk tooltip: "Bahan ini berkontribusi signifikan terhadap HPP produk"
5. **Icon Info (ℹ️)** di kolom Harga Satuan:
   - Hover untuk melihat: "Rata-rata menyumbang X% dari HPP produk"
6. **Tombol Copy (📋)**:
   - Klik untuk duplikat bahan
   - ID dikosongkan (harus isi manual)
   - Nama otomatis ditambah "(Copy)"
   - Berguna untuk bahan serupa (beda supplier/ukuran)

**Tips:**
- **Sebelum edit harga bahan**, cek dulu:
  - Berapa produk yang terpengaruh (badge)
  - Seberapa besar dampaknya (icon ℹ️)
- **Fokus negosiasi** pada bahan dengan icon ⚠️ (high impact)
- **Gunakan duplicate** untuk input cepat bahan dari supplier berbeda

---

### 📈 Ads Performance - Actionable Insights

**Cara Menggunakan:**
1. Buka halaman **Iklan**
2. **Status Labels** yang lebih jelas:
   - "Aman untuk Ditingkatkan" (hijau) → Profit bagus, bisa naikkan budget
   - "Perlu Diperbaiki" (kuning) → Masih untung tapi tipis
   - "Segera Hentikan" (merah) → Rugi, stop iklan
3. **Net Profit After Ads**:
   - Tampilan besar di card detail
   - Warna merah jika rugi
   - Pesan jelas: "Total rugi per order setelah dipotong biaya iklan"
4. **Visual Break-Even Bar**:
   - Gradient bar menunjukkan posisi vs break-even
   - Hijau = jauh di atas break-even
   - Merah = di bawah break-even
5. **Section "SARAN UTAMA"**:
   - Rekomendasi aksi langsung berdasarkan grade
   - Contoh: "🛑 Hentikan iklan sementara atau segera naikkan harga jual produk"
6. **Simulasi Harga** (Reverse Pricing):
   - Klik tombol "Simulasi Harga"
   - Input target profit atau ROAS
   - Lihat rekomendasi harga jual minimum

**Tips:**
- **Perhatikan "SARAN UTAMA"** untuk keputusan cepat
- **Gunakan Simulasi Harga** sebelum adjust harga produk
- **Monitor trend** dengan arrow indicators di tabel campaign

---

## Quality Rules

✓ Semua input divalidasi  
✓ Tidak ada hardcode biaya  
✓ Error message jelas  
✓ Business logic di backend  
✓ UI hanya untuk input/display  
✓ **User-friendly language** (Fase 5)  
✓ **Visual feedback** untuk decision making (Fase 5)  
✓ **Client-side simulation** tidak affect database (Fase 5)

## Changelog

### v2.0.0 (Fase 5 - Business Intelligence)
- ✨ Dashboard dengan Business Health Summary
- ✨ Materials dengan Usage Tracking & Impact Analysis
- ✨ Ads Performance dengan Actionable Insights
- ✨ Quick Profit & Ads Calculator (client-side)
- 🔧 Backend: Include BOM items di Products API response
- 🎨 UI/UX: User-friendly language & visual indicators

### v1.0.0 (Fase 1-4)
- ✅ Core features: Materials, Products, BOM, HPP
- ✅ Marketplace & Store management
- ✅ Forward & Reverse Pricing
- ✅ Ads Analysis & Decision Engine
