"""
Direct Database Seed Script
Populates the database with initial data for a default user.
"""
import os
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models, auth

def seed():
    db = SessionLocal()
    try:
        print("Checking for existing user...")
        # 1. Create Default User
        admin_email = "admin@example.com"
        user = db.query(models.User).filter(models.User.email == admin_email).first()
        
        if not user:
            print(f"Creating user {admin_email}...")
            user = models.User(
                email=admin_email,
                hashed_password=auth.get_password_hash("admin123"),
                full_name="Administrator"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            print(f"User already exists with ID: {user.id}")

        if user.id is None:
            print("CRITICAL ERROR: user.id is None. Cannot proceed with seeding.")
            return

        # 2. Seed Data if empty
        if db.query(models.Material).filter(models.Material.user_id == user.id).count() == 0:
            print("Seeding Marketplace Cost Types...")
            ct1 = models.MarketplaceCostType(id="fee-admin", name="Biaya Admin", calc_type="percent", apply_to="price", user_id=user.id)
            ct2 = models.MarketplaceCostType(id="fee-layanan", name="Biaya Layanan", calc_type="fixed", apply_to="after_discount", user_id=user.id)
            
            for ct in [ct1, ct2]:
                existing = db.query(models.MarketplaceCostType).filter_by(id=ct.id, user_id=user.id).first()
                if not existing:
                    db.add(ct)
                else:
                    # Update name if it already exists but with old name
                    existing.name = ct.name
            db.commit()

            print("Seeding Marketplaces...")
            m_shopee = db.query(models.Marketplace).filter_by(id="shopee", user_id=user.id).first()
            if not m_shopee:
                shopee = models.Marketplace(id="shopee", name="Shopee", user_id=user.id)
                db.add(shopee)
            
            m_tokped = db.query(models.Marketplace).filter_by(id="tokopedia", user_id=user.id).first()
            if not m_tokped:
                tokped = models.Marketplace(id="tokopedia", name="Tokopedia", user_id=user.id)
                db.add(tokped)
            db.commit()

            print("Seeding Materials...")
            materials_data = [
                {"id": "kain-katun", "nama": "Kain Katun Rayon", "harga_total": 450000, "jumlah_unit": 100, "satuan": "meter"},
                {"id": "kancing", "nama": "Kancing Jamur", "harga_total": 50000, "jumlah_unit": 100, "satuan": "pcs"},
                {"id": "benang", "nama": "Benang Jahit", "harga_total": 15000, "jumlah_unit": 1, "satuan": "roll"}
            ]
            for m_data in materials_data:
                if not db.query(models.Material).filter_by(id=m_data["id"], user_id=user.id).first():
                    m = models.Material(**m_data, user_id=user.id, harga_satuan=m_data["harga_total"]/m_data["jumlah_unit"])
                    db.add(m)
            db.commit()

            products_data = [
                {"id": "kemeja-01", "nama": "Kemeja Flanel Slim"},
                {"id": "kaos-01", "nama": "Kaos Polos Cotton Combed"}
            ]
            for p_data in products_data:
                if not db.query(models.Product).filter_by(id=p_data["id"], user_id=user.id).first():
                    p = models.Product(**p_data, user_id=user.id)
                    db.add(p)
            db.commit()

            print("Setting up BOM...")
            bom_items_data = [
                {"product_id": "kemeja-01", "material_id": "kain-katun", "qty": 1.5},
                {"product_id": "kemeja-01", "material_id": "kancing", "qty": 8},
                {"product_id": "kaos-01", "material_id": "kain-katun", "qty": 0.8}
            ]
            for b_data in bom_items_data:
                if not db.query(models.BOM).filter_by(product_id=b_data["product_id"], material_id=b_data["material_id"], user_id=user.id).first():
                    b = models.BOM(**b_data, user_id=user.id)
                    db.add(b)
            db.commit()

            print("Creating Store...")
            if not db.query(models.Store).filter_by(id="hikmah-shopee", user_id=user.id).first():
                store = models.Store(id="hikmah-shopee", marketplace_id="shopee", name="Hikmah Mandiri Shopee", user_id=user.id)
                db.add(store)
                db.commit()
                
                print("Listing Product...")
                # List Product
                if not db.query(models.StoreProduct).filter_by(store_id="hikmah-shopee", product_id="kemeja-01", user_id=user.id).first():
                    db.add(models.StoreProduct(store_id="hikmah-shopee", product_id="kemeja-01", harga_jual=120000, user_id=user.id))
                db.commit()

            print("Seeding Complete!")
        else:
            print("Database already contains data for this user. Skipping seed.")

    except Exception as e:
        print(f"An error occurred during seeding: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
