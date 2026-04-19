from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.schemas import ReportsSummaryOut
from pricechart.models import Sale

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/summary", response_model=ReportsSummaryOut)
def summary(db: Session = Depends(get_db)):
    monthly_rows = db.execute(
        select(
            func.to_char(func.date_trunc("month", Sale.date), "YYYY-MM").label("month"),
            func.coalesce(func.sum(Sale.sold_price), 0).label("revenue"),
            func.coalesce(func.sum(Sale.profit), 0).label("profit"),
            func.count(Sale.id).label("items"),
        )
        .group_by(func.date_trunc("month", Sale.date))
        .order_by(func.date_trunc("month", Sale.date).asc())
    ).all()

    platform_rows = db.execute(
        select(
            func.coalesce(Sale.platform, "Unknown").label("platform"),
            func.coalesce(func.sum(Sale.sold_price), 0).label("revenue"),
            func.coalesce(func.sum(Sale.profit), 0).label("profit"),
            func.count(Sale.id).label("items"),
        )
        .group_by(func.coalesce(Sale.platform, "Unknown"))
        .order_by(func.coalesce(func.sum(Sale.profit), 0).desc())
    ).all()

    return {
        "monthly": [
            {"month": r.month, "revenue": float(r.revenue), "profit": float(r.profit), "items": int(r.items)}
            for r in monthly_rows
        ],
        "by_platform": [
            {"platform": r.platform, "revenue": float(r.revenue), "profit": float(r.profit), "items": int(r.items)}
            for r in platform_rows
        ],
    }
