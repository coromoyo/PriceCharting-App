from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.schemas import SaleCreate, SalesPage, SaleOut, SaleUpdate
from pricechart.models import Sale

router = APIRouter(prefix="/sales", tags=["sales"])


def _next_sale_code(db: Session) -> str:
    max_id = db.execute(select(func.max(Sale.id))).scalar() or 0
    return f"S-{500 + int(max_id) + 1}"


def _profit_margin(sold: float, cost: float, fees: float, shipping: float):
    profit = sold - cost - fees - shipping
    margin = ((profit / sold) * 100.0) if sold > 0 else 0.0
    return round(profit, 2), round(margin, 2)


@router.get("", response_model=SalesPage)
def list_sales(
    q: str | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    filters = []
    if q:
        qq = f"%{q.strip()}%"
        filters.append(or_(Sale.title.ilike(qq), Sale.sale_code.ilike(qq)))
    if status:
        filters.append(Sale.status == status)
    where_clause = and_(*filters) if filters else None

    count_stmt = select(func.count()).select_from(Sale)
    if where_clause is not None:
        count_stmt = count_stmt.where(where_clause)
    total = db.execute(count_stmt).scalar_one()

    stmt = select(Sale).order_by(Sale.date.desc(), Sale.id.desc())
    if where_clause is not None:
        stmt = stmt.where(where_clause)
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    rows = db.execute(stmt).scalars().all()
    return {"page": page, "page_size": page_size, "total": total, "items": rows}


@router.get("/{sale_id}", response_model=SaleOut)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    row = db.get(Sale, sale_id)
    if not row:
        raise HTTPException(status_code=404, detail="Sale not found")
    return row


@router.post("", response_model=SaleOut, status_code=201)
def create_sale(payload: SaleCreate, db: Session = Depends(get_db)):
    profit, margin = _profit_margin(payload.sold_price, payload.cost, payload.fees, payload.shipping)
    row = Sale(
        sale_code=payload.sale_code.strip() if payload.sale_code else _next_sale_code(db),
        inventory_item_id=payload.inventory_item_id,
        title=payload.title,
        platform=payload.platform,
        condition=payload.condition.value,
        sold_price=payload.sold_price,
        cost=payload.cost,
        fees=payload.fees,
        shipping=payload.shipping,
        profit=profit,
        margin=margin,
        date=payload.date or date.today(),
        channel=payload.channel,
        source_quote_code=payload.source_quote_code,
        status=payload.status.value,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{sale_id}", response_model=SaleOut)
def update_sale(sale_id: int, payload: SaleUpdate, db: Session = Depends(get_db)):
    row = db.get(Sale, sale_id)
    if not row:
        raise HTTPException(status_code=404, detail="Sale not found")

    data = payload.dict(exclude_unset=True)
    if "condition" in data and data["condition"] is not None:
        data["condition"] = data["condition"].value
    if "status" in data and data["status"] is not None:
        data["status"] = data["status"].value
    for key, value in data.items():
        setattr(row, key, value)

    sold = float(row.sold_price)
    cost = float(row.cost)
    fees = float(row.fees)
    shipping = float(row.shipping)
    row.profit, row.margin = _profit_margin(sold, cost, fees, shipping)

    db.commit()
    db.refresh(row)
    return row
