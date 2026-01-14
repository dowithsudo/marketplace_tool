"""
MarketplaceCostType Model - Tipe biaya marketplace yang dinamis
"""
from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from ..database import Base


class MarketplaceCostType(Base):
    __tablename__ = "marketplace_cost_types"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    calc_type = Column(String, nullable=False)  # 'percent' atau 'fixed'
    apply_to = Column(String, nullable=False)   # 'price' atau 'after_discount'

    # Relationships
    store_costs = relationship("StoreMarketplaceCost", back_populates="cost_type", cascade="all, delete-orphan")
