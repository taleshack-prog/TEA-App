"""Perfis da rede: pais (núcleo) e periferia (avó, tia, amigos). Também autentica."""
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String

from app.database import Base
from app.models.enums import Papel, Nucleo


def agora():
    return datetime.now(timezone.utc)


class Perfil(Base):
    __tablename__ = "tb_perfil"

    id = Column(Integer, primary_key=True)
    nome = Column(String(120), nullable=False)
    papel = Column(Enum(Papel, native_enum=False, length=20), nullable=False)
    tipo = Column(Enum(Nucleo, native_enum=False, length=12), nullable=False)
    # Só os pais veem a análise da IA (RBAC / anti-contaminação).
    ve_analise_ia = Column(Boolean, nullable=False, default=False)

    email = Column(String(180), unique=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)

    ativo = Column(Boolean, nullable=False, default=True)
    criado_em = Column(DateTime(timezone=True), default=agora, nullable=False)
