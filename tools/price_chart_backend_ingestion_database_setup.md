# PriceChart Backend – Data Ingestion & Database Setup

This repository contains the backend database schema and data ingestion pipeline for the **PriceChart** project. It is responsible for:

- Running a PostgreSQL database via Docker
- Ingesting PriceCharting XLSX data into the database
- Maintaining historical price snapshots per game
- Providing a clean foundation for API development

This README explains **requirements**, **project structure**, and **how to run and test the ingestion pipeline**.

---

## 1. Requirements

### System Requirements

- **Python 3.10+** (3.11 recommended)
- **Docker & Docker Compose**
- **PostgreSQL client or GUI** (recommended: DataGrip, DBeaver)

### Python Dependencies

Install dependencies inside a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate  # Linux / macOS
# .venv\\Scripts\\activate  # Windows

pip install -r requirements.txt
```

Key libraries used:

- `sqlalchemy`
- `psycopg2-binary`
- `pandas`
- `openpyxl`
- `python-dateutil`

---

## 2. Project Structure

```
pricechart/
│
├── pricechart/
│   ├── __init__.py
│   ├── config.py          # SETTINGS (data_path, DB config)
│   ├── db.py              # SQLAlchemy engine/session
│   ├── models.py          # ORM models
│   └── ...
│
├── tools/
│   └── ingest_to_db.py    # XLSX ingestion CLI
│
├── docker-compose.yml     # PostgreSQL service
├── requirements.txt
└── README.md
```

---

## 3. Database Setup (Docker)

Start PostgreSQL using Docker Compose:

```bash
docker compose up -d
```

This creates:

- A PostgreSQL 16 container
- A persistent Docker volume (`pricechart_pgdata`)
- A database named `pricechart`

### Connection Details

| Field | Value |
|------|------|
| Host | `localhost` |
| Port | `5432` |
| User | `pricechart` |
| Password | `pricechart` |
| Database | `pricechart` |

You can connect using **DataGrip**, **DBeaver**, or `psql`.

---

## 4. Configuration (`data_path`)

The ingestion script loads XLSX files from the directory defined in:

```python
# pricechart/config.py
SETTINGS = {
    "data_path": "/absolute/or/relative/path/to/xlsx/files"
}
```

All XLSX files referenced by the ingestion CLI **must exist in this directory**.

---

## 5. XLSX File Requirements

Each XLSX file must contain at least the following columns:

- `id`
- `console-name`
- `product-name`

Optional supported columns:

- `upc`
- `genre`
- `release-date`
- `loose-price`
- `cib-price`
- `new-price`
- `graded-price`
- `box-only-price`
- `manual-only-price`
- `sales-volume`

Notes:
- Prices may include `$` and commas
- Invalid or missing values are safely coerced to `NULL`
- Duplicate `(game_id, snapshot_date)` rows are upserted

---

## 6. Running the Ingestion Script

### Important: Run as a module

**Always run from the project root**:

```bash
python -m tools.ingest_to_db --console playstation3
```

Do **not** run the script directly via file path.

---

### Ingest a Single XLSX File

If your file is named `playstation3.xlsx` and lives in `data_path`:

```bash
python -m tools.ingest_to_db --console playstation3
```

### Ingest with a Fixed Snapshot Date

```bash
python -m tools.ingest_to_db --console playstation3 --date 2025-12-31
```

This ensures deterministic, repeatable ingestion.

---

### Ingest All XLSX Files in `data_path`

```bash
python -m tools.ingest_to_db
```

Every `.xlsx` file in the directory will be processed.

---

## 7. Database Schema Overview

### `games`

- One row per unique PriceCharting game
- Primary key: `id`
- Indexed by `console_name`, `product_name`, `upc`

### `game_price_snapshots`

- Time-series price data per game
- One row per `(game_id, snapshot_date)`
- Enforced by unique constraint `uq_game_day`
- Indexed for efficient historical queries

---

## 8. Verifying Ingestion (Recommended)

After running ingestion, verify via SQL:

```sql
SELECT COUNT(*) FROM games;
SELECT COUNT(*) FROM game_price_snapshots;
```

Check recent data:

```sql
SELECT g.product_name, s.snapshot_date, s.loose_price
FROM game_price_snapshots s
JOIN games g ON g.id = s.game_id
ORDER BY s.snapshot_date DESC
LIMIT 20;
```

---

## 9. Development Notes

- Ingestion uses **PostgreSQL upserts** (`ON CONFLICT DO UPDATE`)
- All price values are stored as `NUMERIC(10,2)`
- Dates are normalized to `DATE` (no timestamps)
- The ingestion script is safe to re-run for the same date

---

## 10. Next Steps

Typical backend roadmap:

1. Add Alembic migrations
2. Build API endpoints (e.g. FastAPI)
3. Add pagination & filtering
4. Add ingestion dry-run mode
5. Add automated tests

---

## 11. Troubleshooting

### `ModuleNotFoundError: pricechart`

Run using:

```bash
python -m tools.ingest_to_db
```

Do **not** run `python tools/ingest_to_db.py` directly.

---

### Port 5432 already in use

Either stop local Postgres or update `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"
```

Then connect on port `5433`.

---

## 12. License / Notes

This project is currently intended for **personal and educational use**. Production hardening (auth, rate limits, access control) should be added before public deployment.

