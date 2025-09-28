import pandas as pd
from .config import SETTINGS
from .data_storing import load_console_df

def _norm(s: str) -> str:
    s = str(s).lower()
    return "".join(ch for ch in s if ch.isalnum())

_COND_KEYWORDS = {
    "looseprice": ["loose", "looseprice"],
    "cibprice": ["cib", "completeinbox", "completebox", "cibprice"],
    "newprice": ["new", "sealed", "newprice"],
    "gradedprice": ["graded", "gradedprice"],
    "boxonlyprice": ["boxonly", "boxonlyprice"],
    "manualonlyprice": ["manualonly", "manualonlyprice", "manual"],
}

def _keywords_for_condition(cond_text: str):
    n = _norm(cond_text)
    if "loose" in n: return _COND_KEYWORDS["looseprice"]
    if "cib" in n or "complete" in n: return _COND_KEYWORDS["cibprice"]
    if "new" in n or "sealed" in n: return _COND_KEYWORDS["newprice"]
    if "graded" in n: return _COND_KEYWORDS["gradedprice"]
    if "box" in n and "only" in n: return _COND_KEYWORDS["boxonlyprice"]
    if ("manual" in n and "only" in n) or n == "manual": return _COND_KEYWORDS["manualonlyprice"]
    return [n]

def _find_condition_column(df: pd.DataFrame, condition_text: str):
    cols = list(map(str, df.columns))
    norms = [_norm(c) for c in cols]
    target = _norm(condition_text)

    for i, cn in enumerate(norms):
        if cn == target: return i
    kws = _keywords_for_condition(condition_text)
    for i, cn in enumerate(norms):
        if any(kw in cn for kw in kws): return i
    for i, cn in enumerate(norms):
        if target and target in cn: return i
    return None

def _find_price(console_name: str, game_name: str, condition_text: str):
    df = load_console_df(console_name)
    if df is None or df.empty or df.shape[1] < 3: return None
    game_series = df.iloc[:, 2].astype(str)
    mask = game_series.str.casefold() == str(game_name).casefold()
    if not mask.any(): return None
    row = df[mask].iloc[0]
    col_idx = _find_condition_column(df, condition_text)
    if col_idx is None: return None
    val = row.iloc[col_idx]
    try:
        if pd.isna(val): return None
        if isinstance(val, str):
            v = val.replace(SETTINGS["currency_symbol"], "").replace("$", "").replace(",", "").strip()
            return float(v) if v else None
        return float(val)
    except Exception:
        return val
