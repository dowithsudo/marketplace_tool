"""
Material Schemas
"""
from pydantic import BaseModel, Field, field_validator


class MaterialBase(BaseModel):
    nama: str = Field(..., min_length=1, description="Nama bahan")
    harga_total: int = Field(..., ge=0, description="Harga total pembelian bahan")
    jumlah_unit: float = Field(..., gt=0, description="Jumlah unit dalam pembelian")
    satuan: str = Field(..., min_length=1, description="Satuan bahan (cm, pcs, gram, dll)")


class MaterialCreate(MaterialBase):
    id: str = Field(..., min_length=1, description="ID unik bahan")


class MaterialUpdate(BaseModel):
    nama: str | None = Field(None, min_length=1)
    harga_total: int | None = Field(None, ge=0)
    jumlah_unit: float | None = Field(None, gt=0)
    satuan: str | None = Field(None, min_length=1)


class MaterialResponse(MaterialBase):
    id: str
    harga_satuan: float = Field(..., description="Harga per satuan (dihitung otomatis)")

    class Config:
        from_attributes = True
