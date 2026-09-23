from pydantic import BaseModel
from typing import Optional

class AlertCreate(BaseModel):
    user_id: int
    zone: str
    title: str
    description: str
    media_url: Optional[str] = None

class UserCreate(BaseModel):
    phone_number: str
    username: str
    role: str = "citizen"
    state: str
    city: str

class OTPRequest(BaseModel):
    phone_number: str

class OTPVerify(BaseModel):
    phone_number: str
    otp: str