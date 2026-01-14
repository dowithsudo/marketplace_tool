"""
StoreProduct Schemas
"""
from pydantic import BaseModel, Field


class StoreProductBase(BaseModel):
    store_id: str = Field(..., min_length=1, description="ID toko")
    product_id: str = Field(..., min_length=1, description="ID produk")
    harga_jual: int = Field(..., ge=0, description="Harga jual di toko ini")


class StoreProductCreate(StoreProductBase):
    pass


class StoreProductUpdate(BaseModel):
    store_id: str | None = Field(None, min_length=1)
    product_id: str | None = Field(None, min_length=1)
    harga_jual: int | None = Field(None, ge=0)


class StoreProductResponse(StoreProductBase):
    id: int
    store_name: str | None = None
    product_name: str | None = None

    class Config:
        from_attributes = True
