"""Check-ins: submissão (<60s), listagem por período e geração de agendados."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.diario import Checkin, SinalCheckin
from app.models.enums import CheckinStatus, CheckinTipo
from app.models.perfil import Perfil
from app.schemas import CheckinCriar, CheckinOut
from app.security import get_perfil_atual
from app.services.scheduler import gerar_checkins_do_dia

router = APIRouter(prefix="/checkins", tags=["checkins"])


@router.post("", response_model=CheckinOut, status_code=201)
def submeter(
    dados: CheckinCriar,
    db: Session = Depends(get_db),
    perfil: Perfil = Depends(get_perfil_atual),
):
    agora = datetime.now(timezone.utc)

    if dados.id_checkin is not None:
        # Preenchimento de um check-in agendado existente.
        ci = db.get(Checkin, dados.id_checkin)
        if ci is None:
            raise HTTPException(404, "Check-in não encontrado.")
        if ci.sinal is not None:
            raise HTTPException(409, "Check-in já preenchido.")
        # Preenchido no prazo ou tardiamente (flag de defasagem).
        ci.status = (
            CheckinStatus.expirado_preenchido if ci.status == CheckinStatus.expirado
            else CheckinStatus.preenchido
        )
        ci.timestamp_preenchido = agora
    else:
        # Check-in livre (fora de horário agendado).
        ci = Checkin(
            id_perfil_anotador=perfil.id,
            tipo=dados.tipo,
            status=CheckinStatus.preenchido,
            timestamp_preenchido=agora,
        )
        db.add(ci)
        db.flush()

    s = dados.sinal
    ci.sinal = SinalCheckin(
        id_checkin=ci.id,
        humor=s.humor,
        energia_1_5=s.energia_1_5,
        horas_sono=s.horas_sono,
        qualidade_sono_1_5=s.qualidade_sono_1_5,
        alimentacao=s.alimentacao,
        medicacao=s.medicacao,
        medicacao_obs=s.medicacao_obs,
        observacao_livre=s.observacao_livre,
    )
    db.commit()
    db.refresh(ci)
    return ci


@router.get("", response_model=list[CheckinOut])
def listar(
    inicio: datetime = Query(...),
    fim: datetime = Query(...),
    db: Session = Depends(get_db),
    perfil: Perfil = Depends(get_perfil_atual),
):
    stmt = (
        select(Checkin)
        .where(Checkin.criado_em >= inicio, Checkin.criado_em <= fim)
        .order_by(Checkin.criado_em)
    )
    return db.execute(stmt).scalars().all()


@router.post("/gerar-dia", response_model=list[CheckinOut])
def gerar_dia(
    dia: datetime | None = None,
    db: Session = Depends(get_db),
    perfil: Perfil = Depends(get_perfil_atual),
):
    """Cria os check-ins agendados do dia conforme a config do perfil."""
    alvo = dia or datetime.now(timezone.utc)
    return gerar_checkins_do_dia(db, perfil.id, alvo)
