"""Análise multimodal da IA — "tradução" do que a criança expressa.

Aceita o que os pais entregarem e devolve uma leitura em LINGUAGEM DE HIPÓTESE
(nunca diagnóstico), por tipo de mídia:

  • foto   → Claude com visão sobre a imagem + a descrição + contexto do diário
  • vídeo  → ffmpeg extrai quadros (visão) e a faixa de áudio (transcrição STT)
  • áudio  → ffmpeg transcodifica/fatia e o Google Speech-to-Text transcreve;
             o Claude lê a transcrição
  • texto  → Claude lê o texto escrito

Dependências de ambiente (todas opcionais — sem elas, a função avisa com clareza
em vez de quebrar):
  ANTHROPIC_API_KEY        → leitura do Claude (texto e visão)
  GOOGLE_CREDENTIALS_JSON  → transcrição de áudio/vídeo (Speech-to-Text)
  ffmpeg no PATH           → áudio e vídeo (no Railway vem pelo nixpacks.toml)
"""
from __future__ import annotations

import base64
import glob
import json
import os
import shutil
import subprocess
import tempfile

from sqlalchemy.orm import Session

from app.config import settings
from app.models.galeria import MidiaArquivo

SEG_SEG = 55            # segundos por fatia de áudio (limite do STT síncrono = 60s)
MAX_FRAMES = 5          # quadros extraídos de um vídeo
LADO_MAX = 1568         # maior lado da imagem enviada ao Claude

SISTEMA = (
    "Você ajuda os pais a entender a comunicação de uma criança autista não "
    "verbal. Recebe algo que a criança produziu ou que o cuidador registrou "
    "(uma imagem, um vídeo, um áudio transcrito ou um texto) e uma descrição "
    "feita pelo cuidador. Sua tarefa é oferecer uma LEITURA POSSÍVEL do que "
    "aquilo pode estar comunicando. Você NÃO faz diagnóstico. Fale sempre em "
    "linguagem de hipótese ('pode sugerir', 'talvez', 'uma leitura possível'), "
    "nunca afirme causas nem estados internos como certos. Respeite a autoria da "
    "criança: é uma ponte, não leitura de mente. Seja acolhedor, concreto e "
    "breve. Responda em português do Brasil. Responda APENAS com um JSON válido: "
    '{"leitura": "2-4 frases acolhedoras", '
    '"hipoteses": [{"texto": "...", "confianca": 0.0, "apoia_se_em": "o que na mídia apoia isto"}], '
    '"suficiente": true}. Sem texto fora do JSON.'
)

# --------------------------------------------------------------------------- #
# utilidades
# --------------------------------------------------------------------------- #
def _tem_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None and shutil.which("ffprobe") is not None


def _aviso(msg: str, **extra) -> dict:
    base = {"configurada": True, "suficiente": False, "leitura": msg, "hipoteses": []}
    base.update(extra)
    return base


def _contexto_recente(db: Session) -> str:
    """Uma linha de contexto do diário para ancorar a leitura (melhor hipótese)."""
    try:
        from datetime import datetime, timedelta, timezone
        from app.services.estatistica import descritiva
        fim = datetime.now(timezone.utc)
        d = descritiva(db, fim - timedelta(days=7), fim)
        if not d.get("dados_suficientes"):
            return ""
        humor = (d.get("humor") or {}).get("predominante")
        n = d.get("n_checkins_preenchidos")
        partes = []
        if n:
            partes.append(f"{n} check-ins nos últimos 7 dias")
        if humor:
            partes.append(f"humor predominante: {humor}")
        ev = (d.get("eventos") or {}).get("total")
        if ev:
            partes.append(f"{ev} evento(s) marcante(s)")
        return "; ".join(partes)
    except Exception:
        return ""


def _parse_json_claude(texto: str) -> dict:
    t = texto.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    parsed = json.loads(t)
    parsed["configurada"] = True
    parsed.setdefault("suficiente", True)
    parsed.setdefault("hipoteses", [])
    return parsed


def _chamar_claude(content, model: str) -> dict:
    from anthropic import Anthropic
    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    msg = client.messages.create(
        model=model, max_tokens=1200, system=SISTEMA,
        messages=[{"role": "user", "content": content}],
    )
    texto = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
    return _parse_json_claude(texto)


# --------------------------------------------------------------------------- #
# ffmpeg: imagem, quadros, transcrição
# --------------------------------------------------------------------------- #
def _normalizar_imagem(dados: bytes, mime: str, tmp: str) -> tuple[str, bytes]:
    """Devolve (media_type, bytes) prontos para o Claude. Tenta converter para
    JPEG com ffmpeg (resolve HEIC/webp e reduz tamanho); se falhar, usa o original."""
    if _tem_ffmpeg():
        src = os.path.join(tmp, "in_img")
        out = os.path.join(tmp, "out.jpg")
        with open(src, "wb") as f:
            f.write(dados)
        try:
            subprocess.run(
                ["ffmpeg", "-y", "-i", src, "-vf",
                 f"scale='min({LADO_MAX},iw)':-2", "-frames:v", "1", out],
                check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
            with open(out, "rb") as f:
                return "image/jpeg", f.read()
        except Exception:
            pass
    return (mime if mime in ("image/jpeg", "image/png", "image/gif", "image/webp")
            else "image/jpeg"), dados


def _bloco_imagem(media_type: str, dados: bytes) -> dict:
    return {"type": "image", "source": {"type": "base64", "media_type": media_type,
            "data": base64.b64encode(dados).decode("ascii")}}


def _quadros_video(src: str, tmp: str) -> list[bytes]:
    """Extrai até MAX_FRAMES quadros espaçados ao longo do vídeo."""
    try:
        dur = float(subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", src],
            capture_output=True, text=True, check=True).stdout.strip())
    except Exception:
        dur = 0.0
    n = MAX_FRAMES if dur > 4 else 1
    tempos = [max(0.0, dur * (i + 0.5) / n) for i in range(n)] if dur else [0.0]
    out = []
    for i, t in enumerate(tempos):
        fp = os.path.join(tmp, f"frame_{i}.jpg")
        try:
            subprocess.run(
                ["ffmpeg", "-y", "-ss", str(t), "-i", src, "-frames:v", "1",
                 "-vf", f"scale='min({LADO_MAX},iw)':-2", fp],
                check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            with open(fp, "rb") as f:
                out.append(f.read())
        except Exception:
            continue
    return out


def _transcrever(src: str, tmp: str) -> str:
    """Transcodifica para FLAC 16k mono, fatia em ≤55s e transcreve cada fatia."""
    if not settings.GOOGLE_CREDENTIALS_JSON.strip():
        raise RuntimeError("stt-sem-credencial")
    padrao = os.path.join(tmp, "seg_%03d.flac")
    subprocess.run(
        ["ffmpeg", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000",
         "-f", "segment", "-segment_time", str(SEG_SEG), "-c:a", "flac", padrao],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    fatias = sorted(glob.glob(os.path.join(tmp, "seg_*.flac")))
    if not fatias:
        return ""

    from google.cloud import speech
    from google.oauth2 import service_account
    info = json.loads(settings.GOOGLE_CREDENTIALS_JSON)
    creds = service_account.Credentials.from_service_account_info(info)
    client = speech.SpeechClient(credentials=creds)
    conf = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.FLAC,
        sample_rate_hertz=16000, language_code=settings.STT_IDIOMA,
        enable_automatic_punctuation=True,
    )
    partes = []
    for fp in fatias:
        with open(fp, "rb") as f:
            audio = speech.RecognitionAudio(content=f.read())
        resp = client.recognize(config=conf, audio=audio)
        partes.append(" ".join(r.alternatives[0].transcript
                               for r in resp.results if r.alternatives).strip())
    return " ".join(p for p in partes if p).strip()


# --------------------------------------------------------------------------- #
# entradas públicas
# --------------------------------------------------------------------------- #
def _instrucao(descricao: str | None, contexto: str, transcricao: str | None = None) -> str:
    linhas = ["Analise o material abaixo e devolva o JSON pedido."]
    if descricao:
        linhas.append(f"\nDescrição do cuidador: {descricao}")
    if transcricao:
        linhas.append(f"\nTranscrição do áudio: \"{transcricao}\"")
    if contexto:
        linhas.append(f"\nContexto recente do diário: {contexto}")
    linhas.append("\nLembre-se: linguagem de hipótese, nunca diagnóstico.")
    return "\n".join(linhas)


def analisar_midia(db: Session, m: MidiaArquivo) -> dict:
    if not settings.ANTHROPIC_API_KEY:
        return {"configurada": False, "suficiente": False, "hipoteses": [],
                "leitura": "A análise da IA ainda não está ativada (falta a chave "
                           "ANTHROPIC_API_KEY no servidor)."}
    contexto = _contexto_recente(db)
    tipo = m.tipo.value
    try:
        with tempfile.TemporaryDirectory() as tmp:
            # ---------- FOTO ----------
            if tipo == "foto":
                mt, dados = _normalizar_imagem(m.dados, m.mime, tmp)
                content = [_bloco_imagem(mt, dados),
                           {"type": "text", "text": _instrucao(m.descricao, contexto)}]
                res = _chamar_claude(content, settings.IA_MODEL_VISION)
                res["tipo"] = tipo
                return res

            # ---------- ÁUDIO ----------
            if tipo == "audio":
                if not _tem_ffmpeg():
                    return _aviso("Análise de áudio indisponível no servidor (ffmpeg).", tipo=tipo)
                src = os.path.join(tmp, "in_audio")
                with open(src, "wb") as f:
                    f.write(m.dados)
                try:
                    transcricao = _transcrever(src, tmp)
                except RuntimeError:
                    return _aviso("A transcrição de áudio ainda não está ativada "
                                  "(falta GOOGLE_CREDENTIALS_JSON no servidor).", tipo=tipo)
                if not transcricao:
                    return _aviso("Não consegui captar fala neste áudio. Se houver uma "
                                  "descrição, a leitura usa ela.", tipo=tipo, transcricao="")
                content = [{"type": "text",
                            "text": _instrucao(m.descricao, contexto, transcricao)}]
                res = _chamar_claude(content, settings.IA_MODEL)
                res["tipo"] = tipo
                res["transcricao"] = transcricao
                return res

            # ---------- VÍDEO ----------
            if tipo == "video":
                if not _tem_ffmpeg():
                    return _aviso("Análise de vídeo indisponível no servidor (ffmpeg).", tipo=tipo)
                src = os.path.join(tmp, "in_video")
                with open(src, "wb") as f:
                    f.write(m.dados)
                quadros = _quadros_video(src, tmp)
                try:
                    transcricao = _transcrever(src, tmp)
                except RuntimeError:
                    transcricao = ""  # sem STT ainda: segue só com os quadros
                blocos = [_bloco_imagem("image/jpeg", q) for q in quadros]
                blocos.append({"type": "text",
                               "text": _instrucao(m.descricao, contexto, transcricao or None)})
                if not blocos[:-1] and not transcricao and not m.descricao:
                    return _aviso("Não consegui ler quadros nem áudio deste vídeo.", tipo=tipo)
                res = _chamar_claude(blocos, settings.IA_MODEL_VISION)
                res["tipo"] = tipo
                if transcricao:
                    res["transcricao"] = transcricao
                return res

        return _aviso("Tipo de mídia não suportado para análise.", tipo=tipo)
    except Exception as e:  # noqa: BLE001
        return {"configurada": True, "suficiente": False, "hipoteses": [], "tipo": tipo,
                "leitura": "Não consegui gerar a leitura desta mídia agora.",
                "erro": str(e)[:300]}


def analisar_texto(db: Session, texto: str) -> dict:
    if not settings.ANTHROPIC_API_KEY:
        return {"configurada": False, "suficiente": False, "hipoteses": [],
                "leitura": "A análise da IA ainda não está ativada (falta a chave "
                           "ANTHROPIC_API_KEY no servidor)."}
    texto = (texto or "").strip()
    if len(texto) < 3:
        return _aviso("Escreva um pouco mais para a IA poder ler.", tipo="texto")
    try:
        contexto = _contexto_recente(db)
        content = [{"type": "text", "text": _instrucao(texto, contexto)}]
        res = _chamar_claude(content, settings.IA_MODEL)
        res["tipo"] = "texto"
        return res
    except Exception as e:  # noqa: BLE001
        return {"configurada": True, "suficiente": False, "hipoteses": [], "tipo": "texto",
                "leitura": "Não consegui gerar a leitura agora.", "erro": str(e)[:300]}
