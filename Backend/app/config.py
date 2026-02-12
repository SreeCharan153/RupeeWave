import os

from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    # -------------------- GENERAL --------------------
    ENV: str = "dev"   # dev | prod

    # -------------------- SUPABASE --------------------
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # -------------------- SECURITY --------------------
    SUPABASE_JWT_SECRET: str = ""
    SECRET_KEY: str | None = None  # local fallback

    # -------------------- Pydantic Config --------------------
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    # -------------------- VALIDATION --------------------
    @field_validator("ENV")
    def validate_env(cls, v):
        allowed = {"dev", "prod"}
        if v not in allowed:
            raise ValueError(f"ENV must be one of {allowed}")
        return v

    # JWT Secret (final)
    @property
    def JWT_SECRET(self) -> str:
        """Return a guaranteed JWT secret string."""
        if self.SUPABASE_JWT_SECRET:
            return self.SUPABASE_JWT_SECRET
        if self.SECRET_KEY:
            return self.SECRET_KEY
        if os.getenv("TESTING", "0") == "1":
            return "test-jwt-secret"
        raise ValueError("No JWT secret found. Set SUPABASE_JWT_SECRET or SECRET_KEY.")


# -------------------- LOAD SETTINGS --------------------
settings = Settings()
IS_TESTING = os.getenv("TESTING", "0") == "1"

# -------------------- MANUAL STARTUP VALIDATION --------------------
required_vars = [
    ("SUPABASE_URL", settings.SUPABASE_URL),
    ("SUPABASE_KEY", settings.SUPABASE_KEY),
    ("SUPABASE_SERVICE_ROLE_KEY", settings.SUPABASE_SERVICE_ROLE_KEY),
]

if not IS_TESTING:
    for key, value in required_vars:
        if not value:
            raise RuntimeError(f"{key} missing from .env")

# JWT Secret is checked via property inside JWT_SECRET
if not IS_TESTING:
    _ = settings.JWT_SECRET
