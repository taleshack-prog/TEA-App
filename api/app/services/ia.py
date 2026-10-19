"""Leitura interpretativa da IA (Nível 3 do pipeline) — um modelo de linguagem
lê os registros do período (check-ins, eventos e descrições de fotos/obras) e
devolve uma leitura em LINGUAGEM DE HIPÓTESE, nunca diagnóstico, dizendo em que
registros cada hipótese se apoia e quando ainda faltam dados.

Precisa de ANTHROPIC_API_KEY no ambiente. Sem a chave, devolve um aviso claro
em vez de quebrar. O modelo é configurável por IA_MODEL."""
import json
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.diario import Checkin, SinalCheckin, Evento
from app.models.enums import CheckinStatus
from app.models.galeria import MidiaArquivo

MIN_REGISTROS = 3  # abaixo disso não vale pedir leitura

SISTEMA = (
    "Você ajuda os pais a entender a comunicação de uma criança autista não "
    "verbal, a partir de um diário de comportamento e de fotos/obras que ela "
    "produz e compartilha. Você NÃO faz diagnóstico. Fale sempre em linguagem "
    "de hipótese ('pode sugerir', 'talvez', 'uma leitura possível'), nunca "
    "afirme causas. Se os dados forem poucos, diga com honestidade que ainda "
    "não dá para apontar padrões. Seja acolhedor e concreto. Responda em "
    "português do Brasil. Responda APENAS com um JSON válido no formato: "
    '{"leitura": "texto curto e acolhedor (2-4 frases)", '
    '"hipoteses": [{"texto": "...", "confianca": 0.0, "apoia_se_em": "quais registros"}], '
    '"suficiente": true}. Sem texto fora do JSON.'
)


def _coletar(db: Session, inicio: datetime, fim: datetime) -> dict:
    preenchidos = (CheckinStatus.preenchido, CheckinStatus.expirado_preenchido)
    sinais = db.execute(
        select(SinalCheckin).join(Checkin, SinalCheckin.id_checkin == Checkin.id)
        .where(Checkin.status.in_(preenchidos),
               Checkin.criado_em >= inicio, Checkin.criado_em <= fim)
    ).scalars().all()
    eventos = db.execute(
        select(Evento).where(Evento.inicio >= inicio, Evento.inicio <= fim)
    ).scalars().all()
    midias = db.execute(
        select(MidiaArquivo).where(MidiaArquivo.criado_em >= inicio,
                                   MidiaArquivo.criado_em <= fim)
    ).scalars().all()

    checkins = [{
        "humor": s.humor.value, "energia_1_5": s.energia_1_5,
        "horas_sono": s.horas_sono, "qualidade_sono_1_5": s.qualidade_sono_1_5,
        "alimentacao": s.alimentacao.value if s.alimentacao else None,
        "observacao": s.observacao_livre,
    } for s in sinais]
    evs = [{
        "tipo": e.tipo.value, "intensidade_1_5": e.intensidade_1_5,
        "gatilho": e.gatilho_percebido, "intervencao": e.intervencao_tentada,
        "resultado": e.resultado.value if e.resultado else None,
    } for e in eventos]
    fotos = [{"tipo": m.tipo.value, "descricao": m.descricao}
             for m in midias if m.descricao]

    return {"checkins": checkins, "eventos": evs, "fotos_e_obras": fotos,
            "n_total": len(checkins) + len(evs) + len(fotos)}


def gerar_leitura(db: Session, inicio: datetime, fim: datetime) -> dict:
    dados = _coletar(db, inicio, fim)

    if dados["n_total"] < MIN_REGISTROS:
        return {"configurada": True, "suficiente": False,
                "leitura": "Ainda há poucos registros para a IA ler com honestidade. "
                           "Conforme você for anotando os check-ins e guardando fotos "
                           "com uma descrição, a leitura aparece aqui.",
                "hipoteses": []}

    if not settings.ANTHROPIC_API_KEY:
        return {"configurada": False, "suficiente": False, "hipoteses": [],
                "leitura": "A leitura da IA ainda não está ativada (falta a chave "
                           "ANTHROPIC_API_KEY no servidor)."}

    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        prompt = (
            "Aqui estão os registros do período (JSON). Leia com cuidado, cruzando "
            "humor, sono, eventos e o que as fotos/obras tentam dizer, e devolva o "
            "JSON pedido.\n\n" + json.dumps(dados, ensure_ascii=False, indent=2)
        )
        msg = client.messages.create(
            model=settings.IA_MODEL, max_tokens=1200, system=SISTEMA,
            messages=[{"role": "user", "content": prompt}],
        )
        texto = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
        texto = texto.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        parsed = json.loads(texto)
        parsed["configurada"] = True
        parsed.setdefault("suficiente", True)
        parsed.setdefault("hipoteses", [])
        return parsed
    except Exception as e:  # noqa: BLE001 — devolve o erro de forma amigável
        return {"configurada": True, "suficiente": False, "hipoteses": [],
                "leitura": "Não consegui gerar a leitura agora.",
                "erro": str(e)[:300]}
