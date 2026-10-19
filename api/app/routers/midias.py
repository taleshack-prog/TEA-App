"""Mídia do diário. Na Fase 0 registra a referência (url do storage).

O upload binário para o S3 é feito pelo app (URL pré-assinada) quando o
storage estiver configurado; aqui persistimos apenas os metadados + url.
"""
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.diario import Midia
from app.models.enums import MidiaTipo
from app.models.perfil import Perfil
from app.schemas import MidiaOut
from app.security import get_perfil_atual

router = APIRouter(prefix="/midias", tags=["midias"])


class MidiaIn(BaseModel):
    tipo: MidiaTipo
    url_storage: str
    id_checkin: Optional[int] = None
    id_evento: Optional[int] = None
    duracao_segundos: Optional[int] = None
    transcricao: Optional[str] = None


@router.post("", response_model=MidiaOut, status_code=201)
def registrar(
    dados: MidiaIn,
    db: Session = Depends(get_db),
    perfil: Perfil = Depends(get_perfil_atual),
):
    m = Midia(**dados.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m
