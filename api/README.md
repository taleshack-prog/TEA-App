# Ponte Visual 2.0 — Backend (FastAPI)

API do **Diário Comportamental Estruturado** (canal primário) com o canal de
**arte dormente** preservado e o pipeline de IA **Nível 0** (estatística) ativo
desde o primeiro dia. Implementa PRD v2.0 / TDD v2.2 (Hack Tech Farm).

## Stack
FastAPI · SQLAlchemy 2 · PostgreSQL (Railway) · JWT. SQLite automático em dev.

## Rodar localmente
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # ajuste SECRET_KEY; DATABASE_URL vazio = SQLite
python seed.py                  # taxonomia + 2 perfis-pais + config de check-ins
uvicorn app.main:app --reload   # docs interativas em http://localhost:8000/docs
```
Logins do seed: `mae@pontevisual.app` / `pai@pontevisual.app` · senha `mudar123`
(troque antes de qualquer uso real).

## Deploy no Railway
1. Novo projeto → adicione o plugin **PostgreSQL** (gera `DATABASE_URL`).
2. Suba este diretório; o `Procfile` já define o processo `web`.
3. Variáveis: `SECRET_KEY` (obrigatória) e as de `S3_*` quando for ligar mídia.
4. O `create_all` cria as tabelas no primeiro boot. Rode `python seed.py` uma vez
   (Railway shell) para popular taxonomia e perfis.

> Produção: trocar `create_all` por **Alembic** (migrations versionadas). O
> `migrations/001_init.sql` é o schema canônico de referência.

## Mapa de endpoints
| Método | Rota | Acesso | O quê |
|---|---|---|---|
| POST | `/auth/registrar` · `/auth/login` | público | cadastro / token JWT |
| GET | `/auth/eu` | autenticado | perfil atual |
| POST/GET | `/checkins` | autenticado | submeter / listar check-ins |
| POST | `/checkins/gerar-dia` | autenticado | gera os agendados do dia pela config |
| POST/GET | `/eventos` | autenticado | registrar / listar eventos |
| POST | `/midias` | autenticado | registrar mídia (url do storage) |
| GET | `/timeline?escopo=dia\|semana\|mes` | autenticado | linha do tempo consolidada |
| GET/PUT | `/config/checkins` | autenticado | horários e janela dos alarmes |
| GET | `/analises/descritiva` | **só pais** | Nível 0 (estatística) |
| POST/GET | `/obras` | autenticado | canal de arte (dormente) |

## Decisões de arquitetura (fiéis ao TDD)
- **Offline-first no cliente:** o app mantém SQLite local + notificações locais;
  esta API é o ponto de sincronização. Alarmes **não** dependem do servidor.
- **RBAC / anti-contaminação:** a análise da IA (`/analises/*`) exige
  `ve_analise_ia = True` — só os pais. Periferia recebe `403`.
- **Máquina de estados do check-in:** `agendado → notificado → preenchido`,
  com `expirado`/`expirado_preenchido` para preenchimento tardio (auditoria
  temporal via `timestamp_agendado` × `timestamp_preenchido`).
- **Guardrail anti-apofenia:** o Nível 0 só afirma padrões com ≥5 check-ins;
  abaixo disso retorna `dados_suficientes:false` com aviso.
- **Arte dormente, não removida:** `tb_obra/tb_emissao/tb_recepcao` intactas;
  reativação sem migração destrutiva.

## Próximos níveis do pipeline de IA (por volume, sem fine-tuning)
- **Nível 1 (~30 dias):** correlação sono×crise com defasagem; sequências gatilho→estado.
- **Nível 2 (~90 dias):** regressão logística interpretável → alertas preditivos.
- **Nível 3 (contínuo):** LLM via API + RAG sobre o diário gera o digest narrativo,
  sempre com confiança e citando as entradas-evidência.
