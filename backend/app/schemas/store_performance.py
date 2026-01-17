from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class StorePerformanceBase(BaseModel):
    store_id: str
    date: date
    visitors: int
    orders: int
    revenue: float
    conversion_rate: float
    avg_order_value: float

class StorePerformanceCreate(StorePerformanceBase):
    pass

class StorePerformanceResponse(StorePerformanceBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class SalesImportResponse(BaseModel):
    store_id: str
    store_name: str
    rows_imported: int
    total_revenue: float
    avg_conversion: float
    analysis_summary: str
