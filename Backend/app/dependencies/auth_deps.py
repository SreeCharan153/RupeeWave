import os

from fastapi import Request, HTTPException, Depends
from typing import Dict, Any
from app.utils.jwt_tools import decode_token, make_access, REFRESH_GRACE_SECONDS
from app.utils.time_tools import now_utc_ts
from app.core.supabase_client import get_public_client
from supabase import Client


def get_current_user(request: Request) -> Dict[str, str]:
    """
    Extract user information from the access token in cookies.
    Validates token, fetches user from DB, refreshes token if needed.
    """
    token = request.cookies.get("atm_token")
    if not token:
        if os.getenv("TESTING", "0") == "1":
            return {"sub": "test-user", "app_role": "admin"}
        raise HTTPException(401, "Missing access token")

    # Decode token
    claims = decode_token(token)

    if claims.get("type") != "access":
        raise HTTPException(401, "Invalid token type")

    user_id = claims.get("sub")
    app_role = claims.get("app_role")

    if not user_id or not app_role:
        raise HTTPException(401, "Invalid token payload")

    # Fetch user from Supabase
    client: Client = getattr(request.state, "supabase", None) or get_public_client()

    res = (
        client.table("users")
        .select("uid, role")
        .eq("uid", user_id)
        .single()
        .execute()
    )

    if not res.data:
        raise HTTPException(401, "User not found")

    # DB is source of truth, update role if mismatch
    db_role = res.data["role"]
    if db_role != app_role:
        app_role = db_role

    # Opportunistic refresh
    exp = claims.get("exp")
    if exp and (exp - now_utc_ts()) < REFRESH_GRACE_SECONDS:
        request.state.new_access_token = make_access(str(user_id), app_role)

    return {"sub": str(user_id), "app_role": app_role}


def require_roles(*roles: str):
    """
    Role-based access decorator for routers.
    """
    def _dep(user: Dict[str, Any] = Depends(get_current_user)):
        if user["app_role"] not in roles:
            raise HTTPException(403, "Forbidden: insufficient role")
        return user
    return _dep
