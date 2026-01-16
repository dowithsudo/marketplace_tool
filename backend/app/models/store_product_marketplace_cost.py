from sqlalchemy import Column, Integer, String, Float, ForeignKey, ForeignKeyConstraint
from sqlalchemy.orm import relationship
from ..database import Base


class StoreProductMarketplaceCost(Base):
    __tablename__ = "store_product_marketplace_costs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    store_product_id = Column(Integer, nullable=False)
    cost_type_id = Column(String, nullable=False)
    value = Column(Float, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(['store_product_id', 'user_id'], ['store_products.id', 'store_products.user_id']),
        ForeignKeyConstraint(['cost_type_id', 'user_id'], ['marketplace_cost_types.id', 'marketplace_cost_types.user_id']),
        ForeignKeyConstraint(['user_id'], ['users.id']),
    )

    # Relationships
    store_product = relationship("StoreProduct", back_populates="marketplace_costs")
    cost_type = relationship("MarketplaceCostType", back_populates="store_product_costs")
