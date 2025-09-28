import os
import json

CONFIG_PATH = os.path.join(os.path.expanduser("~"), ".price_chart_speed.json")

DEFAULT_SETTINGS = {
    "data_path": r"C:\Users\kikat\Desktop\Database OTGPCE",
    "theme": "Dark",
    "autocomplete_max_suggestions": 8,
    "autocomplete_match_mode": "Substring",
    "default_condition": "Loose price",
    "currency_symbol": "$",
    "offer_percentage": 60,
}

SETTINGS = {}

def load_settings():
    global SETTINGS
    SETTINGS = DEFAULT_SETTINGS.copy()
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                loaded = json.load(f)
            SETTINGS.update({k: loaded.get(k, v) for k, v in DEFAULT_SETTINGS.items()})
    except Exception:
        pass

def save_settings():
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(SETTINGS, f, indent=2)
    except Exception:
        pass

# initialize on import (same as original did at top-level)
load_settings()
