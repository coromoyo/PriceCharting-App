from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.schemas import DashboardSummaryOut
from pricechart.models import InventoryItem, Quote, Sale, Task

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryOut)
def get_summary(db: Session = Depends(get_db)):
    active_quotes = db.execute(
        select(func.count()).select_from(Quote).where(
            Quote.status.in_(["draft", "in progress", "pending", "awaiting review"])
        )
    ).scalar_one()
    inventory_items = db.execute(select(func.count()).select_from(InventoryItem)).scalar_one()
    open_tasks = db.execute(
        select(func.count()).select_from(Task).where(Task.status.in_(["open", "in progress", "blocked"]))
    ).scalar_one()
    sales_count = db.execute(select(func.count()).select_from(Sale)).scalar_one()

    sales_revenue = db.execute(select(func.coalesce(func.sum(Sale.sold_price), 0))).scalar_one()
    sales_profit = db.execute(select(func.coalesce(func.sum(Sale.profit), 0))).scalar_one()
    refunds = db.execute(select(func.count()).select_from(Sale).where(Sale.status == "refunded")).scalar_one()

    return {
        "active_quotes": int(active_quotes),
        "inventory_items": int(inventory_items),
        "open_tasks": int(open_tasks),
        "sales_count": int(sales_count),
        "sales_revenue": float(sales_revenue or 0),
        "sales_profit": float(sales_profit or 0),
        "refunds": int(refunds),
    }
