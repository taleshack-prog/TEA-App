"""Gera os check-ins 'agendado' de um dia a partir da ConfigCheckins do perfil.

No piloto roda sob demanda (endpoint). Em produção vira um job Celery-beat
diário; as notificações locais do app (offline) é que de fato alertam os pais.
"""
from datetime import datetime, time, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.analise import ConfigCheckins
from app.models.diario import Checkin
from app.models.enums import CheckinStatus, CheckinTipo

_MAPA_DIAS = {0: "seg", 1: "ter", 2: "qua", 3: "qui", 4: "sex", 5: "sab", 6: "dom"}


def gerar_checkins_do_dia(db: Session, id_perfil: int, dia: datetime) -> list[Checkin]:
    cfg = db.execute(
        select(ConfigCheckins).where(
            ConfigCheckins.id_perfil == id_perfil,
            ConfigCheckins.ativo.is_(True),
        )
    ).scalars().first()
    if cfg is None:
        return []

    if cfg.dias and _MAPA_DIAS[dia.weekday()] not in cfg.dias:
        return []

    criados: list[Checkin] = []
    for hhmm in cfg.horarios:
        hora, minuto = (int(p) for p in hhmm.split(":"))
        agendado = datetime.combine(
            dia.date(), time(hora, minuto), tzinfo=timezone.utc
        )
        # Evita duplicar se já existe um agendado para aquele horário.
        existe = db.execute(
            select(Checkin).where(
                Checkin.id_perfil_anotador == id_perfil,
                Checkin.timestamp_agendado == agendado,
                Checkin.tipo == CheckinTipo.agendado,
            )
        ).scalars().first()
        if existe:
            continue
        ci = Checkin(
            id_perfil_anotador=id_perfil,
            timestamp_agendado=agendado,
            tipo=CheckinTipo.agendado,
            status=CheckinStatus.agendado,
        )
        db.add(ci)
        criados.append(ci)

    db.commit()
    for ci in criados:
        db.refresh(ci)
    return criados
