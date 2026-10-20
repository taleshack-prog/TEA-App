#!/usr/bin/env python3
"""Gera o audiolivro "Antifrágil Blindado" com Google Cloud TTS (vozes Chirp 3 HD).

Roda UMA vez na sua máquina. Os MP3 ficam em web/public/audio/ e o app só toca
(custo por play = zero). O livro inteiro (~261k caracteres) cabe no free tier de
1M/mês do Google, então na prática a geração sai de graça.

USO
  1) Ouça 3 vozes femininas para escolher:
       python gerar_audiolivro.py amostras
     (gera web/public/audio/amostra-<voz>.mp3 — abra e escute)

  2) Gere o livro inteiro com a voz escolhida:
       python gerar_audiolivro.py livro --voz pt-BR-Chirp3-HD-Leda

REQUISITOS
  pip install google-cloud-texttospeech
  export GOOGLE_APPLICATION_CREDENTIALS=/caminho/para/sua-chave.json
  (opcional) ffmpeg no PATH  ->  reduz o tamanho dos MP3 (mono, 32 kbps)
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

try:
    from google.cloud import texttospeech as tts
except ImportError:
    sys.exit("Falta a biblioteca. Rode:  pip install google-cloud-texttospeech")

RAIZ = Path(__file__).resolve().parent

def _primeiro(*cands: Path) -> Path:
    for c in cands:
        if c.exists():
            return c
    return cands[-1]  # não existe ainda; devolve o preferido

# Funciona tanto no monorepo (web/...) quanto numa pasta web/ isolada.
LIVRO = _primeiro(RAIZ / "web/src/data/livro.json", RAIZ / "src/data/livro.json")
SAIDA = (RAIZ / "web/public/audio") if (RAIZ / "web").exists() else (RAIZ / "public/audio")

LIMITE_BYTES = 4800  # folga abaixo do teto de 5000 bytes por chamada da API
VOZES_FEM = [
    "pt-BR-Chirp3-HD-Leda",       # calorosa, equilibrada
    "pt-BR-Chirp3-HD-Aoede",      # suave
    "pt-BR-Chirp3-HD-Callirrhoe", # mais firme
]
TEXTO_AMOSTRA = (
    "Oi! Esta é uma amostra da narração do livro Antifrágil Blindado. "
    "Se você gostar desta voz, é com ela que vou gravar todos os capítulos."
)


def frases(texto: str) -> list[str]:
    t = re.sub(r"\s+", " ", texto).strip()
    return re.findall(r"[^.!?…]+[.!?…]+|\S[^.!?…]*$", t) or [t]


def em_pedacos(texto: str, limite: int = LIMITE_BYTES) -> list[str]:
    """Junta frases até o limite de bytes da API, quebrando em fronteira de frase."""
    pedacos: list[str] = []
    atual = ""
    for f in frases(texto):
        f = f.strip()
        if not f:
            continue
        cand = (atual + " " + f).strip()
        if len(cand.encode("utf-8")) > limite and atual:
            pedacos.append(atual)
            atual = f
        else:
            atual = cand
    if atual:
        pedacos.append(atual)
    return pedacos


def sintetizar(cliente, texto: str, voz: str) -> bytes:
    resp = cliente.synthesize_speech(
        input=tts.SynthesisInput(text=texto),
        voice=tts.VoiceSelectionParams(language_code="pt-BR", name=voz),
        audio_config=tts.AudioConfig(audio_encoding=tts.AudioEncoding.MP3),
    )
    return resp.audio_content


def reencode_opcional(caminho: Path) -> None:
    """Se houver ffmpeg, re-codifica para mono 32 kbps (menor e junta os pedaços)."""
    if not shutil.which("ffmpeg"):
        return
    tmp = caminho.with_suffix(".tmp.mp3")
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(caminho), "-ac", "1", "-b:a", "32k", str(tmp)],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    tmp.replace(caminho)


def carregar_livro() -> dict:
    if not LIVRO.exists():
        sys.exit(f"Não achei {LIVRO}. Rode a partir da raiz do repositório.")
    return json.loads(LIVRO.read_text(encoding="utf-8"))


def modo_amostras(cliente) -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)
    for voz in VOZES_FEM:
        nome = voz.split("-")[-1].lower()
        destino = SAIDA / f"amostra-{nome}.mp3"
        print(f"  gerando amostra: {voz} …", flush=True)
        try:
            audio = sintetizar(cliente, TEXTO_AMOSTRA, voz)
        except Exception as e:
            print(f"    ! falhou ({e}); pulando")
            continue
        destino.write_bytes(audio)
        reencode_opcional(destino)
        print(f"    -> {destino}")
    print("\nEscute os arquivos amostra-*.mp3 e escolha a voz. Depois rode:")
    print("  python gerar_audiolivro.py livro --voz pt-BR-Chirp3-HD-<Nome>")


def modo_livro(cliente, voz: str) -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)
    livro = carregar_livro()
    caps = livro["capitulos"]
    total_chars = 0
    for cap in caps:
        pedacos = em_pedacos(cap["texto"])
        total_chars += sum(len(p) for p in pedacos)
        print(f"  cap {cap['id']:>2}: {cap['titulo'][:48]:<48} "
              f"({len(pedacos)} pedaço(s))", flush=True)
        partes = []
        for i, p in enumerate(pedacos, 1):
            partes.append(sintetizar(cliente, p, voz))
            print(f"      pedaço {i}/{len(pedacos)}", end="\r", flush=True)
        destino = SAIDA / f"cap-{cap['id']}.mp3"
        destino.write_bytes(b"".join(partes))
        reencode_opcional(destino)
        kb = destino.stat().st_size // 1024
        print(f"      -> {destino.name}  ({kb} KB)            ")
    print(f"\nPronto. {len(caps)} capítulos, ~{total_chars:,} caracteres.")
    print("Dentro do free tier de 1M/mês do Google TTS = sem cobrança.")
    print(f"Arquivos em: {SAIDA}")
    print("\nAgora suba:")
    print("  git add web/public/audio")
    print('  git commit -m "feat(web): audiolivro narrado (Google TTS Chirp 3 HD)"')
    print("  git push")


def main() -> None:
    ap = argparse.ArgumentParser(description="Gera o audiolivro com Google Cloud TTS.")
    sub = ap.add_subparsers(dest="modo", required=True)
    sub.add_parser("amostras", help="gera 3 amostras de vozes femininas")
    pl = sub.add_parser("livro", help="gera o livro inteiro")
    pl.add_argument("--voz", default="pt-BR-Chirp3-HD-Leda",
                    help="nome da voz (padrão: pt-BR-Chirp3-HD-Leda)")
    args = ap.parse_args()

    cliente = tts.TextToSpeechClient()
    if args.modo == "amostras":
        modo_amostras(cliente)
    else:
        modo_livro(cliente, args.voz)


if __name__ == "__main__":
    main()
