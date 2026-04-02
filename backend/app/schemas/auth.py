from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class DevLoginRequest(BaseModel):
    mode: Literal["dev"] = "dev"
    email: EmailStr = "dev.user@example.com"
    first_name: str = "Dev"
    last_name: str = "User"
    roles: list[str] = Field(default_factory=lambda: ["audience", "speaker"])


class SSOLoginRequest(BaseModel):
    session_cookie: str = Field(..., min_length=1)


class EmployeeMeResponse(BaseModel):
    wid: str
    email: str
    first_name: str
    last_name: str
    roles: list[str]


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: EmployeeMeResponse


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
