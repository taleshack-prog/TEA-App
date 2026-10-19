"""Saída de IA, alertas e configuração de alarmes de check-in."""
from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text,
)

from app.database import Base
from app.models.enums import AnaliseTipo
from app.models.perfil import agora


class AnaliseIA(Base):
    __tablename__ = "tb_analise_ia"

    id = Column(Integer, primary_key=True)
    periodo_inicio = Column(DateTime(timezone=True), nullable=False)
    periodo_fim = Column(DateTime(timezone=True), nullable=False)
    tipo = Column(Enum(AnaliseTipo, native_enum=False, length=12), nullable=False)
    padroes = Column(JSON, nullable=True)          # lista de padrões detectados
    confianca_0_1 = Column(Float, nullable=True)
    narrativa = Column(Text, nullable=True)
    evidencias = Column(JSON, nullable=True)        # ids das entradas citadas
    criado_em = Column(DateTime(timezone=True), default=agora, nullable=False)


class Alerta(Base):
    __tablename__ = "tb_alerta"

    id = Column(Integer, primary_key=True)
    regra = Column(String(200), nullable=False)
    gatilho = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="aberto")
    criado_em = Column(DateTime(timezone=True), default=agora, nullable=False)


class ConfigCheckins(Base):
    __tablename__ = "tb_config_checkins"

    id = Column(Integer, primary_key=True)
    id_perfil = Column(ForeignKey("tb_perfil.id"), nullable=False)
    horarios = Column(JSON, nullable=False)   # ["08:00","12:00","17:00","21:00"]
    dias = Column(JSON, nullable=True)         # ["seg","ter",...] ou null = todos
    janela_expiracao_min = Column(Integer, nullable=False, default=120)
    ativo = Column(Boolean, nullable=False, default=True)
