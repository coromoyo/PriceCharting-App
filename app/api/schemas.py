from datetime import date
from typing import Optional, List

from pydantic import BaseModel


class GameOut(BaseModel):
    id: int
    console_name: str
    product_name: str
    upc: Optional[str] = None
    genre: Optional[str] = None
    release_date: Optional[date] = None

    class Config:
        orm_mode = True


class GamesPage(BaseModel):
    page: int
    page_size: int
    total: int
    items: List[GameOut]


class SnapshotOut(BaseModel):
    snapshot_date: date
    loose_price: Optional[float] = None
    cib_price: Optional[float] = None
    new_price: Optional[float] = None
    graded_price: Optional[float] = None
    box_only_price: Optional[float] = None
    manual_only_price: Optional[float] = None
    sales_volume: Optional[int] = None


class ConsoleOut(BaseModel):
    console_name: str
