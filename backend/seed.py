"""
Seed script to initialize basic marketplace data with example materials and products
"""
import requests
import time

BASE_URL = "http://localhost:8000"

def seed():
    print("Seeding Marketplace Cost Types...")
    cost_types = [
        {"id": "fee-admin", "name": "Admin Fee (Percent of Price)", "calc_type": "percent", "apply_to": "price"},
        {"id": "fee-layanan", "name": "Service Fee (Percent of After Disc)", "calc_type": "percent", "apply_to": "after_discount"},
        {"id": "packing", "name": "Packing Cost (Fixed)", "calc_type": "fixed", "apply_to": "after_discount"}
    ]
    
    for ct in cost_types:
        requests.post(f"{BASE_URL}/marketplace-cost-types", json=ct)

    print("Seeding Marketplaces...")
    marketplaces = [{"id": "shopee", "name": "Shopee"}, {"id": "tokopedia", "name": "Tokopedia"}]
    for m in marketplaces:
        requests.post(f"{BASE_URL}/marketplaces", json=m)

    print("Seeding Materials...")
    materials = [
        {"id": "kain-katun", "nama": "Kain Katun Rayon", "harga_total": 450000, "jumlah_unit": 100, "satuan": "meter"},
        {"id": "kancing", "nama": "Kancing Jamur", "harga_total": 50000, "jumlah_unit": 100, "satuan": "pcs"},
        {"id": "benang", "nama": "Benang Jahit", "harga_total": 15000, "jumlah_unit": 1, "satuan": "roll"}
    ]
    for mat in materials:
        requests.post(f"{BASE_URL}/materials", json=mat)

    print("Seeding Products...")
    products = [
        {"id": "kemeja-01", "nama": "Kemeja Flanel Slim", "biaya_lain": 15000},
        {"id": "kaos-01", "nama": "Kaos Polos Cotton Combed", "biaya_lain": 5000}
    ]
    for p in products:
        requests.post(f"{BASE_URL}/products", json=p)

    print("Setting up BOM...")
    bom_items = [
        {"product_id": "kemeja-01", "material_id": "kain-katun", "qty": 1.5},
        {"product_id": "kemeja-01", "material_id": "kancing", "qty": 8},
        {"product_id": "kaos-01", "material_id": "kain-katun", "qty": 0.8}
    ]
    for b in bom_items:
        requests.post(f"{BASE_URL}/bom", json=b)

    print("Creating Stores...")
    stores = [
        {"id": "hikmah-shopee", "marketplace_id": "shopee", "name": "Hikmah Mandiri Shopee"},
        {"id": "hikmah-tokped", "marketplace_id": "tokopedia", "name": "Hikmah Mandiri Tokopedia"}
    ]
    for s in stores:
        requests.post(f"{BASE_URL}/stores", json=s)

    print("Adding Store Costs...")
    # Add Admin Fee to Shopee store (5%)
    requests.post(f"{BASE_URL}/store-marketplace-costs", json={
        "store_id": "hikmah-shopee", "cost_type_id": "fee-admin", "value": 0.05
    })
    # Add Packing to Shopee store (2000)
    requests.post(f"{BASE_URL}/store-marketplace-costs", json={
        "store_id": "hikmah-shopee", "cost_type_id": "packing", "value": 2000
    })

    print("Listing Products to Stores...")
    # List Kemeja to Shopee with price 120k
    requests.post(f"{BASE_URL}/store-products", json={
        "store_id": "hikmah-shopee", "product_id": "kemeja-01", "harga_jual": 120000
    })

    print("Seeding Complete!")

if __name__ == "__main__":
    seed()
