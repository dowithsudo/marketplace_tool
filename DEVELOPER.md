# Developer Documentation - Fase 5 Enhancements

## Overview
Fase 5 fokus pada Business Intelligence dan UX Enhancement untuk membuat aplikasi lebih user-friendly dan actionable.

## Architecture Changes

### Backend Changes

#### 1. Products API Enhancement
**File:** `backend/app/routers/products.py`

**Changes:**
- Modified `GET /products` endpoint to include BOM items in response
- Added automatic HPP calculation in product response
- Populated material info (nama, harga_satuan, biaya_bahan) for each BOM item

**Reasoning:**
- Menghindari N+1 query problem (sebelumnya perlu fetch BOM per produk)
- Frontend dapat langsung menggunakan data BOM tanpa additional API calls
- HPP calculation dilakukan di backend untuk consistency

**Schema Changes:**
```python
# backend/app/schemas/product.py
class BOMItem(BaseModel):
    id: int
    material_id: str
    qty: float
    material_nama: Optional[str] = None
    material_harga_satuan: Optional[float] = None
    biaya_bahan: Optional[float] = None

class ProductResponse(ProductBase):
    id: str
    bom_items: List[BOMItem] = []
    hpp: Optional[float] = None
```

**Performance Consideration:**
- Query optimization: Menggunakan loop untuk fetch materials (bisa di-optimize dengan JOIN di masa depan)
- Trade-off: Sedikit lebih lambat di backend, tapi mengurangi API calls dari frontend

---

### Frontend Changes

#### 1. Dashboard Enhancement
**File:** `frontend/src/pages/Dashboard.jsx`

**New Features:**
- Business Health Summary dengan rule-based checks
- Action Items (Tugas Penting) otomatis
- Quick Profit Calculator (client-side only)
- Ads Effectiveness Calculator (client-side only)
- Smart navigation cards

**State Management:**
```javascript
const [stats, setStats] = useState({ materials: 0, products: 0, stores: 0 });
const [health, setHealth] = useState({ status: 'loading', riskCount: 0, goodCount: 0 });
const [showCalc, setShowCalc] = useState(false);
const [calcMode, setCalcMode] = useState('profit'); // 'profit' or 'ads'
```

**Business Rules:**
- Health status = 'needs_attention' if stores.length === 0 OR products.length === 0
- Health status = 'healthy' if all checks pass
- Tasks are generated based on missing data (stores, products)

**Calculator Logic:**
- All calculations are client-side only (no API calls)
- Results are not persisted to database
- Used for quick validation before actual data entry

---

#### 2. Materials Enhancement
**File:** `frontend/src/pages/Materials.jsx`

**New Features:**
- Usage tracking (shows which products use each material)
- High-impact indicator (⚠️ for materials contributing >20% to HPP)
- HPP contribution info (ℹ️ tooltip with percentage)
- Duplicate function (copy material for quick entry)

**Data Processing:**
```javascript
// Build material usage map from products data
const usageMap = {};
productsRes.data.forEach(product => {
  const bomItems = product.bom_items || [];
  bomItems.forEach(bomItem => {
    if (!usageMap[bomItem.material_id]) {
      usageMap[bomItem.material_id] = {
        products: [],
        avgContribution: 0,
        totalContribution: 0,
        count: 0
      };
    }
    // Calculate contribution percentage
    if (product.hpp && bomItem.biaya_bahan) {
      const contribution = (bomItem.biaya_bahan / product.hpp) * 100;
      usageMap[bomItem.material_id].totalContribution += contribution;
      usageMap[bomItem.material_id].count += 1;
    }
  });
});
```

**Visual Indicators:**
- Badge "📦 X produk" if material is used
- Icon ⚠️ if avgContribution > 20%
- Icon ℹ️ with tooltip showing exact percentage
- Tooltips show product names on hover

**Duplicate Function:**
```javascript
const handleDuplicate = (material) => {
  setFormData({
    id: '', // Clear ID so user must provide new one
    nama: `${material.nama} (Copy)`,
    harga_total: material.harga_total,
    jumlah_unit: material.jumlah_unit,
    satuan: material.satuan
  });
  setEditingId(null);
  setShowModal(true);
};
```

---

#### 3. Ads Performance Enhancement
**File:** `frontend/src/pages/AdsPerformance.jsx`

**UI/UX Changes:**
- Changed technical terms to user-friendly Indonesian
- Added "SARAN UTAMA" section with actionable advice
- Enhanced visual feedback (colors, icons, gradients)
- Improved reverse pricing simulation modal

**Text Changes:**
- "Profit Produk (Gross)" → "Untung Produk (Sebelum Iklan)"
- "UNTUNG BERSIH SETELAH IKLAN" → "SISA UNTUNG (Setelah Bayar Iklan)"
- Added clear loss message: "Total rugi per order setelah dipotong biaya iklan"

**Actionable Labels:**
```javascript
const getDecisionUI = (grade) => {
  switch(grade) {
    case 'EXCELLENT': return { label: 'Sangat Menguntungkan', color: '#22c55e' };
    case 'GOOD': return { label: 'Aman untuk Ditingkatkan', color: '#22c55e' };
    case 'VIABLE': return { label: 'Masih Layak Dijalankan', color: '#f59e0b' };
    case 'RISKY': return { label: 'Perlu Diperbaiki Segera', color: '#f59e0b' };
    case 'NOT_VIABLE': return { label: 'Segera Hentikan', color: '#ef4444' };
  }
};
```

---

## Testing Checklist

### Dashboard
- [ ] Business health shows correct status
- [ ] Tasks list shows relevant action items
- [ ] Quick calculator opens and calculates correctly
- [ ] Ads calculator shows ROAS and ROI
- [ ] Navigation cards redirect to correct pages

### Materials
- [ ] Usage badge shows correct product count
- [ ] Tooltip displays product names
- [ ] Warning icon appears for high-impact materials (>20%)
- [ ] Info icon shows correct contribution percentage
- [ ] Duplicate button copies data correctly
- [ ] ID is cleared in duplicate modal

### Ads Performance
- [ ] Status labels are user-friendly
- [ ] Net profit displays correctly (red if negative)
- [ ] "SARAN UTAMA" shows relevant advice
- [ ] Reverse pricing modal works
- [ ] All text is in simple Indonesian

---

## Future Enhancements

### Dashboard
- [ ] Add charts for trend visualization
- [ ] Add export functionality for reports
- [ ] Add customizable widgets
- [ ] Add notification system

### Materials
- [ ] Add bulk edit for high-impact materials
- [ ] Add supplier management
- [ ] Add price history tracking
- [ ] Add automated alerts for price changes

### Ads Performance
- [ ] Add campaign comparison
- [ ] Add automated optimization suggestions
- [ ] Add A/B testing support
- [ ] Add integration with ad platforms API

---

## Performance Optimization Notes

### Current Performance
- Dashboard: ~3 API calls (materials, products, stores)
- Materials: ~2 API calls (materials, products with BOM)
- Ads Performance: ~1-2 API calls depending on data

### Optimization Opportunities
1. **Caching:** Implement client-side caching for frequently accessed data
2. **Pagination:** Add pagination for large datasets (materials, products)
3. **Lazy Loading:** Load BOM data only when needed
4. **Database Indexing:** Add indexes on frequently queried fields
5. **Query Optimization:** Use JOIN instead of loop for BOM + Material fetch

---

## Maintenance Guidelines

### Code Style
- Use functional components with hooks
- Keep components focused (single responsibility)
- Extract reusable logic to custom hooks
- Use descriptive variable names (avoid abbreviations)

### State Management
- Use local state for UI-only data
- Use API calls for server data
- Avoid prop drilling (use context if needed)

### Error Handling
- Always wrap API calls in try-catch
- Show user-friendly error messages
- Log errors to console for debugging

### Documentation
- Update README when adding new features
- Add inline comments for complex logic
- Update this dev doc for architectural changes

---

## Troubleshooting

### Materials not showing usage data
**Symptom:** Badge shows "Belum dipakai" even though BOM exists

**Causes:**
1. Products API not returning BOM items
2. Material ID mismatch between BOM and Materials table
3. Frontend not parsing BOM data correctly

**Debug Steps:**
1. Check console log: `Products data:` should show bom_items array
2. Check console log: `Material usage map keys:` should match material IDs
3. Check console log: `Checking material X:` should show object (not undefined)

**Solution:**
- Ensure backend includes BOM items in ProductResponse
- Verify material_id field exists in BOM items
- Check for case sensitivity in material IDs

### Calculator not showing results
**Symptom:** Click "Hitung" but no results appear

**Causes:**
1. Form validation failing
2. Calculation logic error
3. State not updating

**Debug Steps:**
1. Check console for errors
2. Verify all required fields are filled
3. Check if calcResult state is being set

**Solution:**
- Add console.log in calculation functions
- Verify parseFloat is handling empty strings correctly
- Ensure setCalcResult is called after calculation

---

## API Documentation Updates

### GET /api/products

**Response Schema (Updated):**
```json
{
  "id": "string",
  "nama": "string",
  "bom_items": [
    {
      "id": 1,
      "material_id": "string",
      "qty": 0.0,
      "material_nama": "string",
      "material_harga_satuan": 0.0,
      "biaya_bahan": 0.0
    }
  ],
  "hpp": 0.0
}
```

**Performance:** O(n*m) where n = products, m = avg BOM items per product

**Caching:** Not implemented (consider adding Redis for production)

---

## Deployment Notes

### Docker Build
- Frontend build includes all new components
- Backend includes updated schemas and routers
- No database migration needed (schema changes are additive)

### Environment Variables
No new environment variables required for Fase 5 features.

### Rollback Plan
If issues occur:
1. Revert to previous Docker image
2. Frontend changes are backward compatible
3. Backend changes only add fields (no breaking changes)

---

## Contributors
- Initial implementation: Fase 5 (Jan 2026)
- Maintained by: [Your Name]

## License
[Your License]
