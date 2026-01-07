from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, aliased
from sqlalchemy import select, func, and_, or_
from app.api.schemas import GamesWithLatestPage, GameWithLatestSnapshotOut  # add this
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
@router.get("/with-latest", response_model=GamesWithLatestPage)
def list_games_with_latest(
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

    # Total count (same as /games)
    count_stmt = select(func.count()).select_from(Game)
    if where_clause is not None:
        count_stmt = count_stmt.where(where_clause)
    total = db.execute(count_stmt).scalar_one()

    # Subquery: for each game_id, find max(snapshot_date)
    latest_date_sq = (
        select(
            GamePriceSnapshot.game_id.label("game_id"),
            func.max(GamePriceSnapshot.snapshot_date).label("max_date"),
        )
        .group_by(GamePriceSnapshot.game_id)
        .subquery()
    )

    # Alias snapshot table for join
    LatestSnap = aliased(GamePriceSnapshot)

    # Main query:
    # Game LEFT JOIN (latest_date_sq) LEFT JOIN LatestSnap on (game_id, snapshot_date=max_date)
    stmt = (
        select(Game, LatestSnap)
        .outerjoin(latest_date_sq, latest_date_sq.c.game_id == Game.id)
        .outerjoin(
            LatestSnap,
            and_(
                LatestSnap.game_id == Game.id,
                LatestSnap.snapshot_date == latest_date_sq.c.max_date,
            ),
        )
        .order_by(Game.product_name.asc())
    )

    if where_clause is not None:
        stmt = stmt.where(where_clause)

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    rows = db.execute(stmt).all()

    items = []
    for game, snap in rows:
        latest_snapshot = None
        if snap is not None:
            latest_snapshot = {
                "snapshot_date": snap.snapshot_date,
                "loose_price": float(snap.loose_price) if snap.loose_price is not None else None,
                "cib_price": float(snap.cib_price) if snap.cib_price is not None else None,
                "new_price": float(snap.new_price) if snap.new_price is not None else None,
                "graded_price": float(snap.graded_price) if snap.graded_price is not None else None,
                "box_only_price": float(snap.box_only_price) if snap.box_only_price is not None else None,
                "manual_only_price": float(snap.manual_only_price) if snap.manual_only_price is not None else None,
                "sales_volume": snap.sales_volume,
            }

        items.append({
            "id": game.id,
            "console_name": game.console_name,
            "product_name": game.product_name,
            "upc": game.upc,
            "genre": game.genre,
            "release_date": game.release_date,
            "latest_snapshot": latest_snapshot,
        })

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

@router.get("/{game_id}/latest-snapshot", response_model=SnapshotOut)
def get_latest_snapshot(game_id: int, db: Session = Depends(get_db)):
    # Ensure game exists (nice UX)
    if not db.get(Game, game_id):
        raise HTTPException(status_code=404, detail="Game not found")

    # Latest snapshot = max(snapshot_date)
    stmt = (
        select(GamePriceSnapshot)
        .where(GamePriceSnapshot.game_id == game_id)
        .order_by(GamePriceSnapshot.snapshot_date.desc())
        .limit(1)
    )

    snap = db.execute(stmt).scalars().first()
    if not snap:
        raise HTTPException(status_code=404, detail="No snapshots found for this game")

    return {
        "snapshot_date": snap.snapshot_date,
        "loose_price": float(snap.loose_price) if snap.loose_price is not None else None,
        "cib_price": float(snap.cib_price) if snap.cib_price is not None else None,
        "new_price": float(snap.new_price) if snap.new_price is not None else None,
        "graded_price": float(snap.graded_price) if snap.graded_price is not None else None,
        "box_only_price": float(snap.box_only_price) if snap.box_only_price is not None else None,
        "manual_only_price": float(snap.manual_only_price) if snap.manual_only_price is not None else None,
        "sales_volume": snap.sales_volume,
    }