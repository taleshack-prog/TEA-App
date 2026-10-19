"""Importa todos os modelos para que Base.metadata os registre (create_all)."""
from app.models.perfil import Perfil  # noqa: F401
from app.models.diario import (  # noqa: F401
    Checkin, SinalCheckin, Evento, Midia, Relato,
)
from app.models.analise import AnaliseIA, Alerta, ConfigCheckins  # noqa: F401
from app.models.galeria import MidiaArquivo  # noqa: F401
from app.models.arte import (  # noqa: F401
    TaxonomiaIntencao, Obra, Emissao, Recepcao,
)
