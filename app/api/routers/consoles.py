from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from pricechart.models import Game
from app.api.deps import get_db
from app.api.schemas import ConsoleOut

router = APIRouter(prefix="/consoles", tags=["consoles"])


@router.get("", response_model=List[ConsoleOut])
def list_consoles(db: Session = Depends(get_db)):
    stmt = (
        select(Game.console_name)
        .distinct()
        .order_by(Game.console_name.asc())
    )
    rows = db.execute(stmt).all()
    return [{"console_name": r[0]} for r in rows]
