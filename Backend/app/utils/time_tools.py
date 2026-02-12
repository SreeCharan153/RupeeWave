from datetime import datetime, timezone

def now_utc_ts() -> float:
    return datetime.now(timezone.utc).timestamp()