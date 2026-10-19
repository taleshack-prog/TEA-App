from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import leads, webhook, dashboard
from app.core.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tribut Med API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads.router,     prefix="/api/leads",     tags=["leads"])
app.include_router(webhook.router,   prefix="/api/webhook",   tags=["webhook"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

@app.get("/")
def root():
    return {"status": "ok", "service": "Tribut Med API"}
