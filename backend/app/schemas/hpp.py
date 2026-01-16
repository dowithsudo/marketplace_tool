"""
HPP Schemas
"""
from pydantic import BaseModel, Field
from typing import List


from .product_extra_cost import ProductExtraCostResponse


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
    extra_costs: List[ProductExtraCostResponse]
    total_bahan: float
    biaya_lain: float  # This will now include the sum of extra_costs items + product.biaya_lain
    hpp: float
