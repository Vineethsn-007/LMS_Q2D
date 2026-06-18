import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Fetch database URL from environment, default to postgresql or SQLite fallback
DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    logger.warning("DATABASE_URL env var not found. Falling back to SQLite local database.")
    DATABASE_URL = "sqlite:///./skillforge.db"

# Setup engine configuration
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    # Test connection
    with engine.connect() as conn:
        logger.info(f"Successfully connected to database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
except Exception as e:
    logger.error(f"Failed to connect to database at {DATABASE_URL}. Error: {e}")
    logger.warning("Falling back to SQLite: sqlite:///./skillforge.db")
    DATABASE_URL = "sqlite:///./skillforge.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
