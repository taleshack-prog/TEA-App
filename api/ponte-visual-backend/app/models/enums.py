"""Enumerações do domínio — espelham as listas fechadas do PRD/TDD."""
import enum


class Papel(str, enum.Enum):
    mae = "mae"
    pai = "pai"
    amigo_familia = "amigo_familia"
    avo = "avo"
    tia = "tia"
    amigo_pai = "amigo_pai"
    crianca = "crianca"


class Nucleo(str, enum.Enum):
    nucleo = "nucleo"       # contexto rico → tabela emissão
    periferia = "periferia"  # percepção de receptor → tabela recepção


class CheckinTipo(str, enum.Enum):
    agendado = "agendado"
    livre = "livre"
    evento = "evento"


class CheckinStatus(str, enum.Enum):
    agendado = "agendado"
    notificado = "notificado"
    preenchido = "preenchido"
    expirado = "expirado"
    expirado_preenchido = "expirado_preenchido"


class Humor(str, enum.Enum):
    calmo = "calmo"
    agitado = "agitado"
    triste = "triste"
    euforico = "euforico"
    introspectivo = "introspectivo"
    tenso = "tenso"
    alegre = "alegre"


class Alimentacao(str, enum.Enum):
    normal = "normal"
    alterada = "alterada"
    recusa = "recusa"


class EventoTipo(str, enum.Enum):
    crise = "crise"
    euforia = "euforia"
    introspeccao = "introspeccao"
    alegria_intensa = "alegria_intensa"


class EventoResultado(str, enum.Enum):
    melhorou = "melhorou"
    igual = "igual"
    piorou = "piorou"


class MidiaTipo(str, enum.Enum):
    foto = "foto"
    video = "video"
    audio = "audio"


class AnaliseTipo(str, enum.Enum):
    diaria = "diaria"
    semanal = "semanal"
    sob_demanda = "sob_demanda"


class ObraStatus(str, enum.Enum):
    rascunho = "rascunho"
    contexto_completo = "contexto_completo"
    hipotese_registrada = "hipotese_registrada"
    leitura_revelada = "leitura_revelada"
    validada = "validada"
    corrigida = "corrigida"
    rejeitada = "rejeitada"
