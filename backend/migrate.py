import logging
from sqlalchemy import text
from database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    tables_to_drop = [
        "stats",
        "course_proposals",
        "proposal_votes",
        "proposal_comments",
        "course_feedback",
        "subscribers",
        "bookmarks"
    ]

    for table in tables_to_drop:
        try:
            with engine.begin() as conn:
                conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                logger.info(f"Dropped out-of-scope table '{table}'")
        except Exception as e:
            logger.warning(f"Note dropping table '{table}': {e}")

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
