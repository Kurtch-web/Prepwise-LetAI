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
# Examples:
#   Single origin: https://example.com
#   Multiple origins: https://vercel-frontend.com,https://render-frontend.com,http://localhost:5173
# Set via environment variable: FRONTEND_ORIGIN="https://prepwise-let-ai.vercel.app,http://localhost:5173"
_frontend_origin_str = os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173')
FRONTEND_ORIGINS = [origin.strip() for origin in _frontend_origin_str.split(',') if origin.strip()]

# For backwards compatibility, keep FRONTEND_ORIGIN as the first origin
FRONTEND_ORIGIN = FRONTEND_ORIGINS[0] if FRONTEND_ORIGINS else 'http://localhost:5173'

# For Vercel serverless and databases in Session mode, use minimal pool size
# Neon and other managed DBs limit connections in Session mode
IS_VERCEL = os.getenv('VERCEL') == '1'
DEFAULT_POOL_SIZE = 1 if IS_VERCEL else 10
DEFAULT_MAX_OVERFLOW = 0 if IS_VERCEL else 20

DB_POOL_SIZE = int(os.getenv('DB_POOL_SIZE', str(DEFAULT_POOL_SIZE)))
DB_MAX_OVERFLOW = int(os.getenv('DB_MAX_OVERFLOW', str(DEFAULT_MAX_OVERFLOW)))
DATABASE_URL = os.getenv('DATABASE_URL')
DB_CONNECT_TIMEOUT = int(os.getenv('DB_CONNECT_TIMEOUT', '10'))

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
