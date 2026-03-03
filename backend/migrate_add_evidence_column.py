"""
Migration script to add evidence_files column to accident_reports table
Run this to add the missing column to existing database
"""

import sqlite3
import os

DB_PATH = "integrated_accident_system.db"

def migrate():
    """Add evidence_files column to accident_reports table if it doesn't exist"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database file not found: {DB_PATH}")
        return False
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(accident_reports)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if "evidence_files" in columns:
            print("✅ evidence_files column already exists!")
            conn.close()
            return True
        
        # Add the column
        print("⏳ Adding evidence_files column to accident_reports table...")
        cursor.execute("""
            ALTER TABLE accident_reports 
            ADD COLUMN evidence_files TEXT
        """)
        
        conn.commit()
        conn.close()
        
        print("✅ Migration successful! evidence_files column added.")
        return True
        
    except sqlite3.OperationalError as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = migrate()
    exit(0 if success else 1)
