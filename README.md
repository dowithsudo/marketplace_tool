# Marketplace Tool

Aplikasi lokal untuk kebutuhan pribadi: HPP, Pricing, Ads Analysis, Reverse Pricing, dan Grading.

## Arsitektur

- **Backend**: Python + FastAPI + SQLite
- **Frontend**: React
- **Database**: SQLite (file lokal: `marketplace.db`)

## Setup Backend

```bash
# Aktifkan virtual environment
source venv/bin/activate

# Install dependencies (sudah dilakukan)
pip install -r backend/requirements.txt

# Jalankan server
cd backend
python run.py
```

Backend akan berjalan di: http://localhost:8000
API Docs: http://localhost:8000/docs

## Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend akan berjalan di: http://localhost:5173

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

## Quality Rules

✓ Semua input divalidasi
✓ Tidak ada hardcode biaya
✓ Error message jelas
✓ Business logic di backend
✓ UI hanya untuk input/display
