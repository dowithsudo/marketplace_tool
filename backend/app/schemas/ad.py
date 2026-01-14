"""
Ad Schemas
"""
from pydantic import BaseModel, Field


class AdBase(BaseModel):
    store_id: str = Field(..., min_length=1, description="ID toko")
    product_id: str = Field(..., min_length=1, description="ID produk")
    campaign: str | None = Field(None, description="Nama campaign")
    spend: int = Field(..., ge=0, description="Total pengeluaran iklan")
    gmv: int = Field(..., ge=0, description="Gross Merchandise Value")
    orders: int = Field(..., ge=0, description="Jumlah order")


class AdCreate(AdBase):
    pass


class AdUpdate(BaseModel):
    store_id: str | None = Field(None, min_length=1)
    product_id: str | None = Field(None, min_length=1)
    campaign: str | None = None
    spend: int | None = Field(None, ge=0)
    gmv: int | None = Field(None, ge=0)
    orders: int | None = Field(None, ge=0)


class AdResponse(AdBase):
    id: int
    roas: float | None = None  # gmv / spend
    aov: float | None = None   # gmv / orders
    cpa: float | None = None   # spend / orders

    class Config:
        from_attributes = True
