"""Registro de eventos (crise, euforia, introspecção, alegria intensa)."""
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.diario import Evento
from app.models.perfil import Perfil
from app.schemas import EventoCriar, EventoOut
from app.security import get_perfil_atual

router = APIRouter(prefix="/eventos", tags=["eventos"])


@router.post("", response_model=EventoOut, status_code=201)
def registrar(
    dados: EventoCriar,
    db: Session = Depends(get_db),
    perfil: Perfil = Depends(get_perfil_atual),
):
    ev = Evento(id_perfil=perfil.id, **dados.model_dump())
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@router.get("", response_model=list[EventoOut])
def listar(
    inicio: datetime = Query(...),
    fim: datetime = Query(...),
    db: Session = Depends(get_db),
    perfil: Perfil = Depends(get_perfil_atual),
):
    stmt = (
        select(Evento)
        .where(Evento.inicio >= inicio, Evento.inicio <= fim)
        .order_by(Evento.inicio)
    )
    return db.execute(stmt).scalars().all()
