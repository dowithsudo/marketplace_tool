"""
Pricing Schemas
"""
from pydantic import BaseModel, Field
from typing import List, Literal


class CostBreakdown(BaseModel):
    cost_type_id: str
    cost_type_name: str
    calc_type: str
    apply_to: str
    value: float
    calculated_cost: float


class PricingCalcRequest(BaseModel):
    store_product_id: int = Field(..., description="ID store_product untuk dihitung")


class PricingCalcResponse(BaseModel):
    store_product_id: int
    store_id: str
    store_name: str
    product_id: str
    product_name: str
    harga_jual: int
    total_diskon: float
    harga_setelah_diskon: float
    hpp: float
    biaya_marketplace_breakdown: List[CostBreakdown]
    total_biaya_marketplace: float
    profit_per_order: float
    margin_percent: float


class ReversePricingRequest(BaseModel):
    store_id: str = Field(..., min_length=1, description="ID toko")
    product_id: str = Field(..., min_length=1, description="ID produk")
    target_type: Literal["fixed", "percent"] = Field(..., description="Tipe target: fixed (nominal) atau percent (margin)")
    target_value: float = Field(..., description="Nilai target profit")


class ReversePricingResponse(BaseModel):
    store_id: str
    product_id: str
    hpp: float
    target_type: str
    target_value: float
    recommended_price: int
    expected_profit: float
    expected_margin_percent: float
    break_even_roas: float
    max_cpa: float
