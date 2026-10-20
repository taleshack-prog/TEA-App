"""Pergunte ao livro — Q&A sobre "Antifrágil Blindado" para pais e cuidadores.
Diferente da análise da criança, isto é material de apoio: aberto a qualquer
perfil autenticado (não é restrito aos pais)."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.models.perfil import Perfil
from app.security import get_perfil_atual
from app.services.livro_ia import perguntar

router = APIRouter(prefix="/livro", tags=["livro"])


class PerguntaIn(BaseModel):
    pergunta: str


@router.post("/perguntar")
def perguntar_livro(
    corpo: PerguntaIn,
    _perfil: Perfil = Depends(get_perfil_atual),
):
    return perguntar(corpo.pergunta)
