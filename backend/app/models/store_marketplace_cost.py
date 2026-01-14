"""
StoreMarketplaceCost Model - Biaya marketplace per toko
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class StoreMarketplaceCost(Base):
    __tablename__ = "store_marketplace_costs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    store_id = Column(String, ForeignKey("stores.id"), nullable=False)
    cost_type_id = Column(String, ForeignKey("marketplace_cost_types.id"), nullable=False)
    value = Column(Float, nullable=False)

    # Relationships
    store = relationship("Store", back_populates="marketplace_costs")
    cost_type = relationship("MarketplaceCostType", back_populates="store_costs")
