"""Popula dados iniciais: taxonomia de intenções (arte) + 2 perfis-pais +
config de check-ins padrão. Idempotente. Rode: python seed.py"""
from app.database import Base, SessionLocal, engine
from app import models  # noqa: F401
from app.models.analise import ConfigCheckins
from app.models.arte import TaxonomiaIntencao
from app.models.enums import Nucleo, Papel
from app.models.perfil import Perfil
from app.security import hash_senha

TAXONOMIA = [
    ("Se acalmar", "Regulacao"),
    ("Se conectar", "Conexao"),
    ("Mostrar incômodo", "Desconforto"),
    ("Diversão / prazer", "Fluxo"),
    ("Pedir algo", "Necessidade"),
    ("Mostrar algo que viu", "Memoria"),
    ("Protestar / recusar", "Protesto"),
    ("Não sei dizer", "Ambigua"),
]


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Taxonomia (idêntica à das planilhas — base do kappa).
        for rotulo, tecnico in TAXONOMIA:
            if not db.query(TaxonomiaIntencao).filter_by(rotulo_curto=rotulo).first():
                db.add(TaxonomiaIntencao(rotulo_curto=rotulo, nome_tecnico=tecnico))

        # Perfis dos pais (núcleo, veem a análise da IA).
        pais = [
            ("Mãe", Papel.mae, "mae@pontevisual.app"),
            ("Pai", Papel.pai, "pai@pontevisual.app"),
        ]
        ids = []
        for nome, papel, email in pais:
            p = db.query(Perfil).filter_by(email=email).first()
            if not p:
                p = Perfil(
                    nome=nome, papel=papel, tipo=Nucleo.nucleo,
                    ve_analise_ia=True, email=email,
                    senha_hash=hash_senha("mudar123"),
                )
                db.add(p)
                db.flush()
            ids.append(p.id)
        db.commit()

        # Config de check-ins padrão para cada pai.
        for pid in ids:
            if not db.query(ConfigCheckins).filter_by(id_perfil=pid).first():
                db.add(ConfigCheckins(
                    id_perfil=pid,
                    horarios=["08:00", "12:00", "17:00", "21:00"],
                    dias=None, janela_expiracao_min=120, ativo=True,
                ))
        db.commit()
        print("Seed concluído. Logins: mae@/pai@pontevisual.app · senha: mudar123")
    finally:
        db.close()


if __name__ == "__main__":
    run()
