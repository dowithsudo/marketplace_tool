from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    nama = Column(String, nullable=False)

    # Relationships
    user = relationship("User", back_populates="products")
    bom_items = relationship("BOM", back_populates="product", cascade="all, delete-orphan", overlaps="bom_items")
    store_products = relationship("StoreProduct", back_populates="product", cascade="all, delete-orphan", overlaps="store_products")
    ads = relationship("Ad", back_populates="product", cascade="all, delete-orphan", overlaps="ads")
    extra_costs = relationship("ProductExtraCost", back_populates="product", cascade="all, delete-orphan")
