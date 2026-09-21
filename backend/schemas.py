from pydantic import BaseModel
from typing import Optional

class AlertCreate(BaseModel):
    user_id: int
    zone: str
    title: str
    description: str
    media_url: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    state: str