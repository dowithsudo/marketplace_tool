"""
Marketplace Schemas
"""
from pydantic import BaseModel, Field


class MarketplaceBase(BaseModel):
    name: str = Field(..., min_length=1, description="Nama marketplace")


class MarketplaceCreate(MarketplaceBase):
    id: str = Field(..., min_length=1, description="ID unik marketplace")


class MarketplaceUpdate(BaseModel):
    name: str | None = Field(None, min_length=1)


class MarketplaceResponse(MarketplaceBase):
    id: str

    class Config:
        from_attributes = True
