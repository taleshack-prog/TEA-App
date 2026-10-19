"""Canal de Arte (DORMENTE) — preservado intacto da v1, reativável. Não migrar."""
from sqlalchemy import (
    Column, DateTime, Enum, Float, ForeignKey, Integer, JSON, SmallInteger,
    String, Text, UniqueConstraint,
)

from app.database import Base
from app.models.enums import ObraStatus
from app.models.perfil import agora


class TaxonomiaIntencao(Base):
    """Dicionário compartilhado emissão × recepção (permite o kappa)."""
    __tablename__ = "tb_taxonomia_intencao"

    id = Column(Integer, primary_key=True)
    rotulo_curto = Column(String(60), unique=True, nullable=False)
    nome_tecnico = Column(String(60), nullable=False)
    descricao = Column(Text, nullable=True)


class Obra(Base):
    __tablename__ = "tb_obra"

    id = Column(Integer, primary_key=True)
    codigo_legivel = Column(String(40), unique=True, nullable=False)
    data_hora_criacao = Column(DateTime(timezone=True), nullable=False)
    tipo_midia = Column(String(10), nullable=False)   # pintura | foto
    arquivo_uri = Column(String(500), nullable=False)
    hash_imagem = Column(String(80), nullable=True)
    foi_enderecada = Column(Integer, nullable=False, default=0)
    status = Column(Enum(ObraStatus, native_enum=False, length=24),
                    nullable=False, default=ObraStatus.rascunho)
    criado_em = Column(DateTime(timezone=True), default=agora, nullable=False)


class Emissao(Base):
    __tablename__ = "tb_emissao"
    __table_args__ = (UniqueConstraint("id_obra", "id_anotador"),)

    id = Column(Integer, primary_key=True)
    id_obra = Column(ForeignKey("tb_obra.id"), nullable=False)
    id_anotador = Column(ForeignKey("tb_perfil.id"), nullable=False)
    estado_sensorial = Column(String(40), nullable=False)
    nivel_agitacao = Column(SmallInteger, nullable=False)
    gatilho_antecedente = Column(Text, nullable=True)
    comportamento_pos = Column(Text, nullable=True)
    id_intencao_presumida = Column(ForeignKey("tb_taxonomia_intencao.id"), nullable=True)
    hipotese_livre = Column(Text, nullable=True)
    timestamp_hipotese = Column(DateTime(timezone=True), nullable=False, default=agora)
    criado_em = Column(DateTime(timezone=True), default=agora, nullable=False)


class Recepcao(Base):
    __tablename__ = "tb_recepcao"
    __table_args__ = (UniqueConstraint("id_obra", "id_receptor"),)

    id = Column(Integer, primary_key=True)
    id_obra = Column(ForeignKey("tb_obra.id"), nullable=False)
    id_receptor = Column(ForeignKey("tb_perfil.id"), nullable=False)
    id_percepcao_intencao = Column(ForeignKey("tb_taxonomia_intencao.id"), nullable=True)
    sentimento_receptor = Column(Text, nullable=True)
    o_que_entendeu = Column(Text, nullable=True)
    confianca_1_5 = Column(SmallInteger, nullable=True)
    contexto_recebimento = Column(Text, nullable=True)
    timestamp_percepcao = Column(DateTime(timezone=True), nullable=False, default=agora)
    criado_em = Column(DateTime(timezone=True), default=agora, nullable=False)
