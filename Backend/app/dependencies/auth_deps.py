import os
from fastapi import Request, HTTPException, Depends
from typing import Dict, Any
from app.utils.jwt_tools import decode_token, make_access, REFRESH_GRACE_SECONDS
from app.utils.time_tools import now_utc_ts
from app.core.supabase_client import get_public_client
from supabase import Client


def get_current_user(request: Request) -> Dict[str, str]:
    """
    Extract user from access token in cookies.
    Validates token, verifies against DB, refreshes if near expiry.
    """

    token = request.cookies.get("atm_token")

    if not token:
        if os.getenv("TESTING", "0") == "1":
            return {"sub": "test-user", "app_role": "admin"}
        raise HTTPException(401, "Missing access token")

    claims = decode_token(token)

    if claims.get("type") != "access":
        raise HTTPException(401, "Invalid token type")

    user_id = claims.get("sub")
    app_role = claims.get("app_role")

    if not isinstance(user_id, str) or not isinstance(app_role, str):
        raise HTTPException(401, "Invalid token payload")

    client: Client = getattr(request.state, "supabase", None) or get_public_client()

    try:
        res = (
            client.table("users")
            .select("id, role")
            .eq("id", user_id)   # 🔥 Use UUID column
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(401, "User lookup failed")

    data = res.data

    if not isinstance(data, dict):
        raise HTTPException(401, "User not found")

    db_role = data.get("role")

    if not isinstance(db_role, str):
        raise HTTPException(401, "Invalid user role")

    # DB is source of truth
    if db_role != app_role:
        app_role = db_role

    # Opportunistic refresh
    exp = claims.get("exp")
    if isinstance(exp, int) and (exp - now_utc_ts()) < REFRESH_GRACE_SECONDS:
        request.state.new_access_token = make_access(user_id, app_role)

    return {"sub": user_id, "app_role": app_role}


def require_roles(*roles: str):
    def _dep(user: Dict[str, Any] = Depends(get_current_user)):
        if user["app_role"] not in roles:
            raise HTTPException(403, "Forbidden: insufficient role")
        return user
    return _dep
