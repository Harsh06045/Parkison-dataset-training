"""
Database Session Management for Neon PostgreSQL / Persistent Store.
Supports Neon cloud connection pooling, TLS/SSL configuration, and resilient local fallback.
"""

import os
import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.pool import StaticPool

logger = logging.getLogger("neurofusion.db")

DB_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(DB_DIR)
BACKEND_DIR = os.path.dirname(APP_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
DEFAULT_SQLITE_PATH = os.path.join(BACKEND_DIR, "uploads", "parkinson_neon_store.db")
os.makedirs(os.path.dirname(DEFAULT_SQLITE_PATH), exist_ok=True)

# Helper to load .env.local and .env
def _load_env_files():
    for f in [".env.local", ".env"]:
        for d in [PROJECT_ROOT, BACKEND_DIR]:
            p = os.path.join(d, f)
            if os.path.exists(p):
                try:
                    with open(p, "r", encoding="utf-8") as env_file:
                        for line in env_file:
                            line = line.strip()
                            if line and not line.startswith("#") and "=" in line:
                                k, v = line.split("=", 1)
                                k = k.strip()
                                v = v.strip().strip("'\"")
                                if k not in os.environ:
                                    os.environ[k] = v
                except Exception:
                    pass

_load_env_files()

# Read database URL from environment or .env
DATABASE_URL = os.environ.get("NEON_DATABASE_URL") or os.environ.get("DATABASE_URL")

engine = None
SessionLocal = None
ACTIVE_DIALECT = "unknown"
IS_FALLBACK = False

def _create_db_engine():
    global engine, SessionLocal, ACTIVE_DIALECT, IS_FALLBACK
    
    url = DATABASE_URL
    if url:
        url = url.strip()
        # Normalise Postgres dialect schema for psycopg2
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
            
        try:
            logger.info("Connecting to primary PostgreSQL / Neon instance...")
            # Neon requires SSL; configure robust connection parameters
            connect_args = {"connect_timeout": 10}
            if "neon.tech" in url or "sslmode" not in url:
                if "?" in url:
                    if "sslmode=" not in url:
                        url += "&sslmode=require"
                else:
                    url += "?sslmode=require"
                    
            engine = create_engine(
                url,
                pool_pre_ping=True,
                pool_recycle=300,
                pool_size=5,
                max_overflow=10,
                connect_args=connect_args
            )
            # Test immediate connectivity
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            ACTIVE_DIALECT = "postgresql"
            IS_FALLBACK = False
            logger.info("Successfully established connection to Neon PostgreSQL.")
        except Exception as e:
            logger.warning(
                f"Could not connect to external PostgreSQL ({e}). "
                f"Activating transparent high-durability local SQLite fallback at {DEFAULT_SQLITE_PATH}."
            )
            engine = None

    if engine is None:
        # Transparent resilient local SQLite database
        sqlite_url = f"sqlite:///{DEFAULT_SQLITE_PATH}"
        engine = create_engine(
            sqlite_url,
            connect_args={"check_same_thread": False, "timeout": 15},
            poolclass=StaticPool
        )
        try:
            with engine.connect() as conn:
                conn.execute(text("PRAGMA journal_mode=WAL;"))
                conn.execute(text("PRAGMA busy_timeout=5000;"))
        except Exception:
            pass
        ACTIVE_DIALECT = "sqlite"
        IS_FALLBACK = True
        logger.info(f"Local storage store active at {DEFAULT_SQLITE_PATH}")

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

_create_db_engine()

def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for thread-safe database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_session() -> Session:
    """Helper for services to obtain a direct database session."""
    return SessionLocal()

def check_connection() -> dict:
    """Check database health and return connection metadata."""
    try:
        with engine.connect() as conn:
            res = conn.execute(text("SELECT 1")).scalar()
            return {
                "status": "connected" if res == 1 else "degraded",
                "dialect": ACTIVE_DIALECT,
                "is_fallback": IS_FALLBACK,
                "database_url_configured": bool(DATABASE_URL)
            }
    except Exception as e:
        return {
            "status": "error",
            "dialect": ACTIVE_DIALECT,
            "is_fallback": IS_FALLBACK,
            "error": str(e)
        }
