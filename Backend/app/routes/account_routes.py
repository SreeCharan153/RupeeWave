# app/routes/account_routes.py

from fastapi import APIRouter, Depends, Request, HTTPException
from app.dependencies.auth_deps import require_roles
from app.services.account_service import AccountService
from app.schemas.account_schemas import CreateAccountRequest

router = APIRouter()

account_service = AccountService()


@router.post("/create")
def create_account(
    request: Request,
    data: CreateAccountRequest,
    _: dict = Depends(require_roles("admin", "teller")),
):
    db = request.state.service  # privileged client

    ok, result = account_service.create_account(
        db=db,
        holder_name=data.holder_name,
        pin=data.pin,
        vpin=data.vpin,
        mobileno=data.mobileno,
        gmail=data.gmail,
        request=request
    )

    if not ok:
        raise HTTPException(400, result)

    return {
        "success": True,
        "account_no": result["account_no"],
        "message": result["message"],
    }
