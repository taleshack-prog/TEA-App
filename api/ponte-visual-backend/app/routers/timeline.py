"""Linha do tempo consolidada: check-ins + eventos + mídia em um eixo único."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.diario import Checkin, Evento, Midia
from app.models.perfil import Perfil
from app.security import get_perfil_atual

router = APIRouter(prefix="/timeline", tags=["timeline"])


def _janela(escopo: str, ref: datetime) -> tuple[datetime, datetime]:
    if escopo == "dia":
        inicio = ref.replace(hour=0, minute=0, second=0, microsecond=0)
        return inicio, inicio + timedelta(days=1)
    if escopo == "semana":
        inicio = (ref - timedelta(days=ref.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        return inicio, inicio + timedelta(days=7)
    inicio = ref.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    prox = (inicio + timedelta(days=32)).replace(day=1)
    return inicio, prox


@router.get("")
def consolidada(
    escopo: str = Query("dia", pattern="^(dia|semana|mes)$"),
    data: datetime | None = None,
    db: Session = Depends(get_db),
    perfil: Perfil = Depends(get_perfil_atual),
):
    ref = data or datetime.now(timezone.utc)
    inicio, fim = _janela(escopo, ref)

    checkins = db.execute(
        select(Checkin).where(Checkin.criado_em >= inicio, Checkin.criado_em < fim)
    ).scalars().all()
    eventos = db.execute(
        select(Evento).where(Evento.inicio >= inicio, Evento.inicio < fim)
    ).scalars().all()
    midias = db.execute(
        select(Midia).where(Midia.criado_em >= inicio, Midia.criado_em < fim)
    ).scalars().all()

    itens = []
    for c in checkins:
        itens.append({
            "tipo_item": "checkin",
            "id": c.id,
            "quando": (c.timestamp_preenchido or c.criado_em).isoformat(),
            "status": c.status.value,
            "humor": c.sinal.humor.value if c.sinal else None,
            "energia_1_5": c.sinal.energia_1_5 if c.sinal else None,
        })
    for e in eventos:
        itens.append({
            "tipo_item": "evento",
            "id": e.id,
            "quando": e.inicio.isoformat(),
            "evento": e.tipo.value,
            "intensidade_1_5": e.intensidade_1_5,
            "resultado": e.resultado.value if e.resultado else None,
        })
    for m in midias:
        itens.append({
            "tipo_item": "midia",
            "id": m.id,
            "quando": m.criado_em.isoformat(),
            "midia": m.tipo.value,
            "url": m.url_storage,
            "id_evento": m.id_evento,
            "id_checkin": m.id_checkin,
        })

    itens.sort(key=lambda x: x["quando"])
    return {
        "escopo": escopo,
        "inicio": inicio.isoformat(),
        "fim": fim.isoformat(),
        "itens": itens,
    }
