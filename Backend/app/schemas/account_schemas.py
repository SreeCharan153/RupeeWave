from pydantic import BaseModel, Field, EmailStr


class AccountBase(BaseModel):
    acc_no: str = Field(..., min_length=3, max_length=32)
    pin: str = Field(..., pattern=r"^\d{4}$")


class CreateAccountRequest(BaseModel):
    holder_name: str = Field(..., min_length=1, max_length=64, pattern=r"^[A-Za-z\s]+$")
    pin: str = Field(..., pattern=r"^\d{4}$")
    vpin: str = Field(..., pattern=r"^\d{4}$")
    mobileno: str = Field(..., min_length=10, max_length=10, pattern=r"^\d{10}$")
    gmail: EmailStr

class BalanceEnquiryRequest(BaseModel):
    acc_no: str = Field(..., min_length=3, max_length=32)
    pin: str = Field(..., pattern=r"^\d{4}$")