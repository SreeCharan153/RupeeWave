from supabase import create_client, Client
from app.config import settings


def get_public_client() -> Client:
    """
    Returns a fresh Supabase client using anon (public) key.
    Safe to use for user-level operations.
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


def get_service_client() -> Client:
    """
    Returns a fresh Supabase client using the service role key.
    Must ONLY be used for privileged or internal operations.
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


# Backward-compatible module client used by older tests/utilities.
supabase = (
    get_service_client()
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY
    else None
)
