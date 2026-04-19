from sqlalchemy import (
    Boolean,
    Column,
    BigInteger,
    Integer,
    Text,
    Date,
    Numeric,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import relationship
from .db import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(BigInteger, primary_key=True)  # PriceCharting id from CSV/XLSX
    console_name = Column(Text, nullable=False)
    product_name = Column(Text, nullable=False)
    upc = Column(Text, nullable=True)
    genre = Column(Text, nullable=True)
    release_date = Column(Date, nullable=True)

    snapshots = relationship("GamePriceSnapshot", back_populates="game", cascade="all, delete-orphan")

Index("ix_games_console", Game.console_name)
Index("ix_games_product_name", Game.product_name)
Index("ix_games_upc", Game.upc)


class GamePriceSnapshot(Base):
    __tablename__ = "game_price_snapshots"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    game_id = Column(BigInteger, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    snapshot_date = Column(Date, nullable=False)

    loose_price = Column(Numeric(10, 2), nullable=True)
    cib_price = Column(Numeric(10, 2), nullable=True)
    new_price = Column(Numeric(10, 2), nullable=True)
    graded_price = Column(Numeric(10, 2), nullable=True)
    box_only_price = Column(Numeric(10, 2), nullable=True)
    manual_only_price = Column(Numeric(10, 2), nullable=True)

    sales_volume = Column(Integer, nullable=True)

    game = relationship("Game", back_populates="snapshots")

    __table_args__ = (
        UniqueConstraint("game_id", "snapshot_date", name="uq_game_day"),
        Index("ix_snapshots_game_day", "game_id", "snapshot_date"),
    )


class Seller(Base):
    __tablename__ = "sellers"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    source_type = Column(Text, nullable=True)
    city = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)


Index("ix_sellers_name", Seller.name)


class PricingPreset(Base):
    __tablename__ = "pricing_presets"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)
    offer_pct = Column(Numeric(5, 2), nullable=False, default=60)
    fees_pct = Column(Numeric(5, 2), nullable=False, default=13)
    shipping_cost = Column(Numeric(10, 2), nullable=False, default=0)
    labor_cost = Column(Numeric(10, 2), nullable=False, default=0)
    risk_buffer_pct = Column(Numeric(5, 2), nullable=False, default=0)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, nullable=False, default=False)


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    quote_code = Column(Text, nullable=False, unique=True)
    seller_id = Column(BigInteger, ForeignKey("sellers.id"), nullable=True)
    seller_name = Column(Text, nullable=True)
    source = Column(Text, nullable=True)
    status = Column(Text, nullable=False, default="draft")
    notes = Column(Text, nullable=True)
    channel = Column(Text, nullable=True)
    created_date = Column(Date, nullable=False)
    updated_date = Column(Date, nullable=False)
    preset_id = Column(BigInteger, ForeignKey("pricing_presets.id"), nullable=True)

    seller = relationship("Seller")
    preset = relationship("PricingPreset")
    items = relationship("QuoteItem", back_populates="quote", cascade="all, delete-orphan")


Index("ix_quotes_status", Quote.status)
Index("ix_quotes_created_date", Quote.created_date)


class QuoteItem(Base):
    __tablename__ = "quote_items"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    quote_id = Column(BigInteger, ForeignKey("quotes.id", ondelete="CASCADE"), nullable=False)
    game_id = Column(BigInteger, ForeignKey("games.id"), nullable=True)
    title = Column(Text, nullable=False)
    platform = Column(Text, nullable=True)
    condition = Column(Text, nullable=False, default="Loose")
    qty = Column(Integer, nullable=False, default=1)
    market_price = Column(Numeric(10, 2), nullable=False, default=0)
    included = Column(Boolean, nullable=False, default=True)
    manual_offer_price = Column(Numeric(10, 2), nullable=True)
    confidence = Column(Integer, nullable=True)
    issue = Column(Text, nullable=True)

    quote = relationship("Quote", back_populates="items")
    game = relationship("Game")


Index("ix_quote_items_quote_id", QuoteItem.quote_id)


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    source_type = Column(Text, nullable=False, default="paste")
    status = Column(Text, nullable=False, default="input")
    input_preview = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_date = Column(Date, nullable=False)
    updated_date = Column(Date, nullable=False)
    total_rows = Column(Integer, nullable=False, default=0)
    matched_rows = Column(Integer, nullable=False, default=0)
    unmatched_rows = Column(Integer, nullable=False, default=0)

    rows = relationship("ImportJobRow", back_populates="job", cascade="all, delete-orphan")


class ImportJobRow(Base):
    __tablename__ = "import_job_rows"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    job_id = Column(BigInteger, ForeignKey("import_jobs.id", ondelete="CASCADE"), nullable=False)
    original_text = Column(Text, nullable=False)
    matched_game_id = Column(BigInteger, ForeignKey("games.id"), nullable=True)
    matched_title = Column(Text, nullable=True)
    platform = Column(Text, nullable=True)
    market_price = Column(Numeric(10, 2), nullable=True)
    confidence = Column(Integer, nullable=False, default=0)
    status = Column(Text, nullable=False, default="unmatched")
    issue = Column(Text, nullable=True)
    selected = Column(Boolean, nullable=False, default=True)

    job = relationship("ImportJob", back_populates="rows")
    game = relationship("Game")


Index("ix_import_job_rows_job_id", ImportJobRow.job_id)
Index("ix_import_job_rows_status", ImportJobRow.status)


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    inventory_code = Column(Text, nullable=False, unique=True)
    game_id = Column(BigInteger, ForeignKey("games.id"), nullable=True)
    title = Column(Text, nullable=False)
    platform = Column(Text, nullable=True)
    condition = Column(Text, nullable=False, default="Loose")
    status = Column(Text, nullable=False, default="received")
    cost = Column(Numeric(10, 2), nullable=False, default=0)
    market_price = Column(Numeric(10, 2), nullable=True)
    location = Column(Text, nullable=True)
    source_quote_code = Column(Text, nullable=True)
    acquired_date = Column(Date, nullable=False)

    game = relationship("Game")


Index("ix_inventory_status", InventoryItem.status)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(Text, nullable=False)
    item_ref = Column(Text, nullable=True)
    due_date = Column(Date, nullable=True)
    priority = Column(Text, nullable=False, default="medium")
    status = Column(Text, nullable=False, default="open")
    notes = Column(Text, nullable=True)


Index("ix_tasks_status", Task.status)
Index("ix_tasks_due_date", Task.due_date)


class Sale(Base):
    __tablename__ = "sales"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    sale_code = Column(Text, nullable=False, unique=True)
    inventory_item_id = Column(BigInteger, ForeignKey("inventory_items.id"), nullable=True)
    title = Column(Text, nullable=False)
    platform = Column(Text, nullable=True)
    condition = Column(Text, nullable=False, default="Loose")
    sold_price = Column(Numeric(10, 2), nullable=False)
    cost = Column(Numeric(10, 2), nullable=False, default=0)
    fees = Column(Numeric(10, 2), nullable=False, default=0)
    shipping = Column(Numeric(10, 2), nullable=False, default=0)
    profit = Column(Numeric(10, 2), nullable=False, default=0)
    margin = Column(Numeric(7, 2), nullable=False, default=0)
    date = Column(Date, nullable=False)
    channel = Column(Text, nullable=True)
    source_quote_code = Column(Text, nullable=True)
    status = Column(Text, nullable=False, default="sold")

    inventory_item = relationship("InventoryItem")


Index("ix_sales_date", Sale.date)
Index("ix_sales_status", Sale.status)
