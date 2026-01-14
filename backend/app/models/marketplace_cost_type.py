from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class MarketplaceCostType(Base):
    __tablename__ = "marketplace_cost_types"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    name = Column(String, nullable=False)
    calc_type = Column(String, nullable=False)  # 'percent' atau 'fixed'
    apply_to = Column(String, nullable=False)   # 'price' atau 'after_discount'

    # Relationships
    user = relationship("User", back_populates="marketplace_cost_types")
    store_costs = relationship("StoreMarketplaceCost", back_populates="cost_type", cascade="all, delete-orphan", overlaps="store_costs")
