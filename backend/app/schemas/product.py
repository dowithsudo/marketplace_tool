"""
Product Schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class ProductBase(BaseModel):
    nama: str = Field(..., min_length=1, description="Nama produk")


class ProductCreate(ProductBase):
    id: str = Field(..., min_length=1, description="ID unik produk")


class ProductUpdate(BaseModel):
    nama: str | None = Field(None, min_length=1)


class BOMItem(BaseModel):
    """Simplified BOM item for product response"""
    id: int
    material_id: str
    qty: float
    material_nama: Optional[str] = None
    material_harga_satuan: Optional[float] = None
    biaya_bahan: Optional[float] = None
    
    class Config:
        from_attributes = True


class ProductResponse(ProductBase):
    id: str
    bom_items: List[BOMItem] = []
    hpp: Optional[float] = None
    
    class Config:
        from_attributes = True
