import re
import pandas as pd  # used by drop_excel_letter_ranges

def sanitize_filename(name: str) -> str:
    # (verbatim from Csv_info_download.py)
    name = name.strip()
    name = re.sub(r'[\\/:*?"<>|]+', "_", name)
    name = re.sub(r"\s+", " ", name)
    return name

def drop_excel_letter_ranges(df: pd.DataFrame) -> pd.DataFrame:
    # (verbatim from Csv_info_download.py)
    cols_to_drop = []
    if df.shape[1] > 9:
        cols_to_drop += list(df.columns[9:22])
    if df.shape[1] > 23:
        cols_to_drop += list(df.columns[23:26])
    return df.drop(columns=cols_to_drop, errors="ignore")
