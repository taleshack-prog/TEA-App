"""Cadastro e login de perfis (JWT)."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.perfil import Perfil
from app.schemas import PerfilCriar, PerfilOut, TokenOut
from app.security import criar_token, get_perfil_atual, hash_senha, verificar_senha

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/registrar", response_model=PerfilOut, status_code=201)
def registrar(dados: PerfilCriar, db: Session = Depends(get_db)):
    existe = db.execute(
        select(Perfil).where(Perfil.email == dados.email)
    ).scalars().first()
    if existe:
        raise HTTPException(status_code=409, detail="E-mail já cadastrado.")
    perfil = Perfil(
        nome=dados.nome,
        papel=dados.papel,
        tipo=dados.tipo,
        ve_analise_ia=dados.ve_analise_ia,
        email=dados.email,
        senha_hash=hash_senha(dados.senha),
    )
    db.add(perfil)
    db.commit()
    db.refresh(perfil)
    return perfil


@router.post("/login", response_model=TokenOut)
def login(
    form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    perfil = db.execute(
        select(Perfil).where(Perfil.email == form.username)
    ).scalars().first()
    if not perfil or not verificar_senha(form.password, perfil.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
        )
    return TokenOut(access_token=criar_token(perfil.id), perfil=perfil)


@router.get("/eu", response_model=PerfilOut)
def eu(perfil: Perfil = Depends(get_perfil_atual)):
    return perfil
