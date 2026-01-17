from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class StorePerformanceBase(BaseModel):
    store_id: str
    date: date
    visitors: int
    orders: int
    revenue: float # Net
    gross_revenue: float
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
    total_gross: float
    avg_conversion: float
    analysis_summary: str

class ProductSalesImportResponse(BaseModel):
    store_id: str
    rows_imported: int
    rows_skipped: int
    summary: str

class SalesReportResponse(BaseModel):
    id: int
    store_id: str
    filename: str
    period_start: date
    period_end: date
    total_gross: float
    total_net: float
    upload_date: date

    class Config:
        from_attributes = True
