from datetime import date
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel


class QuoteStatus(str, Enum):
    draft = "draft"
    in_progress = "in progress"
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    expired = "expired"
    awaiting_review = "awaiting review"


class ItemCondition(str, Enum):
    loose = "Loose"
    cib = "CIB"
    new = "New"
    console_only = "Console Only"
    box_only = "Box Only"
    manual_only = "Manual Only"


class InventoryStatus(str, Enum):
    received = "received"
    testing = "testing"
    cleaning = "cleaning"
    photos = "photos"
    ready_to_list = "ready to list"
    listed = "listed"


class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class TaskStatus(str, Enum):
    open = "open"
    in_progress = "in progress"
    done = "done"
    blocked = "blocked"


class SaleStatus(str, Enum):
    sold = "sold"
    refunded = "refunded"


class ImportRowStatus(str, Enum):
    matched = "matched"
    partial = "partial"
    unmatched = "unmatched"


class ImportSourceType(str, Enum):
    upload = "upload"
    paste = "paste"
    link = "link"


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

class GameWithLatestSnapshotOut(GameOut):
    latest_snapshot: Optional[SnapshotOut] = None

class GamesWithLatestPage(BaseModel):
    page: int
    page_size: int
    total: int
    items: List[GameWithLatestSnapshotOut]


class SellerOut(BaseModel):
    id: int
    name: str
    source_type: Optional[str] = None
    city: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        orm_mode = True


class SellerCreate(BaseModel):
    name: str
    source_type: Optional[str] = None
    city: Optional[str] = None
    notes: Optional[str] = None


class SellerUpdate(BaseModel):
    name: Optional[str] = None
    source_type: Optional[str] = None
    city: Optional[str] = None
    notes: Optional[str] = None


class SellersPage(BaseModel):
    page: int
    page_size: int
    total: int
    items: List[SellerOut]


class PricingPresetOut(BaseModel):
    id: int
    name: str
    offer_pct: float
    fees_pct: float
    shipping_cost: float
    labor_cost: float
    risk_buffer_pct: float
    description: Optional[str] = None
    is_default: bool

    class Config:
        orm_mode = True


class PricingPresetCreate(BaseModel):
    name: str
    offer_pct: float = 60
    fees_pct: float = 13
    shipping_cost: float = 0
    labor_cost: float = 0
    risk_buffer_pct: float = 0
    description: Optional[str] = None
    is_default: bool = False


class PricingPresetUpdate(BaseModel):
    name: Optional[str] = None
    offer_pct: Optional[float] = None
    fees_pct: Optional[float] = None
    shipping_cost: Optional[float] = None
    labor_cost: Optional[float] = None
    risk_buffer_pct: Optional[float] = None
    description: Optional[str] = None
    is_default: Optional[bool] = None


class QuoteItemOut(BaseModel):
    id: int
    quote_id: int
    game_id: Optional[int] = None
    title: str
    platform: Optional[str] = None
    condition: ItemCondition
    qty: int
    market_price: float
    included: bool
    manual_offer_price: Optional[float] = None
    confidence: Optional[int] = None
    issue: Optional[str] = None

    class Config:
        orm_mode = True


class QuoteItemCreate(BaseModel):
    game_id: Optional[int] = None
    title: str
    platform: Optional[str] = None
    condition: ItemCondition = ItemCondition.loose
    qty: int = 1
    market_price: float = 0
    included: bool = True
    manual_offer_price: Optional[float] = None
    confidence: Optional[int] = None
    issue: Optional[str] = None


class QuoteItemUpdate(BaseModel):
    game_id: Optional[int] = None
    title: Optional[str] = None
    platform: Optional[str] = None
    condition: Optional[ItemCondition] = None
    qty: Optional[int] = None
    market_price: Optional[float] = None
    included: Optional[bool] = None
    manual_offer_price: Optional[float] = None
    confidence: Optional[int] = None
    issue: Optional[str] = None


class QuoteOut(BaseModel):
    id: int
    quote_code: str
    seller_id: Optional[int] = None
    seller_name: Optional[str] = None
    source: Optional[str] = None
    status: QuoteStatus
    notes: Optional[str] = None
    channel: Optional[str] = None
    created_date: date
    updated_date: date
    preset_id: Optional[int] = None
    items: List[QuoteItemOut] = []

    class Config:
        orm_mode = True


class QuoteCreate(BaseModel):
    quote_code: Optional[str] = None
    seller_id: Optional[int] = None
    seller_name: Optional[str] = None
    source: Optional[str] = None
    status: QuoteStatus = QuoteStatus.draft
    notes: Optional[str] = None
    channel: Optional[str] = None
    preset_id: Optional[int] = None


class QuoteUpdate(BaseModel):
    seller_id: Optional[int] = None
    seller_name: Optional[str] = None
    source: Optional[str] = None
    status: Optional[QuoteStatus] = None
    notes: Optional[str] = None
    channel: Optional[str] = None
    preset_id: Optional[int] = None


class QuotesPage(BaseModel):
    page: int
    page_size: int
    total: int
    items: List[QuoteOut]


class QuoteTotalsOut(BaseModel):
    total_items: int
    included_items: int
    total_market: float
    total_offer: float
    total_profit: float
    total_margin_pct: float


class ImportJobRowOut(BaseModel):
    id: int
    job_id: int
    original_text: str
    matched_game_id: Optional[int] = None
    matched_title: Optional[str] = None
    platform: Optional[str] = None
    market_price: Optional[float] = None
    confidence: int
    status: ImportRowStatus
    issue: Optional[str] = None
    selected: bool

    class Config:
        orm_mode = True


class ImportJobOut(BaseModel):
    id: int
    source_type: ImportSourceType
    status: str
    input_preview: Optional[str] = None
    notes: Optional[str] = None
    created_date: date
    updated_date: date
    total_rows: int
    matched_rows: int
    unmatched_rows: int
    rows: List[ImportJobRowOut] = []

    class Config:
        orm_mode = True


class ImportJobCreate(BaseModel):
    source_type: ImportSourceType = ImportSourceType.paste
    lines: List[str] = []
    notes: Optional[str] = None


class ImportJobRowUpdate(BaseModel):
    matched_game_id: Optional[int] = None
    matched_title: Optional[str] = None
    platform: Optional[str] = None
    market_price: Optional[float] = None
    confidence: Optional[int] = None
    status: Optional[ImportRowStatus] = None
    issue: Optional[str] = None
    selected: Optional[bool] = None


class InventoryItemOut(BaseModel):
    id: int
    inventory_code: str
    game_id: Optional[int] = None
    title: str
    platform: Optional[str] = None
    condition: ItemCondition
    status: InventoryStatus
    cost: float
    market_price: Optional[float] = None
    location: Optional[str] = None
    source_quote_code: Optional[str] = None
    acquired_date: date

    class Config:
        orm_mode = True


class InventoryItemCreate(BaseModel):
    inventory_code: Optional[str] = None
    game_id: Optional[int] = None
    title: str
    platform: Optional[str] = None
    condition: ItemCondition = ItemCondition.loose
    status: InventoryStatus = InventoryStatus.received
    cost: float = 0
    market_price: Optional[float] = None
    location: Optional[str] = None
    source_quote_code: Optional[str] = None
    acquired_date: Optional[date] = None


class InventoryItemUpdate(BaseModel):
    game_id: Optional[int] = None
    title: Optional[str] = None
    platform: Optional[str] = None
    condition: Optional[ItemCondition] = None
    status: Optional[InventoryStatus] = None
    cost: Optional[float] = None
    market_price: Optional[float] = None
    location: Optional[str] = None
    source_quote_code: Optional[str] = None
    acquired_date: Optional[date] = None


class InventoryPage(BaseModel):
    page: int
    page_size: int
    total: int
    items: List[InventoryItemOut]


class TaskOut(BaseModel):
    id: int
    title: str
    item_ref: Optional[str] = None
    due_date: Optional[date] = None
    priority: TaskPriority
    status: TaskStatus
    notes: Optional[str] = None

    class Config:
        orm_mode = True


class TaskCreate(BaseModel):
    title: str
    item_ref: Optional[str] = None
    due_date: Optional[date] = None
    priority: TaskPriority = TaskPriority.medium
    status: TaskStatus = TaskStatus.open
    notes: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    item_ref: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    notes: Optional[str] = None


class TasksPage(BaseModel):
    page: int
    page_size: int
    total: int
    items: List[TaskOut]


class SaleOut(BaseModel):
    id: int
    sale_code: str
    inventory_item_id: Optional[int] = None
    title: str
    platform: Optional[str] = None
    condition: ItemCondition
    sold_price: float
    cost: float
    fees: float
    shipping: float
    profit: float
    margin: float
    date: date
    channel: Optional[str] = None
    source_quote_code: Optional[str] = None
    status: SaleStatus

    class Config:
        orm_mode = True


class SaleCreate(BaseModel):
    sale_code: Optional[str] = None
    inventory_item_id: Optional[int] = None
    title: str
    platform: Optional[str] = None
    condition: ItemCondition = ItemCondition.loose
    sold_price: float
    cost: float = 0
    fees: float = 0
    shipping: float = 0
    date: Optional[date] = None
    channel: Optional[str] = None
    source_quote_code: Optional[str] = None
    status: SaleStatus = SaleStatus.sold


class SaleUpdate(BaseModel):
    inventory_item_id: Optional[int] = None
    title: Optional[str] = None
    platform: Optional[str] = None
    condition: Optional[ItemCondition] = None
    sold_price: Optional[float] = None
    cost: Optional[float] = None
    fees: Optional[float] = None
    shipping: Optional[float] = None
    date: Optional[date] = None
    channel: Optional[str] = None
    source_quote_code: Optional[str] = None
    status: Optional[SaleStatus] = None


class SalesPage(BaseModel):
    page: int
    page_size: int
    total: int
    items: List[SaleOut]


class DashboardSummaryOut(BaseModel):
    active_quotes: int
    inventory_items: int
    open_tasks: int
    sales_count: int
    sales_revenue: float
    sales_profit: float
    refunds: int


class MonthlyReportRow(BaseModel):
    month: str
    revenue: float
    profit: float
    items: int


class PlatformProfitRow(BaseModel):
    platform: str
    revenue: float
    profit: float
    items: int


class ReportsSummaryOut(BaseModel):
    monthly: List[MonthlyReportRow]
    by_platform: List[PlatformProfitRow]
