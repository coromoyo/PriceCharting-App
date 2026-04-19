from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.schemas import TaskCreate, TasksPage, TaskOut, TaskUpdate
from pricechart.models import Task

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=TasksPage)
def list_tasks(
    q: str | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=300),
    db: Session = Depends(get_db),
):
    filters = []
    if q:
        qq = f"%{q.strip()}%"
        filters.append(or_(Task.title.ilike(qq), Task.item_ref.ilike(qq)))
    if status:
        filters.append(Task.status == status)
    where_clause = and_(*filters) if filters else None

    count_stmt = select(func.count()).select_from(Task)
    if where_clause is not None:
        count_stmt = count_stmt.where(where_clause)
    total = db.execute(count_stmt).scalar_one()

    stmt = select(Task).order_by(Task.due_date.asc().nulls_last(), Task.id.desc())
    if where_clause is not None:
        stmt = stmt.where(where_clause)
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    rows = db.execute(stmt).scalars().all()
    return {"page": page, "page_size": page_size, "total": total, "items": rows}


@router.post("", response_model=TaskOut, status_code=201)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    row = Task(
        title=payload.title,
        item_ref=payload.item_ref,
        due_date=payload.due_date,
        priority=payload.priority.value,
        status=payload.status.value,
        notes=payload.notes,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    row = db.get(Task, task_id)
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")

    data = payload.dict(exclude_unset=True)
    if "priority" in data and data["priority"] is not None:
        data["priority"] = data["priority"].value
    if "status" in data and data["status"] is not None:
        data["status"] = data["status"].value
    for key, value in data.items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row
