"""
Decision & Grading Schemas
"""
from pydantic import BaseModel, Field
from typing import List, Literal


class Alert(BaseModel):
    level: Literal["info", "warning", "danger"] = Field(..., description="Level alert")
    message: str = Field(..., description="Pesan alert")


class DecisionResponse(BaseModel):
    store_id: str
    product_id: str
    product_name: str
    store_name: str
    
    # Pricing metrics
    harga_jual: int
    hpp: float
    profit_per_order: float
    margin_percent: float
    
    # Ads metrics (if available)
    has_ads_data: bool
    total_ads_spend: int | None = None
    total_gmv: int | None = None
    total_orders: int | None = None
    roas: float | None = None
    cpa: float | None = None
    ads_profit_total: float | None = None
    ads_profit_per_order: float | None = None
    
    # Grading
    grade: Literal["NOT_VIABLE", "RISKY", "VIABLE", "SCALABLE"]
    grade_reason: str
    
    # Alerts
    alerts: List[Alert]
    
    # Break-even metrics
    break_even_roas: float
    max_cpa: float
