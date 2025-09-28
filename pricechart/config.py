import os
import json

CONFIG_PATH = os.path.join(os.path.expanduser("~"), ".price_chart_speed.json")

DEFAULT_SETTINGS = {
    # Paths (downloader + GUI share this)
    "data_path": os.path.expanduser("~/pricechart/data"),       # where .xlsx files are stored
    "uids_excel": os.path.expanduser("~/pricechart/uids.xlsx"), # spreadsheet with console + UID list

    # GUI defaults
    "theme": "Dark",
    "autocomplete_max_suggestions": 8,
    "autocomplete_match_mode": "Substring",
    "default_condition": "Loose price",
    "currency_symbol": "$",
    "offer_percentage": 60,
}

SETTINGS = {}

def load_settings():
    """Load settings from CONFIG_PATH or create one with defaults."""
    global SETTINGS
    SETTINGS = DEFAULT_SETTINGS.copy()
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                loaded = json.load(f)
            SETTINGS.update({k: loaded.get(k, v) for k, v in DEFAULT_SETTINGS.items()})
        else:
            # If no config exists, create one with defaults
            save_settings()
    except Exception as e:
        print(f"⚠️ Could not load settings, using defaults. Error: {e}")

def save_settings():
    """Persist current SETTINGS to disk."""
    try:
        os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(SETTINGS, f, indent=2)
    except Exception as e:
        print(f"⚠️ Could not save settings. Error: {e}")

# Initialize immediately
load_settings()
