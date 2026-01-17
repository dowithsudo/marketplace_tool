from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Marketplace, Store

def debug_db():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print("--- USERS ---")
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}")
            
            print(f"  --- MARKETPLACES for User {u.id} ---")
            mktplaces = db.query(Marketplace).filter_by(user_id=u.id).all()
            for m in mktplaces:
                print(f"  MktID: '{m.id}', Name: '{m.name}'")
                
                print(f"    --- STORES for Mkt {m.id} ---")
                stores = db.query(Store).filter_by(marketplace_id=m.id, user_id=u.id).all()
                for s in stores:
                    print(f"    StoreID: '{s.id}', Name: '{s.name}'")
                    
        print("\n--- ORPHANED STORES (Wrong User/Mkt)? ---")
        all_stores = db.query(Store).all()
        for s in all_stores:
             if not db.query(Marketplace).filter_by(id=s.marketplace_id, user_id=s.user_id).first():
                 print(f"ORPHAN/BROKEN STORE: ID={s.id}, MktID={s.marketplace_id}, UserID={s.user_id}")

    finally:
        db.close()

if __name__ == "__main__":
    debug_db()
