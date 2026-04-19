from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.schemas import PricingPresetCreate, PricingPresetOut, PricingPresetUpdate
from pricechart.models import PricingPreset

router = APIRouter(prefix="/pricing-presets", tags=["pricing-presets"])


def to_out(p: PricingPreset) -> PricingPresetOut:
    return PricingPresetOut(
        id=p.id,
        name=p.name,
        offer_pct=float(p.offer_pct),
        fees_pct=float(p.fees_pct),
        shipping_cost=float(p.shipping_cost),
        labor_cost=float(p.labor_cost),
        risk_buffer_pct=float(p.risk_buffer_pct),
        description=p.description,
        is_default=bool(p.is_default),
    )


@router.get("", response_model=list[PricingPresetOut])
def list_presets(db: Session = Depends(get_db)):
    rows = db.execute(select(PricingPreset).order_by(PricingPreset.name.asc())).scalars().all()
    return [to_out(p) for p in rows]


@router.get("/{preset_id}", response_model=PricingPresetOut)
def get_preset(preset_id: int, db: Session = Depends(get_db)):
    preset = db.get(PricingPreset, preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    return to_out(preset)


@router.post("", response_model=PricingPresetOut, status_code=201)
def create_preset(payload: PricingPresetCreate, db: Session = Depends(get_db)):
    if payload.is_default:
        for p in db.execute(select(PricingPreset)).scalars().all():
            p.is_default = False

    preset = PricingPreset(
        name=payload.name.strip(),
        offer_pct=payload.offer_pct,
        fees_pct=payload.fees_pct,
        shipping_cost=payload.shipping_cost,
        labor_cost=payload.labor_cost,
        risk_buffer_pct=payload.risk_buffer_pct,
        description=payload.description,
        is_default=payload.is_default,
    )
    db.add(preset)
    db.commit()
    db.refresh(preset)
    return to_out(preset)


@router.patch("/{preset_id}", response_model=PricingPresetOut)
def update_preset(preset_id: int, payload: PricingPresetUpdate, db: Session = Depends(get_db)):
    preset = db.get(PricingPreset, preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")

    data = payload.dict(exclude_unset=True)
    if data.get("is_default"):
        for p in db.execute(select(PricingPreset)).scalars().all():
            p.is_default = False

    for key, value in data.items():
        setattr(preset, key, value)

    db.commit()
    db.refresh(preset)
    return to_out(preset)
