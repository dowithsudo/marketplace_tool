from sqlalchemy import Column, Integer, String, ForeignKey, ForeignKeyConstraint
from sqlalchemy.orm import relationship
from ..database import Base


class Ad(Base):
    __tablename__ = "ads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    store_id = Column(String, nullable=False)
    product_id = Column(String, nullable=False)
    campaign = Column(String, nullable=True)
    spend = Column(Integer, nullable=False)
    gmv = Column(Integer, nullable=False)
    orders = Column(Integer, nullable=False)
    total_sales = Column(Integer, nullable=True, default=0)  # Total sales (organic + ads) for TACoS

    __table_args__ = (
        ForeignKeyConstraint(['store_id', 'user_id'], ['stores.id', 'stores.user_id']),
        ForeignKeyConstraint(['product_id', 'user_id'], ['products.id', 'products.user_id']),
        ForeignKeyConstraint(['user_id'], ['users.id']),
    )

    # Relationships
    store = relationship("Store", back_populates="ads", overlaps="ads")
    product = relationship("Product", back_populates="ads", overlaps="ads")
