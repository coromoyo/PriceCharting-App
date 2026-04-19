from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db
from app.api.schemas import (
    ImportJobCreate,
    ImportJobOut,
    ImportJobRowOut,
    ImportJobRowUpdate,
)
from pricechart.models import Game, GamePriceSnapshot, ImportJob, ImportJobRow, Quote, QuoteItem

router = APIRouter(prefix="/imports", tags=["imports"])


def _norm(s: str) -> str:
    return " ".join((s or "").lower().strip().split())


def _latest_market(db: Session, game_id: int) -> float | None:
    snap = db.execute(
        select(GamePriceSnapshot)
        .where(GamePriceSnapshot.game_id == game_id)
        .order_by(GamePriceSnapshot.snapshot_date.desc())
        .limit(1)
    ).scalars().first()
    if not snap:
        return None
    if snap.loose_price is not None:
        return float(snap.loose_price)
    for value in [snap.cib_price, snap.new_price, snap.graded_price, snap.box_only_price, snap.manual_only_price]:
        if value is not None:
            return float(value)
    return None


def _match_game(db: Session, raw: str):
    q = _norm(raw)
    if not q:
        return None, 0, "unmatched", "Empty row"

    terms = [w for w in q.split(" ") if len(w) > 2]
    query = select(Game).limit(60)
    if terms:
        ors = [Game.product_name.ilike(f"%{t}%") for t in terms[:3]]
        query = query.where(or_(*ors))
    else:
        query = query.where(Game.product_name.ilike(f"%{q[:20]}%"))

    candidates = db.execute(query).scalars().all()
    if not candidates:
        return None, 0, "unmatched", "No match found"

    best = None
    best_score = 0.0
    for game in candidates:
        title = _norm(game.product_name)
        if not title:
            continue
        hits = sum(1 for t in terms if t in title)
        score = (hits / len(terms)) if terms else (1.0 if q in title else 0.0)
        if score > best_score:
            best_score = score
            best = game

    confidence = int(round(best_score * 100))
    if confidence >= 90:
        status = "matched"
        issue = None
    elif confidence >= 55:
        status = "partial"
        issue = "Low confidence match"
    else:
        status = "unmatched"
        issue = "No confident match"

    return best, confidence, status, issue


def _recount(job: ImportJob):
    job.total_rows = len(job.rows)
    job.matched_rows = len([r for r in job.rows if r.status in ("matched", "partial")])
    job.unmatched_rows = len([r for r in job.rows if r.status == "unmatched"])


@router.get("/jobs", response_model=list[ImportJobOut])
def list_jobs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    stmt = (
        select(ImportJob)
        .options(selectinload(ImportJob.rows))
        .order_by(ImportJob.created_date.desc(), desc(ImportJob.id))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return db.execute(stmt).scalars().all()


@router.get("/jobs/{job_id}", response_model=ImportJobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.execute(select(ImportJob).options(selectinload(ImportJob.rows)).where(ImportJob.id == job_id)).scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")
    return job


@router.post("/jobs", response_model=ImportJobOut, status_code=201)
def create_job(payload: ImportJobCreate, db: Session = Depends(get_db)):
    today = date.today()
    lines = [line.strip() for line in payload.lines if line and line.strip()]
    preview = "\n".join(lines[:10]) if lines else None

    job = ImportJob(
        source_type=payload.source_type.value,
        status="review" if lines else "input",
        input_preview=preview,
        notes=payload.notes,
        created_date=today,
        updated_date=today,
        total_rows=0,
        matched_rows=0,
        unmatched_rows=0,
    )
    db.add(job)
    db.flush()

    for line in lines:
        game, confidence, row_status, issue = _match_game(db, line)
        row = ImportJobRow(
            job_id=job.id,
            original_text=line,
            matched_game_id=game.id if game else None,
            matched_title=game.product_name if game else None,
            platform=game.console_name if game else None,
            market_price=_latest_market(db, game.id) if game else None,
            confidence=confidence,
            status=row_status,
            issue=issue,
            selected=bool(game and row_status != "unmatched"),
        )
        db.add(row)

    db.flush()
    db.refresh(job)
    _recount(job)
    db.commit()
    db.refresh(job)
    return db.execute(select(ImportJob).options(selectinload(ImportJob.rows)).where(ImportJob.id == job.id)).scalars().first()


@router.patch("/jobs/{job_id}/rows/{row_id}", response_model=ImportJobRowOut)
def update_job_row(job_id: int, row_id: int, payload: ImportJobRowUpdate, db: Session = Depends(get_db)):
    job = db.execute(select(ImportJob).options(selectinload(ImportJob.rows)).where(ImportJob.id == job_id)).scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")

    row = db.get(ImportJobRow, row_id)
    if not row or row.job_id != job_id:
        raise HTTPException(status_code=404, detail="Import row not found")

    data = payload.dict(exclude_unset=True)
    if "status" in data and data["status"] is not None:
        data["status"] = data["status"].value
    for key, value in data.items():
        setattr(row, key, value)

    job.updated_date = date.today()
    _recount(job)
    db.commit()
    db.refresh(row)
    return row


@router.post("/jobs/{job_id}/commit-to-quote/{quote_id}")
def commit_job_to_quote(job_id: int, quote_id: int, db: Session = Depends(get_db)):
    job = db.execute(select(ImportJob).options(selectinload(ImportJob.rows)).where(ImportJob.id == job_id)).scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")

    quote = db.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    created = 0
    for row in job.rows:
        if not row.selected:
            continue
        if row.status == "unmatched":
            continue
        item = QuoteItem(
            quote_id=quote.id,
            game_id=row.matched_game_id,
            title=row.matched_title or row.original_text,
            platform=row.platform,
            condition="Loose",
            qty=1,
            market_price=row.market_price or 0,
            included=True,
            confidence=row.confidence,
            issue=row.issue,
        )
        db.add(item)
        created += 1

    quote.updated_date = date.today()
    job.status = "committed"
    job.updated_date = date.today()
    db.commit()
    return {"job_id": job_id, "quote_id": quote_id, "created_quote_items": created}
