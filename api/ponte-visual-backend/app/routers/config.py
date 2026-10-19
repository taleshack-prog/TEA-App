"""Configuração de horários/janela dos check-ins (alarmes)."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.analise import ConfigCheckins
from app.models.perfil import Perfil
from app.schemas import ConfigCheckinsIn, ConfigCheckinsOut
from app.security import get_perfil_atual

router = APIRouter(prefix="/config/checkins", tags=["config"])


@router.get("", response_model=ConfigCheckinsOut | None)
def obter(
    db: Session = Depends(get_db), perfil: Perfil = Depends(get_perfil_atual)
):
    return db.execute(
        select(ConfigCheckins).where(ConfigCheckins.id_perfil == perfil.id)
    ).scalars().first()


@router.put("", response_model=ConfigCheckinsOut)
def definir(
    dados: ConfigCheckinsIn,
    db: Session = Depends(get_db),
    perfil: Perfil = Depends(get_perfil_atual),
):
    cfg = db.execute(
        select(ConfigCheckins).where(ConfigCheckins.id_perfil == perfil.id)
    ).scalars().first()
    if cfg is None:
        cfg = ConfigCheckins(id_perfil=perfil.id)
        db.add(cfg)
    cfg.horarios = dados.horarios
    cfg.dias = dados.dias
    cfg.janela_expiracao_min = dados.janela_expiracao_min
    cfg.ativo = dados.ativo
    db.commit()
    db.refresh(cfg)
    return cfg
