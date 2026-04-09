from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Issue Tracker"
    data_dir: str = "data"
    allowed_origins: list[str] = ["http://localhost:3000"]
    database_url: str

    class Config:
        env_file = ".env"


settings = Settings()
