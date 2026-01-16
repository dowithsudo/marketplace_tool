# Marketplace Tool - Quick Reference

## 🚀 Quick Start

```bash
# Start application
docker-compose up -d --build

# Seed database
docker exec -it marttool-backend python seed_db.py

# Access application
http://localhost:8080

# Default login
Email: admin@example.com
Password: admin123
```

## 📋 Feature Summary

### ✅ Core Features (v1.0)
- Materials, Products, BOM Management
- HPP Calculation
- Marketplace & Store Management
- Forward & Reverse Pricing
- Ads Analysis & Decision Engine

### ✨ New in v2.0 (Fase 5)
- **Dashboard**: Business health overview & quick calculators
- **Materials**: Usage tracking & impact analysis
- **Ads**: Actionable insights & user-friendly metrics

## 🎯 Key Workflows

### 1. Setup Master Data
```
Materials → Products → BOM → HPP
```

### 2. Setup Marketplace
```
Marketplace → Stores → Cost Types → Store Costs
```

### 3. Pricing
```
Store Products → Forward Pricing → Reverse Pricing
```

### 4. Ads Analysis
```
Ads Data → Analysis → Grading → Decision
```

### 5. Business Intelligence (NEW)
```
Dashboard → Health Check → Quick Calc → Action Items
```

## 🔑 Key Indicators

### Materials Page
- 📦 **Badge**: Bahan dipakai di X produk
- ⚠️ **Warning**: Kontribusi >20% ke HPP (high impact)
- ℹ️ **Info**: Persentase kontribusi ke HPP
- 📋 **Copy**: Duplikat bahan untuk input cepat

### Ads Performance
- 🟢 **Aman untuk Ditingkatkan**: Profit bagus
- 🟡 **Perlu Diperbaiki**: Masih untung tapi tipis
- 🔴 **Segera Hentikan**: Rugi, stop iklan

### Dashboard
- ✅ **Healthy**: Semua sistem normal
- ⚠️ **Needs Attention**: Ada yang perlu diperbaiki

## 📊 Quick Calculations

### Profit Margin
```
Profit = Harga Jual - (HPP + Fee + Ongkir + Iklan)
Margin = (Profit / Harga Jual) × 100%
```

### ROAS (Return on Ad Spend)
```
ROAS = GMV / Ad Spend
```

### ROI (Return on Investment)
```
ROI = (Net Profit / Ad Spend) × 100%
```

### Break-Even ROAS
```
Break-Even ROAS = 1 / Margin
```

## 🛠️ Troubleshooting

### Materials not showing usage
1. Check console: `Products data` should have `bom_items`
2. Verify material IDs match between BOM and Materials
3. Hard refresh (Ctrl+Shift+R)

### Calculator not working
1. Check all required fields are filled
2. Check console for errors
3. Verify numbers are valid (no negative values)

### Docker issues
```bash
# Full reset
docker-compose down
docker-compose up --build -d

# Check logs
docker logs marttool-backend
docker logs marttool-web
```

## 📁 Project Structure

```
marketplace_tool/
├── backend/
│   ├── app/
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── routers/     # API endpoints
│   │   └── services/    # Business logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── api/         # API clients
│   │   └── utils/       # Utilities
│   └── package.json
├── docker-compose.yml
├── README.md           # User documentation
├── DEVELOPER.md        # Developer guide
└── CHANGELOG.md        # Version history
```

## 🔗 Important Links

- **Application**: http://localhost:8080
- **API Docs**: http://localhost:8000/docs
- **Database**: PostgreSQL on port 5432

## 📞 Support

- **Documentation**: README.md, DEVELOPER.md
- **Changelog**: CHANGELOG.md
- **Issues**: [GitHub Issues]
- **Email**: [Your Email]

## 🎓 Best Practices

### Before Editing Material Prices
1. Check usage badge (berapa produk terpengaruh)
2. Check impact indicator (seberapa besar dampak)
3. Use calculator for simulation first

### Before Running Ads
1. Calculate break-even ROAS
2. Set max CPA based on profit margin
3. Monitor daily and adjust budget

### Before Changing Product Prices
1. Use reverse pricing to find minimum price
2. Check marketplace fees
3. Simulate in calculator first

## 📈 Performance Tips

- Use duplicate function for similar materials
- Use quick calculator before data entry
- Check dashboard daily for health status
- Focus on high-impact materials for cost reduction

## 🔐 Security Notes

- Change default password after first login
- Use strong passwords
- Backup database regularly
- Keep Docker images updated

---

**Version**: 2.0.0  
**Last Updated**: 2026-01-16  
**Maintained by**: [Your Name]
