"""Galeria de mídia (T9): upload, listagem, entrega do arquivo e edição da
descrição. Os bytes ficam no banco (piloto). Entrega exige autenticação; o app
busca os arquivos com o token e monta a imagem localmente."""
from typing import Optional

from fastapi import (
    APIRouter, Depends, File, Form, HTTPException, UploadFile,
)
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import MidiaTipo
from app.models.galeria import MidiaArquivo
from app.models.perfil import Perfil
from app.security import get_perfil_atual

router = APIRouter(prefix="/midias", tags=["galeria"])

MAX_BYTES = 25 * 1024 * 1024  # 25 MB por arquivo


@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    tipo: str = Form("foto"),
    descricao: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    perfil: Perfil = Depends(get_perfil_atual),
):
    conteudo = await file.read()
    if len(conteudo) > MAX_BYTES:
        raise HTTPException(413, "Arquivo muito grande (máximo 25 MB).")
    try:
        t = MidiaTipo(tipo)
    except ValueError:
        t = MidiaTipo.video if (file.content_type or "").startswith("video") else MidiaTipo.foto

    m = MidiaArquivo(
        id_perfil=perfil.id,
        tipo=t,
        mime=file.content_type or "application/octet-stream",
        nome_arquivo=file.filename,
        dados=conteudo,
        descricao=(descricao or None),
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return _meta(m)


@router.get("")
def listar(db: Session = Depends(get_db), perfil: Perfil = Depends(get_perfil_atual)):
    ms = db.execute(
        select(MidiaArquivo).order_by(MidiaArquivo.criado_em.desc())
    ).scalars().all()
    return [_meta(m) for m in ms]


@router.get("/{mid}/arquivo")
def arquivo(mid: int, db: Session = Depends(get_db),
            perfil: Perfil = Depends(get_perfil_atual)):
    m = db.get(MidiaArquivo, mid)
    if m is None:
        raise HTTPException(404, "Mídia não encontrada.")
    return Response(content=m.dados, media_type=m.mime)


class DescricaoIn(BaseModel):
    descricao: str


@router.patch("/{mid}")
def editar(mid: int, dados: DescricaoIn, db: Session = Depends(get_db),
           perfil: Perfil = Depends(get_perfil_atual)):
    m = db.get(MidiaArquivo, mid)
    if m is None:
        raise HTTPException(404, "Mídia não encontrada.")
    m.descricao = dados.descricao or None
    db.commit()
    return _meta(m)


def _meta(m: MidiaArquivo) -> dict:
    return {
        "id": m.id,
        "tipo": m.tipo.value,
        "mime": m.mime,
        "descricao": m.descricao,
        "criado_em": m.criado_em.isoformat(),
    }
