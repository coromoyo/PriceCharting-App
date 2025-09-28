import os
import pandas as pd
from .config import SETTINGS

_DF_CACHE = {}
xlsx_files = []

def list_xlsx_files(directory):
    try:
        return [os.path.splitext(f)[0] for f in os.listdir(directory) if f.lower().endswith('.xlsx')]
    except FileNotFoundError:
        return []

def load_console_df(console_name):
    if not console_name:
        return None
    if console_name in _DF_CACHE:
        return _DF_CACHE[console_name]
    file_path = os.path.join(SETTINGS["data_path"], f"{console_name}.xlsx")
    if not os.path.exists(file_path):
        return None
    df = pd.read_excel(file_path)
    _DF_CACHE[console_name] = df
    return df

def load_games_for_console(console_name):
    if not console_name:
        return []
    df = load_console_df(console_name)
    if df is None or df.empty or df.shape[1] < 3:
        return []
    return df.iloc[:, 2].dropna().astype(str).tolist()

def refresh_xlsx_files():
    global xlsx_files
    xlsx_files = list_xlsx_files(SETTINGS["data_path"])

# populate once at import (matches original top-level call)
refresh_xlsx_files()
