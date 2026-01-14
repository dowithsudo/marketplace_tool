from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)

    # Relationships (Optional: if you want to access user's data from user object)
    materials = relationship("Material", back_populates="user", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="user", cascade="all, delete-orphan")
    marketplaces = relationship("Marketplace", back_populates="user", cascade="all, delete-orphan")
    stores = relationship("Store", back_populates="user", cascade="all, delete-orphan")
    marketplace_cost_types = relationship("MarketplaceCostType", back_populates="user", cascade="all, delete-orphan")
