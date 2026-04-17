from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Event Hub API"
    database_url: str = "postgresql+asyncpg://eventhub:eventhub@127.0.0.1:5432/eventhub"
    sync_database_url: str = "postgresql+psycopg2://eventhub:eventhub@127.0.0.1:5432/eventhub"

    jwt_secret: str = Field(
        default="event-hub-dev-secret-change-in-production-min-32-chars!!",
        description="HS256 signing secret; override in production",
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12
    refresh_token_expire_days: int = 7
    allow_dev_login: bool = True

    # Corporate integration seam (see app/integrations/corporate_stubs.py, planning/MASTER_FINAL_PLAN.md)
    integration_mode: Literal["mock", "live"] = Field(
        default="mock",
        description="mock = stubs only; live = real clients (implement beside stubs)",
    )
    integration_mock_sso_login: bool = Field(
        default=False,
        description="If true, POST /auth/login/sso accepts mock_sso|... cookie (demo only)",
    )
    zscaler_ca_path: str | None = Field(
        default=None,
        description="Path to Zscaler root PEM for httpx when calling Infosys / Graph",
    )


settings = Settings()
