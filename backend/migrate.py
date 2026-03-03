"""
Migration tool for moving existing SQLite records into PostgreSQL.
Run this locally one time after switching DATABASE_URL to Postgres.
"""

import sqlite3
import psycopg2
import os
import sys

DB_PATH = "integrated_accident_system.db"

TABLES = [
    ("accident_reports", 14),
    ("risk_predictions", 13),
    ("near_misses", 8),
    ("realtime_alerts", 9),
    ("route_analyses", 10),
    ("traffic_reports", 8),
]

# ✅ Column indexes that are boolean in each table (0-based)
BOOL_COLUMNS = {
    "accident_reports": [12],   # verified
    "realtime_alerts": [6],     # active
}


def fix_row(row, table):
    """Convert SQLite 0/1 integers to Python bools for PostgreSQL"""
    bool_indexes = BOOL_COLUMNS.get(table, [])
    new_row = []
    for i, val in enumerate(row):
        if i in bool_indexes and isinstance(val, int):
            new_row.append(bool(val))
        else:
            new_row.append(val)
    return tuple(new_row)


def main():
    if not os.path.exists(DB_PATH):
<<<<<<< HEAD
        print(f"❌ SQLite database not found att {DB_PATH}")
=======
        print(f"❌ SQLite database not found at {DB_PATH}")
>>>>>>> e40d6f304667425a89d71eb7f2c5a5d0905d0a54
        sys.exit(1)

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("❌ Please set DATABASE_URL for Postgres before running this script")
        sys.exit(1)

    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    sqlite_conn = sqlite3.connect(DB_PATH)
    sqlite_cursor = sqlite_conn.cursor()

    pg_conn = psycopg2.connect(database_url)
    pg_cursor = pg_conn.cursor()

    try:
        for table, cols in TABLES:
            print(f"migrating {table}...")
            sqlite_cursor.execute(f"SELECT * FROM {table}")
            rows = sqlite_cursor.fetchall()
            if not rows:
                print("  (no rows)")
                continue

            placeholders = ", ".join(["%s"] * cols)
            insert_sql = f"INSERT INTO {table} VALUES ({placeholders})"

            for row in rows:
                row = fix_row(row, table)
                pg_cursor.execute(insert_sql, row)

            print(f"  ✅ {len(rows)} rows migrated")

        pg_conn.commit()
        print("✅ Migration completedddddddddddd!")
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        pg_conn.rollback()
        sys.exit(1)
    finally:
        sqlite_conn.close()
        pg_conn.close()


if __name__ == "__main__":
    main()