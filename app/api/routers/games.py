from datetime import date
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

from pricechart.models import Game, GamePriceSnapshot
from app.api.deps import get_db
from app.api.schemas import GameOut, GamesPage, SnapshotOut

router = APIRouter(prefix="/games", tags=["games"])


@router.get("", response_model=GamesPage)
def list_games(
    console: Optional[str] = Query(default=None, description="Exact console_name match"),
    q: Optional[str] = Query(default=None, description="Search in product_name (case-insensitive)"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    filters = []

    if console:
        filters.append(Game.console_name == console)

    if q:
        filters.append(Game.product_name.ilike(f"%{q.strip()}%"))

    where_clause = and_(*filters) if filters else None

    # Total count
    count_stmt = select(func.count()).select_from(Game)
    if where_clause is not None:
        count_stmt = count_stmt.where(where_clause)
    total = db.execute(count_stmt).scalar_one()

    # Page query
    stmt = select(Game).order_by(Game.product_name.asc())
    if where_clause is not None:
        stmt = stmt.where(where_clause)

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    items = db.execute(stmt).scalars().all()

    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "items": items,
    }

@router.get("/by-name", response_model=List[GameOut])
def get_games_by_product_name(
    product_name: str = Query(..., min_length=1, description="Exact product name match (case-insensitive)"),
    console: Optional[str] = Query(default=None, description="Exact console_name match (optional)"),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    # Case-insensitive exact match
    filters = [func.lower(Game.product_name) == product_name.strip().lower()]

    if console:
        filters.append(Game.console_name == console)

    stmt = (
        select(Game)
        .where(and_(*filters))
        .order_by(Game.console_name.asc(), Game.id.asc())
        .limit(limit)
    )

    items = db.execute(stmt).scalars().all()
    return items

@router.get("/{game_id}", response_model=GameOut)
def get_game(game_id: int, db: Session = Depends(get_db)):
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game

@router.get("/{game_id}/snapshots", response_model=List[SnapshotOut])
def get_game_snapshots(
    game_id: int,
    from_date: Optional[date] = Query(default=None),
    to_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
):
    # Ensure game exists (nice UX)
    if not db.get(Game, game_id):
        raise HTTPException(status_code=404, detail="Game not found")

    filters = [GamePriceSnapshot.game_id == game_id]
    if from_date:
        filters.append(GamePriceSnapshot.snapshot_date >= from_date)
    if to_date:
        filters.append(GamePriceSnapshot.snapshot_date <= to_date)

    stmt = (
        select(GamePriceSnapshot)
        .where(and_(*filters))
        .order_by(GamePriceSnapshot.snapshot_date.asc())
    )

    rows = db.execute(stmt).scalars().all()

    # Convert Decimal(Numeric) to float for JSON
    out = []
    for r in rows:
        out.append({
            "snapshot_date": r.snapshot_date,
            "loose_price": float(r.loose_price) if r.loose_price is not None else None,
            "cib_price": float(r.cib_price) if r.cib_price is not None else None,
            "new_price": float(r.new_price) if r.new_price is not None else None,
            "graded_price": float(r.graded_price) if r.graded_price is not None else None,
            "box_only_price": float(r.box_only_price) if r.box_only_price is not None else None,
            "manual_only_price": float(r.manual_only_price) if r.manual_only_price is not None else None,
            "sales_volume": r.sales_volume,
        })

    return out
