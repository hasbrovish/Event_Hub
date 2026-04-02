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
    allow_dev_login: bool = True


settings = Settings()
