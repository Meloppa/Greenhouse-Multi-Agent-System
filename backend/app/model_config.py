import os
from dotenv import load_dotenv

load_dotenv()

# Supported models in the system
MODEL_CHOICES = {
    "qwen3-vl-4b": {
        "name": "Qwen 3 VL 4B",
        "type": "VLM (Vision-Language Model)",
        "parameters": "4.2 Billion",
        "description": "Multi-modal model optimized for agricultural visual scans, leaf pest classification, and structural greenhouse diagrams.",
        "context_window": 32768,
        "is_vision_capable": True
    },
    "llama3.2-1b": {
        "name": "Llama 3.2 1B",
        "type": "LLM (Language Model)",
        "parameters": "1.2 Billion",
        "description": "Highly efficient compact text generator, suitable for real-time task checklist scheduling and chatbot responses.",
        "context_window": 131072,
        "is_vision_capable": False
    },
    "gemma3-1b": {
        "name": "Gemma 3 1B",
        "type": "LLM (Language Model)",
        "parameters": "1.1 Billion",
        "description": "Google's lightweight open model, delivering optimized reasoning for automated plant advice and soil humidity schedules.",
        "context_window": 8192,
        "is_vision_capable": False
    }
}

# Load chosen model from .env with fallback
DEFAULT_MODEL = os.getenv("SELECTED_MODEL", "qwen3-vl-4b")
if DEFAULT_MODEL not in MODEL_CHOICES:
    DEFAULT_MODEL = "qwen3-vl-4b"

# Active state tracking
_current_active_model = DEFAULT_MODEL

def get_active_model() -> str:
    global _current_active_model
    return _current_active_model

def set_active_model(model_name: str) -> bool:
    global _current_active_model
    if model_name in MODEL_CHOICES:
        _current_active_model = model_name
        return True
    return False

def get_active_model_details() -> dict:
    return MODEL_CHOICES[get_active_model()]

def get_all_models() -> dict:
    return MODEL_CHOICES
