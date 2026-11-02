"""
FastAPI Core Dependencies.
Provides thread-safe database sessions and authenticated user dependencies.
"""

from typing import Generator, Dict, Any
from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db, get_db_session
from app.utils.security import get_current_user, require_roles

def get_database() -> Generator[Session, None, None]:
    """Dependency yielding thread-safe SQLAlchemy DB session."""
    yield from get_db()

def get_doctor_user(user: Dict[str, Any] = Depends(require_roles(["doctor", "admin"]))) -> Dict[str, Any]:
    """Dependency ensuring current user has Doctor or Admin privileges."""
    return user

