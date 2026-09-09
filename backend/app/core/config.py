import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediKiosk - Patient Case-Taking Software"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Dual database support: postgres with automatic sqlite fallback
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./medikiosk.db"
    )
    
    # Redis configuration with memory fallback
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # ABDM configuration
    ABDM_GATEWAY_URL: str = os.getenv("ABDM_GATEWAY_URL", "https://dev.abdm.gov.in/gateway")
    ABDM_CLIENT_ID: str = os.getenv("ABDM_CLIENT_ID", "MEDIKIOSK_SBX_01")
    ABDM_CLIENT_SECRET: str = os.getenv("ABDM_CLIENT_SECRET", "MEDIKIOSK_SECRET_KEY")
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "*"
    ]

    class Config:
        case_sensitive = True

settings = Settings()
