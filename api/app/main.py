"""Ponte Visual 2.0 — API (FastAPI).

Canal Comportamental (primário) + Canal de Arte (dormente) + Recepção.
Pipeline de IA Nível 0 (estatística) ativo; níveis superiores entram por volume.
"""
import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app import models  # noqa: F401  (registra as tabelas em Base.metadata)
from app.routers import (
    analises, arte, auth, checkins, config, eventos, livro, midias, timeline,
)

# --- Verificação de banco no boot (anti-SQLite-fantasma) ---------------
_url = settings.sqlalchemy_url
_em_producao = bool(os.getenv("RAILWAY_ENVIRONMENT"))  # setada pelo Railway
_backend = "PostgreSQL" if _url.startswith("postgresql") else "SQLite (dev)"

if _em_producao and _url.startswith("sqlite"):
    # Em produção NUNCA rodar no SQLite efêmero (perde dados a cada deploy).
    sys.exit(
        "ERRO FATAL: DATABASE_URL não definido em produção.\n"
        "Referencie o Postgres no serviço (Variables → DATABASE_URL = "
        "${{Postgres.DATABASE_URL}}) e aplique. O app não vai subir no "
        "SQLite efêmero para não perder dados."
    )

print(f"[Ponte Visual] Banco em uso: {_backend}", flush=True)

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

for r in (auth, checkins, eventos, midias, timeline, config, analises, arte, livro):
    app.include_router(r.router)


@app.get("/", tags=["saude"])
def raiz():
    return {"app": "Ponte Visual 2.0", "status": "ok", "banco": _backend, "docs": "/docs"}


@app.get("/saude", tags=["saude"])
def saude():
    return {"status": "healthy", "banco": _backend}
