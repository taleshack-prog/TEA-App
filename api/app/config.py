"""Configuração central — lê variáveis de ambiente (.env no local, painel no Railway)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Banco. Vazio => SQLite local (desenvolvimento).
    DATABASE_URL: str = ""

    # JWT
    SECRET_KEY: str = "dev-secret-trocar"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 dias
    ALGORITHM: str = "HS256"

    # Storage
    S3_ENDPOINT: str = ""
    S3_BUCKET: str = "ponte-visual-midia"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_REGION: str = "us-east-1"

    # IA — leitura interpretativa (Nível 3). Sem a chave, a tela avisa.
    ANTHROPIC_API_KEY: str = ""
    IA_MODEL: str = "claude-3-5-haiku-latest"           # texto (barato)
    IA_MODEL_VISION: str = "claude-3-5-sonnet-latest"   # foto/vídeo (melhor leitura)

    # Transcrição de áudio/vídeo — Google Cloud Speech-to-Text.
    # Cole o JSON da conta de serviço inteiro em GOOGLE_CREDENTIALS_JSON (Railway).
    # Sem ele, a análise de áudio/vídeo avisa que a transcrição não está ativada.
    GOOGLE_CREDENTIALS_JSON: str = ""
    STT_IDIOMA: str = "pt-BR"

    # Regras de negócio
    CHECKIN_EXPIRACAO_MIN: int = 120

    # CORS: origens permitidas, separadas por vírgula. Já inclui o dev local e
    # o domínio do app no Vercel, então funciona sem precisar definir env var.
    # Para trocar o domínio, defina CORS_ORIGINS no Railway.
    CORS_ORIGINS: str = (
        "http://localhost:5173,https://tea-app-khaki.vercel.app"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Converte a string CORS_ORIGINS numa lista para o middleware."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def sqlalchemy_url(self) -> str:
        """Railway entrega 'postgres://'; SQLAlchemy 2.x exige 'postgresql://'."""
        url = self.DATABASE_URL.strip()
        if not url:
            return "sqlite:///./ponte_visual.db"
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url


settings = Settings()
