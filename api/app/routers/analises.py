"""Análise da IA — estatística (N0), leitura narrativa (N3) e análise multimodal
de uma mídia ou texto. Acesso restrito aos pais (RBAC)."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.galeria import MidiaArquivo
from app.models.perfil import Perfil
from app.security import exigir_pai
from app.services.estatistica import descritiva
from app.services.ia import gerar_leitura
from app.services.midia_ia import analisar_midia, analisar_texto

router = APIRouter(prefix="/analises", tags=["analises"])


@router.get("/descritiva")
def analise_descritiva(
    inicio: datetime | None = Query(None),
    fim: datetime | None = Query(None),
    db: Session = Depends(get_db),
    _pai: Perfil = Depends(exigir_pai),
):
    """Nível 0: frequências e médias. Disponível desde o primeiro dia."""
    fim = fim or datetime.now(timezone.utc)
    inicio = inicio or (fim - timedelta(days=7))
    return descritiva(db, inicio, fim)


@router.get("/narrativa")
def analise_narrativa(
    inicio: datetime | None = Query(None),
    fim: datetime | None = Query(None),
    db: Session = Depends(get_db),
    _pai: Perfil = Depends(exigir_pai),
):
    """Nível 3: leitura interpretativa da IA, em linguagem de hipótese."""
    fim = fim or datetime.now(timezone.utc)
    inicio = inicio or (fim - timedelta(days=7))
    return gerar_leitura(db, inicio, fim)


@router.post("/midia/{mid}")
def analise_midia(
    mid: int,
    db: Session = Depends(get_db),
    _pai: Perfil = Depends(exigir_pai),
):
    """Leitura por hipótese de UMA mídia (foto, áudio ou vídeo) que a criança
    produziu/compartilhou. Transcreve áudio quando houver (Google STT)."""
    m = db.get(MidiaArquivo, mid)
    if m is None:
        raise HTTPException(404, "Mídia não encontrada.")
    return analisar_midia(db, m)


class TextoIn(BaseModel):
    texto: str


@router.post("/texto")
def analise_texto(
    corpo: TextoIn,
    db: Session = Depends(get_db),
    _pai: Perfil = Depends(exigir_pai),
):
    """Leitura por hipótese de um texto escrito (um recado, uma observação)."""
    return analisar_texto(db, corpo.texto)
