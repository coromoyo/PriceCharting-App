from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.schemas import InventoryItemCreate, InventoryItemOut, InventoryItemUpdate, InventoryPage
from pricechart.models import InventoryItem

router = APIRouter(prefix="/inventory", tags=["inventory"])


def _next_inventory_code(db: Session) -> str:
    max_id = db.execute(select(func.max(InventoryItem.id))).scalar() or 0
    return f"INV-{2200 + int(max_id) + 1}"


@router.get("", response_model=InventoryPage)
def list_inventory(
    q: str | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    filters = []
    if q:
        qq = f"%{q.strip()}%"
        filters.append(or_(InventoryItem.title.ilike(qq), InventoryItem.inventory_code.ilike(qq)))
    if status:
        filters.append(InventoryItem.status == status)
    where_clause = and_(*filters) if filters else None

    count_stmt = select(func.count()).select_from(InventoryItem)
    if where_clause is not None:
        count_stmt = count_stmt.where(where_clause)
    total = db.execute(count_stmt).scalar_one()

    stmt = select(InventoryItem).order_by(InventoryItem.acquired_date.desc(), InventoryItem.id.desc())
    if where_clause is not None:
        stmt = stmt.where(where_clause)
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    rows = db.execute(stmt).scalars().all()

    return {"page": page, "page_size": page_size, "total": total, "items": rows}


@router.get("/{inventory_id}", response_model=InventoryItemOut)
def get_inventory_item(inventory_id: int, db: Session = Depends(get_db)):
    row = db.get(InventoryItem, inventory_id)
    if not row:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return row


@router.post("", response_model=InventoryItemOut, status_code=201)
def create_inventory_item(payload: InventoryItemCreate, db: Session = Depends(get_db)):
    row = InventoryItem(
        inventory_code=payload.inventory_code.strip() if payload.inventory_code else _next_inventory_code(db),
        game_id=payload.game_id,
        title=payload.title,
        platform=payload.platform,
        condition=payload.condition.value,
        status=payload.status.value,
        cost=payload.cost,
        market_price=payload.market_price,
        location=payload.location,
        source_quote_code=payload.source_quote_code,
        acquired_date=payload.acquired_date or date.today(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{inventory_id}", response_model=InventoryItemOut)
def update_inventory_item(inventory_id: int, payload: InventoryItemUpdate, db: Session = Depends(get_db)):
    row = db.get(InventoryItem, inventory_id)
    if not row:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    data = payload.dict(exclude_unset=True)
    if "condition" in data and data["condition"] is not None:
        data["condition"] = data["condition"].value
    if "status" in data and data["status"] is not None:
        data["status"] = data["status"].value
    for key, value in data.items():
        setattr(row, key, value)

    db.commit()
    db.refresh(row)
    return row
