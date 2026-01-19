"""
Ad Schemas
"""
from pydantic import BaseModel, Field


class AdBase(BaseModel):
    store_id: str = Field(..., min_length=1, description="ID toko")
    product_id: str = Field(..., min_length=1, description="ID produk")
    campaign: str | None = Field(None, description="Nama campaign")
    spend: int = Field(..., ge=0, description="Total pengeluaran iklan")
    gmv: int = Field(..., ge=0, description="Gross Merchandise Value")
    orders: int = Field(..., ge=0, description="Jumlah order")
    total_sales: int | None = Field(0, ge=0, description="Total omzet toko/produk (Organik + Iklan)")
    
    # New metrics
    impressions: int | None = Field(0, ge=0)
    clicks: int | None = Field(0, ge=0)
    ctr: float | None = Field(0.0)
    direct_conversions: int | None = Field(0, ge=0)
    items_sold: int | None = Field(0, ge=0)
    start_date: str | None = None
    end_date: str | None = None


class AdCreate(AdBase):
    pass


class AdUpdate(BaseModel):
    store_id: str | None = Field(None, min_length=1)
    product_id: str | None = Field(None, min_length=1)
    campaign: str | None = None
    spend: int | None = Field(None, ge=0)
    gmv: int | None = Field(None, ge=0)
    orders: int | None = Field(None, ge=0)
    total_sales: int | None = Field(None, ge=0)
    impressions: int | None = Field(None, ge=0)
    clicks: int | None = Field(None, ge=0)
    ctr: float | None = None
    direct_conversions: int | None = Field(None, ge=0)
    items_sold: int | None = Field(None, ge=0)
    start_date: str | None = None
    end_date: str | None = None


class AdResponse(AdBase):
    id: int
    roas: float | None = None  # gmv / spend
    acos: float | None = None  # spend / gmv
    aov: float | None = None   # gmv / orders
    cpa: float | None = None   # spend / orders
    tacos: float | None = None # spend / total_sales

    class Config:
        from_attributes = True


class AdsImportResponse(BaseModel):
    store_id: str
    rows_imported: int
    rows_skipped: int
    total_spend: float
    total_gmv: float
    summary: str
