# app/routes/transaction_routes.py

from fastapi import APIRouter, Depends, Request, HTTPException
from app.dependencies.auth_deps import require_roles
from app.schemas.transaction_schemas import TransactionRequest, TransferRequest
from app.services.transaction_service import TransactionService

router = APIRouter()
transaction_service = TransactionService()


# -------- DEPOSIT --------
@router.post("/deposit")
def deposit(
    request: Request,
    data: TransactionRequest,
    _: dict = Depends(require_roles("admin", "teller")),
):
    db = request.state.service  # privileged DB client

    ok, msg = transaction_service.deposit(
        db=db,
        ac_no=data.acc_no,
        amount=data.amount,
        pin=data.pin,
        request=request
    )

    if not ok:
        raise HTTPException(400, msg)

    return {"success": True, "message": msg}


# -------- WITHDRAW --------
@router.post("/withdraw")
def withdraw(
    request: Request,
    data: TransactionRequest,
    _: dict = Depends(require_roles("admin", "teller")),
):
    db = request.state.service

    ok, msg = transaction_service.withdraw(
        db=db,
        ac_no=data.acc_no,
        amount=data.amount,
        pin=data.pin,
        request=request
    )

    if not ok:
        raise HTTPException(400, msg)

    return {"success": True, "message": msg}


# -------- TRANSFER --------
@router.post("/transfer")
def transfer(
    request: Request,
    data: TransferRequest,
    _: dict = Depends(require_roles("admin", "teller", "customer")),
):
    db = request.state.service

    ok, msg = transaction_service.transfer(
        db=db,
        from_ac=data.acc_no,
        to_ac=data.rec_acc_no,
        amount=data.amount,
        pin=data.pin,
        request=request,
    )

    if not ok:
        raise HTTPException(400, msg)

    return {
        "success": True,
        "message": msg,
    }
