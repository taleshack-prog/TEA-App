"""Nível 0 do pipeline de IA — estatística descritiva pura (sem LLM, sem treino).

Disponível desde o primeiro dia. Guardrail anti-apofenia: um padrão/leitura só
é afirmado com volume mínimo; abaixo disso, devolve 'dados insuficientes'.
"""
from collections import Counter
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.diario import Checkin, SinalCheckin, Evento
from app.models.enums import CheckinStatus

MIN_OCORRENCIAS = 5  # TDD §8: padrão só reportado com ≥5 ocorrências


def _media(valores):
    valores = [v for v in valores if v is not None]
    return round(sum(valores) / len(valores), 2) if valores else None


def descritiva(db: Session, inicio: datetime, fim: datetime) -> dict:
    """Frequências de humor, médias de energia/sono e contagem de eventos."""
    preenchidos = (CheckinStatus.preenchido, CheckinStatus.expirado_preenchido)

    sinais = db.execute(
        select(SinalCheckin)
        .join(Checkin, SinalCheckin.id_checkin == Checkin.id)
        .where(
            Checkin.status.in_(preenchidos),
            Checkin.criado_em >= inicio,
            Checkin.criado_em <= fim,
        )
    ).scalars().all()

    eventos = db.execute(
        select(Evento).where(Evento.inicio >= inicio, Evento.inicio <= fim)
    ).scalars().all()

    n = len(sinais)
    humor_freq = Counter(s.humor.value for s in sinais)
    eventos_por_tipo = Counter(e.tipo.value for e in eventos)

    suficiente = n >= MIN_OCORRENCIAS

    return {
        "periodo": {"inicio": inicio.isoformat(), "fim": fim.isoformat()},
        "n_checkins_preenchidos": n,
        "dados_suficientes": suficiente,
        "aviso": None if suficiente else (
            f"Dados insuficientes para afirmar padrões "
            f"(mínimo {MIN_OCORRENCIAS} check-ins; há {n})."
        ),
        "humor": {
            "frequencias": dict(humor_freq),
            "predominante": humor_freq.most_common(1)[0][0] if humor_freq else None,
        },
        "energia_media_1_5": _media([s.energia_1_5 for s in sinais]),
        "sono": {
            "horas_media": _media([s.horas_sono for s in sinais]),
            "qualidade_media_1_5": _media([s.qualidade_sono_1_5 for s in sinais]),
        },
        "eventos": {
            "total": len(eventos),
            "por_tipo": dict(eventos_por_tipo),
            "intensidade_media_1_5": _media([e.intensidade_1_5 for e in eventos]),
        },
    }
