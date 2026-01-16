from pydantic import BaseModel
from typing import Optional


class StoreProductMarketplaceCostBase(BaseModel):
    cost_type_id: str
    value: float


class StoreProductMarketplaceCostCreate(StoreProductMarketplaceCostBase):
    store_product_id: int


class StoreProductMarketplaceCostUpdate(BaseModel):
    value: float


class StoreProductMarketplaceCostResponse(StoreProductMarketplaceCostBase):
    id: int
    user_id: int
    store_product_id: int
    cost_type_name: Optional[str] = None
    calc_type: Optional[str] = None
    apply_to: Optional[str] = None

    class Config:
        from_attributes = True
