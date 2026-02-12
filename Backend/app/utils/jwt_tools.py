from typing import Dict, Any
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException

from app.config import settings
from app.utils.time_tools import now_utc_ts


ALGORITHM = "HS256"
ACCESS_TTL = timedelta(hours=1)
REFRESH_TTL = timedelta(days=30)
REFRESH_GRACE_SECONDS = 10 * 60 


def encode_token(payload: Dict[str, Any]) -> str:
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


def make_access(sub: str, app_role: str) -> str:
    exp = int((datetime.now(timezone.utc) + ACCESS_TTL).timestamp())
    return encode_token({
        "sub": str(sub),
        "role": "authenticated",
        "app_role": app_role,
        "type": "access",
        "exp": exp,
    })


def make_refresh(sub: str, app_role: str) -> str:
    exp = int((datetime.now(timezone.utc) + REFRESH_TTL).timestamp())
    return encode_token({
        "sub": str(sub),
        "role": "authenticated",
        "app_role": app_role,
        "type": "refresh",
        "exp": exp,
    })
