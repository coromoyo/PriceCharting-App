from sqlalchemy import (
    Column, BigInteger, Integer, Text, Date, Numeric, ForeignKey, UniqueConstraint, Index
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
