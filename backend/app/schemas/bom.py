"""
BOM (Bill of Materials) Schemas
"""
from pydantic import BaseModel, Field


class BOMBase(BaseModel):
    product_id: str = Field(..., min_length=1, description="ID produk")
    material_id: str = Field(..., min_length=1, description="ID bahan")
    qty: float = Field(..., gt=0, description="Jumlah bahan yang digunakan")


class BOMCreate(BOMBase):
    pass


class BOMUpdate(BaseModel):
    product_id: str | None = Field(None, min_length=1)
    material_id: str | None = Field(None, min_length=1)
    qty: float | None = Field(None, gt=0)


class BOMResponse(BOMBase):
    id: int
    material_nama: str | None = None
    material_satuan: str | None = None
    material_harga_satuan: float | None = None
    biaya_bahan: float | None = None  # qty * harga_satuan

    class Config:
        from_attributes = True
