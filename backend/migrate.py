import logging
from sqlalchemy import text
from database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    columns_to_add = [
        ("course_proposals", "ai_summary", "TEXT"),
        ("course_proposals", "ai_category", "TEXT"),
        ("course_proposals", "risk_level", "TEXT"),
        ("course_proposals", "demand_score", "INTEGER"),
        ("course_proposals", "ai_recommendation", "TEXT"),
        ("course_proposals", "duplicate_status", "BOOLEAN DEFAULT FALSE"),
        ("course_proposals", "ai_flagged_reason", "TEXT"),
        ("course_proposals", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP"),
        ("course_proposals", "rejection_reason", "TEXT"),
        ("course_proposals", "reviewer_feedback", "TEXT"),
        ("course_proposals", "upvotes", "INTEGER DEFAULT 0"),
        ("course_proposals", "downvotes", "INTEGER DEFAULT 0"),
        ("course_proposals", "comment_count", "INTEGER DEFAULT 0"),
        ("users", "institution_id", "INTEGER"),
        ("users", "specialization", "VARCHAR(255)"),
        ("live_sessions", "host_id", "INTEGER"),
        ("live_sessions", "status", "VARCHAR(50) DEFAULT 'scheduled'"),
        ("live_sessions", "target_batch", "VARCHAR(100)"),
    ]

    for table, column, col_type in columns_to_add:
        try:
            with engine.begin() as conn:
                query = text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
                conn.execute(query)
                logger.info(f"Successfully added column '{column}' to table '{table}'")
        except Exception as e:
            error_str = str(e).lower()
            if "duplicate column name" in error_str or "already exists" in error_str or "42701" in error_str:
                logger.info(f"Column '{column}' already exists in table '{table}', skipping.")
            else:
                logger.error(f"Failed to add column '{column}': {e}")

    # Ensure default PaymentConfig records exist if table is empty
    try:
        from database import SessionLocal
        import models
        db = SessionLocal()
        try:
            if db.query(models.PaymentConfig).count() == 0:
                logger.info("Seeding default PaymentConfig entries for State and National tiers...")
                db.add_all([
                    models.PaymentConfig(
                        tier_name="State",
                        base_amount=1500.0,
                        gst_rate=0.18,
                        gst_amount=270.0,
                        total_amount=1770.0,
                        currency="INR",
                        required_score=50.0
                    ),
                    models.PaymentConfig(
                        tier_name="National",
                        base_amount=2000.0,
                        gst_rate=0.18,
                        gst_amount=360.0,
                        total_amount=2360.0,
                        currency="INR",
                        required_score=60.0
                    )
                ])
                db.commit()
                logger.info("Default PaymentConfig entries seeded successfully.")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error checking/seeding default PaymentConfig entries: {e}")

    logger.info("Migration completed.")

if __name__ == "__main__":
    migrate()
