# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.1] - 2026-01-18

### Fixed
- **Reports Page Crash**: Fixed a crash on the Reports page caused by a missing icon import (`X` from lucide-react), which resulted in a blank page.

## [2.1.0] - 2026-01-17

### Added
- **Marketplace Management UI**: Added "Daftar Marketplace" section to list all registered marketplaces.
- **Edit Marketplace**: Ability to rename existing marketplaces.
- **Delete Marketplace**: Ability to delete marketplaces with safety checks.

### Changed
- **Marketplace Deletion Rule**: Backend now prevents deletion of a marketplace if it has active stores linked to it.
- **Marketplace API**: Added `PUT` endpoint for updating marketplace details.

## [2.0.0] - 2026-01-16

### Added - Fase 5: Business Intelligence & UX Enhancement

#### Dashboard - Pusat Kontrol Bisnis
- **Business Health Summary**: Real-time status kesehatan bisnis dengan rule-based checks
- **Rule-Based Task Management**: Daftar tugas penting otomatis berdasarkan kondisi bisnis
- **Quick Profit Calculator**: Simulasi margin produk (client-side only, tidak save ke database)
- **Ads Effectiveness Calculator**: Simulasi ROAS dan ROI iklan (client-side only)
- **Smart Navigation Cards**: Quick access ke fitur-fitur penting
- **Pro Tips Section**: Tips bisnis untuk user

#### Materials - Usage Awareness & Impact Analysis
- **Usage Tracking**: Badge "📦 X produk" menampilkan bahan dipakai di produk mana
- **High Impact Indicator**: Icon warning (⚠️) untuk bahan yang berkontribusi >20% ke HPP
- **HPP Contribution Info**: Tooltip dengan persentase kontribusi bahan ke biaya produksi
- **Duplicate Function**: Tombol copy untuk duplikat bahan (input cepat bahan serupa)
- **Smart Tooltips**: Informasi detail saat hover (nama produk, persentase kontribusi)
- **Visual Indicators**: Warna dan icon yang jelas untuk decision making

#### Ads Performance - Actionable Insights
- **Actionable Status Labels**: Label user-friendly (Aman, Perlu Diperbaiki, Segera Hentikan)
- **Net Profit After Ads**: Tampilan jelas profit/loss setelah biaya iklan dengan color coding
- **Visual Break-Even Indicator**: Gradient bar untuk performa vs break-even
- **Trend Indicators**: Arrow indicators untuk performa campaign
- **Enhanced Reverse Pricing**: Simulasi harga dengan feedback dinamis
- **Diagnosa & Saran Section**: Rekomendasi aksi langsung berdasarkan grade
- **User-Friendly Metrics**: Istilah sederhana (Untung Produk, Sisa Untung, dll)

### Changed

#### Backend
- **Products API**: Modified `GET /api/products` to include BOM items in response
  - Added `bom_items` array with material info (nama, harga_satuan, biaya_bahan)
  - Added `hpp` field with automatic calculation
  - Improved performance by reducing N+1 query problem

#### Frontend
- **Materials Page**: Refactored to fetch and process products data for usage analysis
- **Dashboard Page**: Complete redesign from data display to business control center
- **Ads Performance Page**: Enhanced UI with user-friendly language and visual feedback

### Fixed
- Material usage not showing when BOM exists (fixed by including BOM in Products API)
- Console errors from unused state variables
- Z-index issues with modals (previous fix maintained)

### Technical Details

#### Files Modified
**Backend:**
- `backend/app/schemas/product.py` - Added BOMItem schema
- `backend/app/routers/products.py` - Enhanced get_products endpoint

**Frontend:**
- `frontend/src/pages/Dashboard.jsx` - Complete refactor
- `frontend/src/pages/Materials.jsx` - Added usage tracking and impact analysis
- `frontend/src/pages/AdsPerformance.jsx` - UI/UX improvements

#### Dependencies
No new dependencies added. All features use existing libraries:
- `lucide-react` for icons
- `framer-motion` for animations
- `react-router-dom` for navigation

---

## [1.0.0] - 2026-01-14

### Added - Fase 1-4: Core Features

#### Fase 1: Master Data Management
- CRUD Materials (bahan baku)
- CRUD Products
- CRUD BOM (Bill of Materials)
- Perhitungan HPP otomatis

#### Fase 2: Marketplace & Store Management
- CRUD Marketplaces
- CRUD Stores
- CRUD Store Products (harga per toko)
- CRUD Discounts
- CRUD Marketplace Cost Types (dinamis)
- CRUD Store Marketplace Costs
- Forward Pricing Calculation

#### Fase 3: Advanced Pricing
- Reverse Pricing (cari harga jual minimum)
- Break-even ROAS calculation
- Max CPA calculation

#### Fase 4: Ads Analysis
- CRUD Ads (data iklan)
- Ads Analysis (GMV, ROAS, AOV, CPA)
- Decision Engine & Grading
- Alerts & Recommendations

### Technical Stack
- **Backend**: Python 3.11 + FastAPI
- **Frontend**: React 18 + Vite
- **Database**: PostgreSQL (Docker) / SQLite (Local)
- **Deployment**: Docker Compose

---

## Migration Guide

### From v1.0.0 to v2.0.0

#### Database
No migration required. All changes are additive (new fields in API response only).

#### API
**Breaking Changes:** None

**New Response Fields:**
- `GET /api/products` now includes:
  - `bom_items`: Array of BOM items with material info
  - `hpp`: Calculated HPP value

**Backward Compatibility:**
- All existing API endpoints remain unchanged
- New fields are optional (default to empty array/null)
- Frontend gracefully handles missing fields

#### Frontend
**No action required** for existing deployments. New features are automatically available after rebuild.

**For custom frontends:**
- Update to handle new `bom_items` field in products response
- Update to handle new `hpp` field in products response

---

## Roadmap

### v2.1.0 (Planned)
- [ ] Charts and trend visualization
- [ ] Export functionality for reports
- [ ] Bulk edit for materials
- [ ] Supplier management

### v2.2.0 (Planned)
- [ ] Campaign comparison
- [ ] Automated optimization suggestions
- [ ] A/B testing support
- [ ] Integration with ad platforms API

### v3.0.0 (Future)
- [ ] Multi-user collaboration
- [ ] Role-based access control
- [ ] Real-time notifications
- [ ] Mobile app

---

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact: [Your Email]
- Documentation: See README.md and DEVELOPER.md

---

## Acknowledgments

- FastAPI for excellent backend framework
- React team for amazing frontend library
- All contributors and testers
