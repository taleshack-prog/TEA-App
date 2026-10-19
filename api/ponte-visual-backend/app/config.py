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

    # Regras de negócio
    CHECKIN_EXPIRACAO_MIN: int = 120

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
