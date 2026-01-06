import os
import ssl
from pathlib import Path
from typing import Optional, Tuple

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data'
USERS_FILE = DATA_DIR / 'users.json'

SESSION_TTL_MINUTES = int(os.getenv('SESSION_TTL_MINUTES', '60'))

# Support multiple FRONTEND_ORIGIN values (comma-separated for production)
_frontend_origin_str = os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173')
FRONTEND_ORIGINS = [origin.strip() for origin in _frontend_origin_str.split(',')]

# For backwards compatibility, keep FRONTEND_ORIGIN as the first origin
FRONTEND_ORIGIN = FRONTEND_ORIGINS[0]

DB_POOL_SIZE = int(os.getenv('DB_POOL_SIZE', '10'))
DB_MAX_OVERFLOW = int(os.getenv('DB_MAX_OVERFLOW', '20'))
DATABASE_URL = os.getenv('DATABASE_URL')
DB_CONNECT_TIMEOUT = int(os.getenv('DB_CONNECT_TIMEOUT', '10'))

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
