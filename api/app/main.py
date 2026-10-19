"""Ponte Visual 2.0 — API (FastAPI).

Canal Comportamental (primário) + Canal de Arte (dormente) + Recepção.
Pipeline de IA Nível 0 (estatística) ativo; níveis superiores entram por volume.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app import models  # noqa: F401  (registra as tabelas em Base.metadata)
from app.routers import (
    analises, arte, auth, checkins, config, eventos, midias, timeline,
)

# Cria as tabelas se não existirem (piloto single-tenant; depois trocar por Alembic).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ponte Visual 2.0 — API",
    version="2.0.0",
    description="Diário comportamental estruturado + canal de arte dormente. "
                "Hack Tech Farm.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,  # definido por CORS_ORIGINS
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth, checkins, eventos, midias, timeline, config, analises, arte):
    app.include_router(r.router)


@app.get("/", tags=["saude"])
def raiz():
    return {"app": "Ponte Visual 2.0", "status": "ok", "docs": "/docs"}


@app.get("/saude", tags=["saude"])
def saude():
    return {"status": "healthy"}
