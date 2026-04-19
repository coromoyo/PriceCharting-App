from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db
from app.api.schemas import (
    QuoteCreate,
    QuoteItemCreate,
    QuoteItemOut,
    QuoteItemUpdate,
    QuoteOut,
    QuotesPage,
    QuoteTotalsOut,
    QuoteUpdate,
)
from pricechart.models import InventoryItem, PricingPreset, Quote, QuoteItem

router = APIRouter(prefix="/quotes", tags=["quotes"])


def _next_quote_code(db: Session) -> str:
    max_id = db.execute(select(func.max(Quote.id))).scalar() or 0
    return f"Q-{1000 + int(max_id) + 1}"


def _next_inventory_code(db: Session) -> str:
    max_id = db.execute(select(func.max(InventoryItem.id))).scalar() or 0
    return f"INV-{2200 + int(max_id) + 1}"


def _totals(quote: Quote) -> QuoteTotalsOut:
    preset = quote.preset
    offer_pct = float(preset.offer_pct) if preset else 60.0
    fees_pct = float(preset.fees_pct) if preset else 13.0
    shipping_cost = float(preset.shipping_cost) if preset else 0.0
    labor_cost = float(preset.labor_cost) if preset else 0.0
    risk_pct = float(preset.risk_buffer_pct) if preset else 0.0
    effective_offer_pct = (offer_pct * (1 - (risk_pct / 100.0))) / 100.0

    total_market = 0.0
    total_offer = 0.0
    total_profit = 0.0
    included_items = 0

    for item in quote.items:
        qty = max(1, item.qty or 1)
        market = float(item.market_price or 0)
        offer = float(item.manual_offer_price) if item.manual_offer_price is not None else (market * effective_offer_pct)
        fees = market * (fees_pct / 100.0)
        profit = market - offer - fees - shipping_cost - labor_cost
        if item.included:
            included_items += 1
            total_market += market * qty
            total_offer += offer * qty
            total_profit += profit * qty

    margin = (total_profit / total_market * 100.0) if total_market > 0 else 0.0
    return QuoteTotalsOut(
        total_items=len(quote.items),
        included_items=included_items,
        total_market=round(total_market, 2),
        total_offer=round(total_offer, 2),
        total_profit=round(total_profit, 2),
        total_margin_pct=round(margin, 2),
    )


@router.get("", response_model=QuotesPage)
def list_quotes(
    q: str | None = Query(default=None, description="Search in quote_code/seller/source"),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    filters = []
    if q:
        qq = f"%{q.strip()}%"
        filters.append(or_(Quote.quote_code.ilike(qq), Quote.seller_name.ilike(qq), Quote.source.ilike(qq)))
    if status:
        filters.append(Quote.status == status)
    where_clause = and_(*filters) if filters else None

    count_stmt = select(func.count()).select_from(Quote)
    if where_clause is not None:
        count_stmt = count_stmt.where(where_clause)
    total = db.execute(count_stmt).scalar_one()

    stmt = (
        select(Quote)
        .options(selectinload(Quote.items))
        .options(selectinload(Quote.preset))
        .order_by(Quote.created_date.desc(), Quote.id.desc())
    )
    if where_clause is not None:
        stmt = stmt.where(where_clause)
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    items = db.execute(stmt).scalars().all()
    return {"page": page, "page_size": page_size, "total": total, "items": items}


@router.get("/{quote_id}", response_model=QuoteOut)
def get_quote(quote_id: int, db: Session = Depends(get_db)):
    quote = db.execute(
        select(Quote)
        .options(selectinload(Quote.items))
        .options(selectinload(Quote.preset))
        .where(Quote.id == quote_id)
    ).scalars().first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


@router.post("", response_model=QuoteOut, status_code=201)
def create_quote(payload: QuoteCreate, db: Session = Depends(get_db)):
    today = date.today()
    quote = Quote(
        quote_code=(payload.quote_code.strip() if payload.quote_code else _next_quote_code(db)),
        seller_id=payload.seller_id,
        seller_name=payload.seller_name,
        source=payload.source,
        status=payload.status.value,
        notes=payload.notes,
        channel=payload.channel,
        created_date=today,
        updated_date=today,
        preset_id=payload.preset_id,
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote


@router.patch("/{quote_id}", response_model=QuoteOut)
def update_quote(quote_id: int, payload: QuoteUpdate, db: Session = Depends(get_db)):
    quote = db.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    data = payload.dict(exclude_unset=True)
    if "status" in data and data["status"] is not None:
        data["status"] = data["status"].value
    for key, value in data.items():
        setattr(quote, key, value)
    quote.updated_date = date.today()
    db.commit()
    db.refresh(quote)
    return quote


@router.get("/{quote_id}/items", response_model=list[QuoteItemOut])
def list_quote_items(quote_id: int, db: Session = Depends(get_db)):
    if not db.get(Quote, quote_id):
        raise HTTPException(status_code=404, detail="Quote not found")
    rows = db.execute(select(QuoteItem).where(QuoteItem.quote_id == quote_id).order_by(QuoteItem.id.asc())).scalars().all()
    return rows


@router.post("/{quote_id}/items", response_model=QuoteItemOut, status_code=201)
def create_quote_item(quote_id: int, payload: QuoteItemCreate, db: Session = Depends(get_db)):
    quote = db.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    item = QuoteItem(
        quote_id=quote_id,
        game_id=payload.game_id,
        title=payload.title,
        platform=payload.platform,
        condition=payload.condition.value,
        qty=payload.qty,
        market_price=payload.market_price,
        included=payload.included,
        manual_offer_price=payload.manual_offer_price,
        confidence=payload.confidence,
        issue=payload.issue,
    )
    quote.updated_date = date.today()
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{quote_id}/items/{item_id}", response_model=QuoteItemOut)
def update_quote_item(quote_id: int, item_id: int, payload: QuoteItemUpdate, db: Session = Depends(get_db)):
    if not db.get(Quote, quote_id):
        raise HTTPException(status_code=404, detail="Quote not found")

    item = db.get(QuoteItem, item_id)
    if not item or item.quote_id != quote_id:
        raise HTTPException(status_code=404, detail="Quote item not found")

    data = payload.dict(exclude_unset=True)
    if "condition" in data and data["condition"] is not None:
        data["condition"] = data["condition"].value
    for key, value in data.items():
        setattr(item, key, value)

    quote = db.get(Quote, quote_id)
    quote.updated_date = date.today()
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{quote_id}/items/{item_id}", status_code=204)
def delete_quote_item(quote_id: int, item_id: int, db: Session = Depends(get_db)):
    if not db.get(Quote, quote_id):
        raise HTTPException(status_code=404, detail="Quote not found")

    item = db.get(QuoteItem, item_id)
    if not item or item.quote_id != quote_id:
        raise HTTPException(status_code=404, detail="Quote item not found")

    db.delete(item)
    quote = db.get(Quote, quote_id)
    quote.updated_date = date.today()
    db.commit()
    return None


@router.post("/{quote_id}/recalculate", response_model=QuoteTotalsOut)
def recalculate_quote(quote_id: int, db: Session = Depends(get_db)):
    quote = db.execute(
        select(Quote)
        .options(selectinload(Quote.items))
        .options(selectinload(Quote.preset))
        .where(Quote.id == quote_id)
    ).scalars().first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return _totals(quote)


@router.post("/{quote_id}/convert-to-inventory")
def convert_quote_to_inventory(quote_id: int, db: Session = Depends(get_db)):
    quote = db.execute(
        select(Quote)
        .options(selectinload(Quote.items))
        .where(Quote.id == quote_id)
    ).scalars().first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    created = 0
    for item in quote.items:
        if not item.included:
            continue
        qty = max(item.qty or 1, 1)
        for _ in range(qty):
            inv = InventoryItem(
                inventory_code=_next_inventory_code(db),
                game_id=item.game_id,
                title=item.title,
                platform=item.platform,
                condition=item.condition,
                status="received",
                cost=float(item.manual_offer_price) if item.manual_offer_price is not None else float(item.market_price or 0),
                market_price=item.market_price,
                location="Intake",
                source_quote_code=quote.quote_code,
                acquired_date=date.today(),
            )
            db.add(inv)
            created += 1

    quote.status = "accepted"
    quote.updated_date = date.today()
    db.commit()
    return {"quote_id": quote_id, "created_inventory_items": created}
