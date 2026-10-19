"""Análise da IA — Nível 0 (estatística). Acesso restrito aos pais (RBAC)."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.perfil import Perfil
from app.security import exigir_pai
from app.services.estatistica import descritiva

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
