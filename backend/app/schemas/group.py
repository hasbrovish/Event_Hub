from pydantic import BaseModel, EmailStr, Field


class GroupOut(BaseModel):
    id: int
    name: str
    description: str | None
    org: str
    geo: str | None
    unit: str | None
    subunit: str | None
    location: str | None
    dl_emails: list[str] | None
    is_active: bool

    model_config = {"from_attributes": True}


class GroupListResponse(BaseModel):
    items: list[GroupOut]
    total: int
    page: int
    page_size: int


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    org: str = Field(default="Infosys", max_length=100)
    geo: str | None = None
    unit: str | None = None
    subunit: str | None = None
    location: str | None = None
    dl_emails: list[EmailStr] = Field(default_factory=list)


class GroupUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    org: str | None = None
    geo: str | None = None
    unit: str | None = None
    subunit: str | None = None
    location: str | None = None
    dl_emails: list[EmailStr] | None = None
    is_active: bool | None = None


class GroupAdminBody(BaseModel):
    employee_wid: str = Field(..., min_length=1)
