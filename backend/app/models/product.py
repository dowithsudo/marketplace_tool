"""
Product Model - Produk dengan biaya tambahan
"""
from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
from ..database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    nama = Column(String, nullable=False)
    biaya_lain = Column(Integer, default=0)  # Biaya produksi tambahan per produk

    # Relationships
    bom_items = relationship("BOM", back_populates="product", cascade="all, delete-orphan")
    store_products = relationship("StoreProduct", back_populates="product", cascade="all, delete-orphan")
    ads = relationship("Ad", back_populates="product", cascade="all, delete-orphan")
