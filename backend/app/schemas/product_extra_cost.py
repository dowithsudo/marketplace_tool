from pydantic import BaseModel, Field


class ProductExtraCostBase(BaseModel):
    label: str = Field(..., min_length=1, description="Nama biaya (misal: Packing, Overhead)")
    value: float = Field(..., ge=0, description="Nilai biaya")


class ProductExtraCostCreate(ProductExtraCostBase):
    product_id: str


class ProductExtraCostUpdate(BaseModel):
    label: str | None = Field(None, min_length=1)
    value: float | None = Field(None, ge=0)


class ProductExtraCostResponse(ProductExtraCostBase):
    id: int
    product_id: str

    class Config:
        from_attributes = True
