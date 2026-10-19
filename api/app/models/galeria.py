"""Galeria de mídia (T9) — fotos/vídeos com descrição. Tabela própria, com os
bytes guardados no banco (suficiente para o piloto familiar; trocar por S3 na
escala). Como é tabela nova, o create_all a cria sem migração."""
from sqlalchemy import (
    Column, DateTime, Enum, ForeignKey, Integer, LargeBinary, String, Text,
)

from app.database import Base
from app.models.enums import MidiaTipo
from app.models.perfil import agora


class MidiaArquivo(Base):
    __tablename__ = "tb_midia_arquivo"

    id = Column(Integer, primary_key=True)
    id_perfil = Column(ForeignKey("tb_perfil.id"), nullable=False)
    tipo = Column(Enum(MidiaTipo, native_enum=False, length=8), nullable=False)
    mime = Column(String(100), nullable=False)
    nome_arquivo = Column(String(255), nullable=True)
    dados = Column(LargeBinary, nullable=False)          # bytes do arquivo
    descricao = Column(Text, nullable=True)              # "o que ele quis dizer"
    criado_em = Column(DateTime(timezone=True), default=agora, nullable=False)
