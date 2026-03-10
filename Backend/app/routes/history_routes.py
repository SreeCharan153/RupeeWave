# app/routes/history_routes.py

from fastapi import APIRouter, Depends, Request, HTTPException
from app.dependencies.auth_deps import require_roles
from app.services.history_service import HistoryService
from app.services.auth_service import AuthService

router = APIRouter()

history_service = HistoryService()
auth_service = AuthService()


@router.get("/{ac_no}")
def get_history(
    ac_no: str,
    pin: str,
    request: Request,
    _: dict = Depends(require_roles("admin", "teller","customer")),
):
    db = request.state.service

    # auth check
    ok, msg = auth_service.check(db, ac_no=ac_no, pin=pin, request=request)
    if not ok:
        raise HTTPException(400, msg)

    # fetch history
    ok, history = history_service.get_history(db, ac_no)
    if not ok:
        raise HTTPException(404, history)

    return {"history": history}
