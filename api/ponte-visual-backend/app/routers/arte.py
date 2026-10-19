"""Canal de Arte — DORMENTE. Endpoints preservados da v1, reativáveis.

Exposto com badge 'dormente' no app. Mantido para não quebrar a continuidade
do acervo quando o menino retomar pintura/fotografia.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.arte import Obra
from app.models.enums import ObraStatus
from app.models.perfil import Perfil
from app.security import get_perfil_atual

router = APIRouter(prefix="/obras", tags=["arte (dormente)"])


class ObraIn(BaseModel):
    codigo_legivel: str
    tipo_midia: str  # pintura | foto
    arquivo_uri: str
    foi_enderecada: bool = False


@router.post("", status_code=201)
def criar_obra(
    dados: ObraIn,
    db: Session = Depends(get_db),
    perfil: Perfil = Depends(get_perfil_atual),
):
    obra = Obra(
        codigo_legivel=dados.codigo_legivel,
        data_hora_criacao=datetime.now(timezone.utc),
        tipo_midia=dados.tipo_midia,
        arquivo_uri=dados.arquivo_uri,
        foi_enderecada=1 if dados.foi_enderecada else 0,
        status=ObraStatus.rascunho,
    )
    db.add(obra)
    db.commit()
    db.refresh(obra)
    return {"id": obra.id, "codigo_legivel": obra.codigo_legivel,
            "status": obra.status.value}


@router.get("")
def listar_obras(
    db: Session = Depends(get_db), perfil: Perfil = Depends(get_perfil_atual)
):
    obras = db.execute(select(Obra).order_by(Obra.data_hora_criacao)).scalars().all()
    return [{"id": o.id, "codigo_legivel": o.codigo_legivel,
             "status": o.status.value} for o in obras]
