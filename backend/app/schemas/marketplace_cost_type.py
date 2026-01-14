"""
MarketplaceCostType Schemas
"""
from pydantic import BaseModel, Field
from typing import Literal


class MarketplaceCostTypeBase(BaseModel):
    name: str = Field(..., min_length=1, description="Nama tipe biaya")
    calc_type: Literal["percent", "fixed"] = Field(..., description="Tipe kalkulasi: percent atau fixed")
    apply_to: Literal["price", "after_discount"] = Field(..., description="Diaplikasikan ke: price atau after_discount")


class MarketplaceCostTypeCreate(MarketplaceCostTypeBase):
    id: str = Field(..., min_length=1, description="ID unik tipe biaya")


class MarketplaceCostTypeUpdate(BaseModel):
    name: str | None = Field(None, min_length=1)
    calc_type: Literal["percent", "fixed"] | None = None
    apply_to: Literal["price", "after_discount"] | None = None


class MarketplaceCostTypeResponse(MarketplaceCostTypeBase):
    id: str

    class Config:
        from_attributes = True
