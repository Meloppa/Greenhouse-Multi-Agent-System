import os
from dotenv import load_dotenv

load_dotenv()

# Telegram Bot Config
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# Email Alert SMTP Config
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_TO_EMAIL = os.getenv("SMTP_TO_EMAIL", "")

# Supabase Credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# Vercel Credentials
VERCEL_TOKEN = os.getenv("VERCEL_TOKEN", "")
VERCEL_PROJECT_ID = os.getenv("VERCEL_PROJECT_ID", "")

# Mock Mode Indicators
IS_TELEGRAM_CONFIGURED = bool(TELEGRAM_BOT_TOKEN)
IS_EMAIL_CONFIGURED = bool(SMTP_USER and SMTP_PASSWORD and SMTP_TO_EMAIL)
IS_SUPABASE_CONFIGURED = bool(SUPABASE_URL and SUPABASE_KEY)
IS_VERCEL_CONFIGURED = bool(VERCEL_TOKEN and VERCEL_PROJECT_ID)

# Task-specific agent models loaded from .env (Ollama colon-format tags)
VISION_MODEL = os.getenv("VISION_MODEL", "qwen3-vl:4b")
EXPERT_MODEL = os.getenv("EXPERT_MODEL", "gemma3:1b")
SCHEDULER_MODEL = os.getenv("SCHEDULER_MODEL", "llama3.2:1b")

# Web Search Tool
SEARCH_ENABLED = os.getenv("SEARCH_ENABLED", "true").lower() == "true"

# Soil Moisture Sensor Calibration
# The ESP8266 sends the raw analog ADC reading (0-1023); the backend converts
# it to a 0-100% wetness value using these two reference points.
SOIL_RAW_DRY = int(os.getenv("SOIL_RAW_DRY", "1023"))  # ADC reading in dry air  -> 0%
SOIL_RAW_WET = int(os.getenv("SOIL_RAW_WET", "0"))     # ADC reading submerged  -> 100%

# JWT Authentication
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "zentra-flora-insecure-fallback-key-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours default
