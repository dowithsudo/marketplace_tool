"""
StoreMarketplaceCost Schemas
"""
from pydantic import BaseModel, Field


class StoreMarketplaceCostBase(BaseModel):
    store_id: str = Field(..., min_length=1, description="ID toko")
    cost_type_id: str = Field(..., min_length=1, description="ID tipe biaya")
    value: float = Field(..., ge=0, description="Nilai biaya")


class StoreMarketplaceCostCreate(StoreMarketplaceCostBase):
    pass


class StoreMarketplaceCostUpdate(BaseModel):
    store_id: str | None = Field(None, min_length=1)
    cost_type_id: str | None = Field(None, min_length=1)
    value: float | None = Field(None, ge=0)


class StoreMarketplaceCostResponse(StoreMarketplaceCostBase):
    id: int
    cost_type_name: str | None = None
    calc_type: str | None = None
    apply_to: str | None = None

    class Config:
        from_attributes = True
