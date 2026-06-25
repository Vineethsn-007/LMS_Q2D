import sqlite3
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "skillforge.db")

def migrate():
    if not os.path.exists(DB_PATH):
        logger.error(f"Database not found at {DB_PATH}")
        return

    logger.info(f"Connecting to database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    columns_to_add = [
        ("course_proposals", "ai_summary", "TEXT"),
        ("course_proposals", "ai_category", "TEXT"),
        ("course_proposals", "risk_level", "TEXT"),
        ("course_proposals", "demand_score", "INTEGER"),
        ("course_proposals", "ai_recommendation", "TEXT"),
        ("course_proposals", "duplicate_status", "BOOLEAN DEFAULT 0"),
        ("course_proposals", "ai_flagged_reason", "TEXT"),
    ]

    for table, column, col_type in columns_to_add:
        try:
            query = f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"
            cursor.execute(query)
            logger.info(f"Successfully added column '{column}' to table '{table}'")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                logger.info(f"Column '{column}' already exists in table '{table}', skipping.")
            else:
                logger.error(f"Failed to add column '{column}': {e}")

    conn.commit()
    conn.close()
    logger.info("Migration completed.")

if __name__ == "__main__":
    migrate()
