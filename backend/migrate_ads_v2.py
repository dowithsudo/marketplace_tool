import sqlalchemy
from sqlalchemy import create_engine, text
import os

# Try to get from ENV, else fallback to the one used in previous migration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user_marttool:password_marttool@localhost:5432/marketplace_db")

def migrate():
    print(f"Connecting to database: {DATABASE_URL}")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            # List of new columns and their types
            new_columns = [
                ("impressions", "INTEGER DEFAULT 0"),
                ("clicks", "INTEGER DEFAULT 0"),
                ("ctr", "FLOAT DEFAULT 0.0"),
                ("direct_conversions", "INTEGER DEFAULT 0"),
                ("items_sold", "INTEGER DEFAULT 0"),
                ("start_date", "VARCHAR"),
                ("end_date", "VARCHAR")
            ]

            for col_name, col_type in new_columns:
                try:
                    print(f"Attempting to add {col_name} column to ads table...")
                    # Note: IF NOT EXISTS is not standard SQL in ALTER TABLE for all DBs, 
                    # so we wrap in try-except block is safer if running multiple times on Postgres/SQLite without strict checks.
                    # Postgres 9.6+ supports IF NOT EXISTS effectively via exception handling or specific syntax, but simple ALTER might fail.
                    conn.execute(text(f"ALTER TABLE ads ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    print(f"Success: added {col_name}.")
                except Exception as e:
                    # check if error is "duplicate column" or "already exists"
                    err_str = str(e).lower()
                    if "already exists" in err_str or "duplicate column" in err_str:
                        print(f"Skipping {col_name}, already exists.")
                    else:
                        print(f"Failed to add {col_name}: {e}")
            
    except Exception as e:
        print(f"Migration fatal error: {e}")

if __name__ == "__main__":
    migrate()
