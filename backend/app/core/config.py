from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    app_name: str = "Relay API"
    allowed_origins: list[str] = ['http://localhost:3000']
    database_url: str
    secret_key: str


settings = Settings()
