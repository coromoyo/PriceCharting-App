from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers.consoles import router as consoles_router
from app.api.routers.games import router as games_router

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


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
