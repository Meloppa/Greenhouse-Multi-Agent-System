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

