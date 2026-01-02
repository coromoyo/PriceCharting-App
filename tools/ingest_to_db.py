import os
import argparse
from datetime import date
from decimal import Decimal, InvalidOperation

import pandas as pd
from sqlalchemy.dialects.postgresql import insert

from pricechart.config import SETTINGS
from pricechart.db import engine, SessionLocal
from pricechart.models import Game, GamePriceSnapshot
from pricechart.db import Base


def parse_int(v):
    if v is None or (isinstance(v, float) and pd.isna(v)) or (isinstance(v, str) and not v.strip()):
        return None
    try:
        return int(float(v))
    except Exception:
        return None

def parse_price(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    if isinstance(v, (int, float)):
        return Decimal(str(v)).quantize(Decimal("0.01"))
    s = str(v).strip()
    if not s:
        return None
    s = s.replace("$", "").replace(",", "")
    try:
        return Decimal(s).quantize(Decimal("0.01"))
    except InvalidOperation:
        return None

def parse_date(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    try:
        # pandas is good at this; coerce invalids to NaT then None
        dt = pd.to_datetime(v, errors="coerce")
        if pd.isna(dt):
            return None
        return dt.date()
    except Exception:
        return None


def ingest_xlsx(xlsx_path: str, snapshot_date: date):
    df = pd.read_excel(xlsx_path)

    # normalize headers: your file uses hyphens (console-name)
    required = ["id", "console-name", "product-name"]
    for col in required:
        if col not in df.columns:
            raise ValueError(
                f"Missing required column '{col}' in {xlsx_path}. Columns={list(df.columns)}"
            )

    # ---- CLEAN + VALIDATE REQUIRED FIELDS ----
    df["id"] = df["id"].apply(parse_int)

    df["console-name"] = df["console-name"].astype(str).str.strip()
    df["product-name"] = df["product-name"].astype(str).str.strip()

    # drop rows missing required values (match DB constraints)
    df = df.dropna(subset=["id", "console-name", "product-name"])
    df = df[
        (df["console-name"] != "") &
        (df["product-name"] != "")
    ]

    # guard against empty files (prevents DEFAULT VALUES insert)
    if df.empty:
        print(f"⚠️ Skipping {os.path.basename(xlsx_path)}: no valid rows after filtering")
        return 0, 0


    session = SessionLocal()
    try:
        # --- Upsert games ---
        game_rows = []
        for _, r in df.iterrows():
            game_rows.append({
                "id": int(r["id"]),
                "console_name": str(r.get("console-name", "")).strip(),
                "product_name": str(r.get("product-name", "")).strip(),
                "upc": (None if pd.isna(r.get("upc")) else str(r.get("upc")).strip()) if "upc" in df.columns else None,
                "genre": (None if pd.isna(r.get("genre")) else str(r.get("genre")).strip()) if "genre" in df.columns else None,
                "release_date": parse_date(r.get("release-date")) if "release-date" in df.columns else None,
            })
        if not game_rows:
            print(f"⚠️ Skipping {os.path.basename(xlsx_path)}: no games to insert")
            return 0, 0

        stmt_games = insert(Game).values(game_rows)
        stmt_games = stmt_games.on_conflict_do_update(
            index_elements=[Game.id],
            set_={
                "console_name": stmt_games.excluded.console_name,
                "product_name": stmt_games.excluded.product_name,
                "upc": stmt_games.excluded.upc,
                "genre": stmt_games.excluded.genre,
                "release_date": stmt_games.excluded.release_date,
            }
        )
        session.execute(stmt_games)

        # --- Upsert daily snapshots ---
        snap_rows = []
        for _, r in df.iterrows():
            game_id = int(r["id"])
            snap_rows.append({
                "game_id": game_id,
                "snapshot_date": snapshot_date,
                "loose_price": parse_price(r.get("loose-price")),
                "cib_price": parse_price(r.get("cib-price")),
                "new_price": parse_price(r.get("new-price")),
                "graded_price": parse_price(r.get("graded-price")),
                "box_only_price": parse_price(r.get("box-only-price")),
                "manual_only_price": parse_price(r.get("manual-only-price")),
                "sales_volume": parse_int(r.get("sales-volume")),
            })

        stmt_snaps = insert(GamePriceSnapshot).values(snap_rows)
        stmt_snaps = stmt_snaps.on_conflict_do_update(
            constraint="uq_game_day",
            set_={
                "loose_price": stmt_snaps.excluded.loose_price,
                "cib_price": stmt_snaps.excluded.cib_price,
                "new_price": stmt_snaps.excluded.new_price,
                "graded_price": stmt_snaps.excluded.graded_price,
                "box_only_price": stmt_snaps.excluded.box_only_price,
                "manual_only_price": stmt_snaps.excluded.manual_only_price,
                "sales_volume": stmt_snaps.excluded.sales_volume,
            }
        )
        session.execute(stmt_snaps)

        session.commit()
        return len(game_rows), len(snap_rows)
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--console", help="Console name (expects <data_path>/<console>.xlsx). If omitted, ingest all XLSX in data_path.")
    parser.add_argument("--date", help="Snapshot date YYYY-MM-DD (default: today).")
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)

    snapshot_date = date.today()
    if args.date:
        snapshot_date = pd.to_datetime(args.date).date()

    data_path = SETTINGS["data_path"]
    if args.console:
        xlsx_files = [os.path.join(data_path, f"{args.console}.xlsx")]
    else:
        xlsx_files = [
            os.path.join(data_path, f) for f in os.listdir(data_path)
            if f.lower().endswith(".xlsx")
        ]
    total_games = 0
    total_snaps = 0

    for path in xlsx_files:
        if not os.path.exists(path):
            print(f"⚠️ Missing file: {path}")
            continue
        print(f"→ Ingesting {os.path.basename(path)}")
        g, s = ingest_xlsx(path, snapshot_date)
        total_games += g
        total_snaps += s
        print(f"  ✓ games={g}, snapshots={s}")
    print(f"\nDone. Total games rows processed: {total_games}, total snapshots processed: {total_snaps}")



if __name__ == "__main__":
    main()
