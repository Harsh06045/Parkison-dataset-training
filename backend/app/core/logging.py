"""
NeuroFusionAI Core Logging Module.
Sets up structured application and audit logging.
"""

import logging
import sys
from app.core.config import settings

def setup_logger(name: str = "neurofusion") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            "[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))
    return logger

logger = setup_logger()

