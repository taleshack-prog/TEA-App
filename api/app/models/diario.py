"""Canal Comportamental (primário): check-in, sinais, evento, mídia, relato."""
from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import (
    Alimentacao, CheckinStatus, CheckinTipo, EventoResultado, EventoTipo,
    Humor, MidiaTipo,
)
from app.models.perfil import agora


class Checkin(Base):
    __tablename__ = "tb_checkin"

    id = Column(Integer, primary_key=True)
    id_perfil_anotador = Column(ForeignKey("tb_perfil.id"), nullable=False)
    timestamp_agendado = Column(DateTime(timezone=True), nullable=True)
    timestamp_preenchido = Column(DateTime(timezone=True), nullable=True)
    tipo = Column(Enum(CheckinTipo, native_enum=False, length=12),
                  nullable=False, default=CheckinTipo.agendado)
    status = Column(Enum(CheckinStatus, native_enum=False, length=24),
                    nullable=False, default=CheckinStatus.agendado)
    criado_em = Column(DateTime(timezone=True), default=agora, nullable=False)

    sinal = relationship("SinalCheckin", uselist=False, back_populates="checkin",
                         cascade="all, delete-orphan")
    midias = relationship("Midia", back_populates="checkin",
                          cascade="all, delete-orphan")
    relatos = relationship("Relato", back_populates="checkin",
                           cascade="all, delete-orphan")


class SinalCheckin(Base):
    """Sinais de um check-in. 1:1 com Checkin. humor + energia são obrigatórios."""
    __tablename__ = "tb_sinal_checkin"

    id = Column(Integer, primary_key=True)
    id_checkin = Column(ForeignKey("tb_checkin.id"), nullable=False, unique=True)
    humor = Column(Enum(Humor, native_enum=False, length=14), nullable=False)
    energia_1_5 = Column(Integer, nullable=False)
    horas_sono = Column(Float, nullable=True)
    qualidade_sono_1_5 = Column(Integer, nullable=True)
    alimentacao = Column(Enum(Alimentacao, native_enum=False, length=10), nullable=True)
    medicacao = Column(Boolean, nullable=True, default=False)
    medicacao_obs = Column(String(255), nullable=True)
    observacao_livre = Column(Text, nullable=True)

    checkin = relationship("Checkin", back_populates="sinal")


class Evento(Base):
    __tablename__ = "tb_evento"

    id = Column(Integer, primary_key=True)
    id_perfil = Column(ForeignKey("tb_perfil.id"), nullable=False)
    tipo = Column(Enum(EventoTipo, native_enum=False, length=16), nullable=False)
    inicio = Column(DateTime(timezone=True), nullable=False)
    fim = Column(DateTime(timezone=True), nullable=True)
    intensidade_1_5 = Column(Integer, nullable=False)
    gatilho_percebido = Column(Text, nullable=True)
    intervencao_tentada = Column(Text, nullable=True)
    resultado = Column(Enum(EventoResultado, native_enum=False, length=10), nullable=True)
    criado_em = Column(DateTime(timezone=True), default=agora, nullable=False)

    midias = relationship("Midia", back_populates="evento")


class Midia(Base):
    """Foto/vídeo/áudio anexada a um check-in ou a um evento (T9 Galeria)."""
    __tablename__ = "tb_midia"

    id = Column(Integer, primary_key=True)
    tipo = Column(Enum(MidiaTipo, native_enum=False, length=8), nullable=False)
    url_storage = Column(String(500), nullable=False)
    id_checkin = Column(ForeignKey("tb_checkin.id"), nullable=True)
    id_evento = Column(ForeignKey("tb_evento.id"), nullable=True)
    duracao_segundos = Column(Integer, nullable=True)
    transcricao = Column(Text, nullable=True)
    criado_em = Column(DateTime(timezone=True), default=agora, nullable=False)

    checkin = relationship("Checkin", back_populates="midias")
    evento = relationship("Evento", back_populates="midias")


class Relato(Base):
    """Relato livre, dentro ou fora de um check-in."""
    __tablename__ = "tb_relato"

    id = Column(Integer, primary_key=True)
    id_checkin = Column(ForeignKey("tb_checkin.id"), nullable=True)
    id_perfil = Column(ForeignKey("tb_perfil.id"), nullable=False)
    texto = Column(Text, nullable=False)
    criado_em = Column(DateTime(timezone=True), default=agora, nullable=False)

    checkin = relationship("Checkin", back_populates="relatos")
