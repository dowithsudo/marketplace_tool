"""
Product Schemas
"""
from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    nama: str = Field(..., min_length=1, description="Nama produk")
    biaya_lain: int = Field(0, ge=0, description="Biaya produksi tambahan per produk")


class ProductCreate(ProductBase):
    id: str = Field(..., min_length=1, description="ID unik produk")


class ProductUpdate(BaseModel):
    nama: str | None = Field(None, min_length=1)
    biaya_lain: int | None = Field(None, ge=0)


class ProductResponse(ProductBase):
    id: str

    class Config:
        from_attributes = True
