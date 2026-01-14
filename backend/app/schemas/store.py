"""
Store Schemas
"""
from pydantic import BaseModel, Field


class StoreBase(BaseModel):
    marketplace_id: str = Field(..., min_length=1, description="ID marketplace")
    name: str = Field(..., min_length=1, description="Nama toko")


class StoreCreate(StoreBase):
    id: str = Field(..., min_length=1, description="ID unik toko")


class StoreUpdate(BaseModel):
    marketplace_id: str | None = Field(None, min_length=1)
    name: str | None = Field(None, min_length=1)


class StoreResponse(StoreBase):
    id: str
    marketplace_name: str | None = None

    class Config:
        from_attributes = True
