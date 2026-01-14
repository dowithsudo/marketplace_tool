"""
StoreProduct Model - Produk di toko dengan harga spesifik
"""
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class StoreProduct(Base):
    __tablename__ = "store_products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    store_id = Column(String, ForeignKey("stores.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    harga_jual = Column(Integer, nullable=False)

    # Relationships
    store = relationship("Store", back_populates="store_products")
    product = relationship("Product", back_populates="store_products")
    discounts = relationship("Discount", back_populates="store_product", cascade="all, delete-orphan")
