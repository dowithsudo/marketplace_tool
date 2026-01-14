"""
BOM (Bill of Materials) Model - Relasi produk dengan bahan
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class BOM(Base):
    __tablename__ = "bom"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    material_id = Column(String, ForeignKey("materials.id"), nullable=False)
    qty = Column(Float, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="bom_items")
    material = relationship("Material", back_populates="bom_items")
