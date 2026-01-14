"""
Discount Schemas
"""
from pydantic import BaseModel, Field
from typing import Literal


class DiscountBase(BaseModel):
    store_product_id: int = Field(..., description="ID store_product")
    discount_type: Literal["percent", "fixed"] = Field(..., description="Tipe diskon: percent atau fixed")
    value: float = Field(..., ge=0, description="Nilai diskon")


class DiscountCreate(DiscountBase):
    pass


class DiscountUpdate(BaseModel):
    store_product_id: int | None = None
    discount_type: Literal["percent", "fixed"] | None = None
    value: float | None = Field(None, ge=0)


class DiscountResponse(DiscountBase):
    id: int

    class Config:
        from_attributes = True
