from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers.consoles import router as consoles_router
from app.api.routers.dashboard import router as dashboard_router
from app.api.routers.games import router as games_router
from app.api.routers.imports import router as imports_router
from app.api.routers.inventory import router as inventory_router
from app.api.routers.presets import router as presets_router
from app.api.routers.quotes import router as quotes_router
from app.api.routers.reports import router as reports_router
from app.api.routers.sales import router as sales_router
from app.api.routers.sellers import router as sellers_router
from app.api.routers.tasks import router as tasks_router
from pricechart.db import Base, engine

app = FastAPI(title="PriceChart API")

# React dev origins (add/remove as needed)
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(consoles_router)
app.include_router(games_router)
app.include_router(presets_router)
app.include_router(sellers_router)
app.include_router(quotes_router)
app.include_router(imports_router)
app.include_router(inventory_router)
app.include_router(tasks_router)
app.include_router(sales_router)
app.include_router(dashboard_router)
app.include_router(reports_router)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
