"""
Store Model - Toko di marketplace
"""
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Store(Base):
    __tablename__ = "stores"

    id = Column(String, primary_key=True, index=True)
    marketplace_id = Column(String, ForeignKey("marketplaces.id"), nullable=False)
    name = Column(String, nullable=False)

    # Relationships
    marketplace = relationship("Marketplace", back_populates="stores")
    store_products = relationship("StoreProduct", back_populates="store", cascade="all, delete-orphan")
    marketplace_costs = relationship("StoreMarketplaceCost", back_populates="store", cascade="all, delete-orphan")
    ads = relationship("Ad", back_populates="store", cascade="all, delete-orphan")
