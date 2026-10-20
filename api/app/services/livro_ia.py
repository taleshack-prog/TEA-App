"""Pergunte ao livro — Q&A dos pais/cuidadores sobre "Antifrágil Blindado".

Busca leve por palavras-chave nos capítulos (sem vetor/embeddings — são só 11
capítulos), monta os trechos mais relevantes e pede ao Claude uma resposta
ancorada SÓ no livro, citando o capítulo. Reaproveita ANTHROPIC_API_KEY/IA_MODEL.
"""
from __future__ import annotations

import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path

from app.config import settings

LIVRO_PATH = Path(__file__).resolve().parent.parent / "data" / "livro.json"
TOP_TRECHOS = 8
MAX_CONTEXTO = 6500  # caracteres de contexto enviados ao modelo

STOPWORDS = {
    "a", "o", "e", "de", "da", "do", "das", "dos", "um", "uma", "que", "com",
    "para", "por", "no", "na", "nos", "nas", "em", "se", "os", "as", "ao", "aos",
    "como", "qual", "quais", "quando", "onde", "quem", "meu", "minha", "seu",
    "sua", "ele", "ela", "isso", "este", "essa", "esse", "mais", "muito", "ser",
    "sobre", "pra", "pro", "the", "é", "ou", "tem", "foi", "sao", "são",
}

SISTEMA = (
    "Você é um assistente que responde dúvidas de pais e cuidadores com base "
    "EXCLUSIVAMENTE no livro 'Antifrágil Blindado: Guia para Famílias "
    "Neurodivergentes', de Tales Hack. Use apenas os trechos fornecidos. Se a "
    "resposta não estiver neles, diga com honestidade que o livro não trata "
    "disso diretamente e ofereça o ponto mais próximo que ele traz. Cite o "
    "capítulo de onde vem a ideia. Seja acolhedor, concreto e conciso. Não "
    "invente nada além do livro. Responda em português do Brasil."
)


def _sem_acento(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s)
                    if unicodedata.category(c) != "Mn").lower()


def _tokens(s: str) -> list[str]:
    return [t for t in re.findall(r"[a-z0-9]+", _sem_acento(s))
            if len(t) > 2 and t not in STOPWORDS]


def _passagens(texto: str, alvo: int = 700) -> list[str]:
    frases = re.findall(r"[^.!?…]+[.!?…]+|\S[^.!?…]*$", re.sub(r"\s+", " ", texto).strip())
    blocos, atual = [], ""
    for f in frases:
        if len(atual) + len(f) > alvo and atual:
            blocos.append(atual.strip())
            atual = f
        else:
            atual += " " + f
    if atual.strip():
        blocos.append(atual.strip())
    return blocos


@lru_cache(maxsize=1)
def _indice() -> list[dict]:
    """Lista de passagens com (capítulo, título, texto, tokens). Carregado 1x."""
    livro = json.loads(LIVRO_PATH.read_text(encoding="utf-8"))
    idx = []
    for cap in livro["capitulos"]:
        tit_tokens = set(_tokens(cap["titulo"]))
        for p in _passagens(cap["texto"]):
            idx.append({"cap": cap["titulo"], "texto": p,
                        "tokens": _tokens(p), "tit_tokens": tit_tokens})
    return idx


def _buscar(pergunta: str) -> list[dict]:
    q = _tokens(pergunta)
    if not q:
        return []
    qset = set(q)
    pontuados = []
    for p in _indice():
        tok = p["tokens"]
        if not tok:
            continue
        score = sum(tok.count(t) for t in qset)
        score += 2 * len(qset & p["tit_tokens"])  # peso extra se bate no título
        if score:
            pontuados.append((score, p))
    pontuados.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in pontuados[:TOP_TRECHOS]]


def perguntar(pergunta: str) -> dict:
    pergunta = (pergunta or "").strip()
    if len(pergunta) < 3:
        return {"configurada": True, "resposta": "Escreva sua pergunta sobre o livro.",
                "capitulos": []}
    if not settings.ANTHROPIC_API_KEY:
        return {"configurada": False, "capitulos": [],
                "resposta": "A ajuda da IA ainda não está ativada (falta a chave "
                            "ANTHROPIC_API_KEY no servidor)."}

    trechos = _buscar(pergunta)
    if not trechos:
        return {"configurada": True, "capitulos": [],
                "resposta": "Não encontrei no livro algo diretamente ligado a essa "
                            "pergunta. Tente reformular com outras palavras."}

    contexto, usados, total = [], [], 0
    for t in trechos:
        if total + len(t["texto"]) > MAX_CONTEXTO:
            break
        contexto.append(f"[{t['cap']}]\n{t['texto']}")
        total += len(t["texto"])
        if t["cap"] not in usados:
            usados.append(t["cap"])

    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        prompt = (
            f"Pergunta do cuidador: {pergunta}\n\n"
            "Trechos do livro (cada um marcado com o capítulo):\n\n"
            + "\n\n---\n\n".join(contexto)
            + "\n\nResponda com base apenas nesses trechos, citando o capítulo."
        )
        msg = client.messages.create(
            model=settings.IA_MODEL, max_tokens=800, system=SISTEMA,
            messages=[{"role": "user", "content": prompt}],
        )
        resposta = "".join(b.text for b in msg.content
                           if getattr(b, "type", "") == "text").strip()
        return {"configurada": True, "resposta": resposta, "capitulos": usados}
    except Exception as e:  # noqa: BLE001
        return {"configurada": True, "capitulos": [],
                "resposta": "Não consegui responder agora.", "erro": str(e)[:300]}
