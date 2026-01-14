"""
Marketplace Model - Platform marketplace (Shopee, Tokopedia, dll)
"""
from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from ..database import Base


class Marketplace(Base):
    __tablename__ = "marketplaces"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)

    # Relationships
    stores = relationship("Store", back_populates="marketplace", cascade="all, delete-orphan")
