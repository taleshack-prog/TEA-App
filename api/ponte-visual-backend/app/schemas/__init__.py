"""Schemas Pydantic v2 (entrada/saída da API)."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import (
    Alimentacao, AnaliseTipo, CheckinStatus, CheckinTipo, EventoResultado,
    EventoTipo, Humor, MidiaTipo, Nucleo, Papel,
)

ORM = ConfigDict(from_attributes=True)


# ---------- Auth / Perfil ----------
class PerfilCriar(BaseModel):
    nome: str
    papel: Papel
    tipo: Nucleo
    ve_analise_ia: bool = False
    email: EmailStr
    senha: str = Field(min_length=6)


class PerfilOut(BaseModel):
    model_config = ORM
    id: int
    nome: str
    papel: Papel
    tipo: Nucleo
    ve_analise_ia: bool
    email: EmailStr


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    perfil: PerfilOut


# ---------- Sinais / Check-in ----------
class SinalIn(BaseModel):
    humor: Humor
    energia_1_5: int = Field(ge=1, le=5)
    horas_sono: Optional[float] = Field(default=None, ge=0, le=24)
    qualidade_sono_1_5: Optional[int] = Field(default=None, ge=1, le=5)
    alimentacao: Optional[Alimentacao] = None
    medicacao: Optional[bool] = False
    medicacao_obs: Optional[str] = None
    observacao_livre: Optional[str] = None


class SinalOut(SinalIn):
    model_config = ORM
    id: int


class CheckinCriar(BaseModel):
    """Submissão do check-in. id_checkin preenche um agendado; vazio cria livre."""
    id_checkin: Optional[int] = None
    tipo: CheckinTipo = CheckinTipo.livre
    sinal: SinalIn


class CheckinOut(BaseModel):
    model_config = ORM
    id: int
    id_perfil_anotador: int
    tipo: CheckinTipo
    status: CheckinStatus
    timestamp_agendado: Optional[datetime]
    timestamp_preenchido: Optional[datetime]
    criado_em: datetime
    sinal: Optional[SinalOut] = None


# ---------- Evento ----------
class EventoCriar(BaseModel):
    tipo: EventoTipo
    inicio: datetime
    fim: Optional[datetime] = None
    intensidade_1_5: int = Field(ge=1, le=5)
    gatilho_percebido: Optional[str] = None
    intervencao_tentada: Optional[str] = None
    resultado: Optional[EventoResultado] = None


class EventoOut(EventoCriar):
    model_config = ORM
    id: int
    id_perfil: int
    criado_em: datetime


# ---------- Mídia / Relato ----------
class MidiaOut(BaseModel):
    model_config = ORM
    id: int
    tipo: MidiaTipo
    url_storage: str
    id_checkin: Optional[int]
    id_evento: Optional[int]
    duracao_segundos: Optional[int]
    transcricao: Optional[str]


class RelatoCriar(BaseModel):
    id_checkin: Optional[int] = None
    texto: str


class RelatoOut(BaseModel):
    model_config = ORM
    id: int
    id_checkin: Optional[int]
    id_perfil: int
    texto: str
    criado_em: datetime


# ---------- Config de check-ins ----------
class ConfigCheckinsIn(BaseModel):
    horarios: list[str] = Field(examples=[["08:00", "12:00", "17:00", "21:00"]])
    dias: Optional[list[str]] = None
    janela_expiracao_min: int = 120
    ativo: bool = True


class ConfigCheckinsOut(ConfigCheckinsIn):
    model_config = ORM
    id: int
    id_perfil: int


# ---------- Análise ----------
class AnaliseOut(BaseModel):
    model_config = ORM
    id: int
    periodo_inicio: datetime
    periodo_fim: datetime
    tipo: AnaliseTipo
    padroes: Optional[list] = None
    confianca_0_1: Optional[float] = None
    narrativa: Optional[str] = None
    evidencias: Optional[list] = None
