import sqlalchemy
from sqlalchemy import create_engine, text

# Database URL (localhost because we run from host accessing mapped port)
DATABASE_URL = "postgresql://user_marttool:password_marttool@localhost:5432/marketplace_db"

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            print("Attempting to add total_sales column to ads table...")
            conn.execute(text("ALTER TABLE ads ADD COLUMN total_sales INTEGER DEFAULT 0"))
            conn.commit()
            print("Migration successful: added total_sales column.")
        except Exception as e:
            print(f"Migration failed (column might already exist): {e}")

if __name__ == "__main__":
    migrate()
