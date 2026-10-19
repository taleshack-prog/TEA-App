"""Autenticação JWT e dependências de RBAC.

Regra central (anti-contaminação v1 preservada): a análise da IA só é
legível por perfis com ve_analise_ia = True (os pais).
"""
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.perfil import Perfil

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_senha(senha: str) -> str:
    # bcrypt opera sobre no máximo 72 bytes; truncamos de forma determinística.
    return bcrypt.hashpw(senha.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return bcrypt.checkpw(senha.encode("utf-8")[:72], senha_hash.encode("utf-8"))


def criar_token(id_perfil: int) -> str:
    expira = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": str(id_perfil), "exp": expira}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_perfil_atual(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Perfil:
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        id_perfil = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise cred_exc

    perfil = db.get(Perfil, id_perfil)
    if perfil is None or not perfil.ativo:
        raise cred_exc
    return perfil


def exigir_pai(perfil: Perfil = Depends(get_perfil_atual)) -> Perfil:
    """Bloqueia o acesso à análise da IA para quem não é dos pais."""
    if not perfil.ve_analise_ia:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas os pais podem acessar a análise da IA.",
        )
    return perfil
