"""
HPP Schemas
"""
from pydantic import BaseModel, Field
from typing import List


class BOMDetail(BaseModel):
    material_id: str
    material_nama: str
    material_satuan: str
    qty: float
    harga_satuan: float
    biaya_bahan: float  # qty * harga_satuan


class HPPResponse(BaseModel):
    product_id: str
    product_nama: str
    bom_details: List[BOMDetail]
    total_bahan: float
    biaya_lain: int
    hpp: float
