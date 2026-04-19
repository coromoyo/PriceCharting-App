from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.schemas import SellerCreate, SellerOut, SellersPage, SellerUpdate
from pricechart.models import Seller

router = APIRouter(prefix="/sellers", tags=["sellers"])


@router.get("", response_model=SellersPage)
def list_sellers(
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    filters = []
    if q:
        qq = f"%{q.strip()}%"
        filters.append(or_(Seller.name.ilike(qq), Seller.city.ilike(qq), Seller.source_type.ilike(qq)))
    where_clause = and_(*filters) if filters else None

    count_stmt = select(func.count()).select_from(Seller)
    if where_clause is not None:
        count_stmt = count_stmt.where(where_clause)
    total = db.execute(count_stmt).scalar_one()

    stmt = select(Seller).order_by(Seller.name.asc())
    if where_clause is not None:
        stmt = stmt.where(where_clause)
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    rows = db.execute(stmt).scalars().all()
    return {"page": page, "page_size": page_size, "total": total, "items": rows}


@router.get("/{seller_id}", response_model=SellerOut)
def get_seller(seller_id: int, db: Session = Depends(get_db)):
    seller = db.get(Seller, seller_id)
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    return seller


@router.post("", response_model=SellerOut, status_code=201)
def create_seller(payload: SellerCreate, db: Session = Depends(get_db)):
    seller = Seller(
        name=payload.name.strip(),
        source_type=payload.source_type,
        city=payload.city,
        notes=payload.notes,
    )
    db.add(seller)
    db.commit()
    db.refresh(seller)
    return seller


@router.patch("/{seller_id}", response_model=SellerOut)
def update_seller(seller_id: int, payload: SellerUpdate, db: Session = Depends(get_db)):
    seller = db.get(Seller, seller_id)
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(seller, k, v)
    db.commit()
    db.refresh(seller)
    return seller
