from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, ForeignKeyConstraint
from sqlalchemy.orm import relationship
from ..database import Base


class StorePerformance(Base):
    __tablename__ = "store_performances"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    store_id = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    visitors = Column(Integer, default=0)
    orders = Column(Integer, default=0)
    revenue = Column(Float, default=0.0)
    conversion_rate = Column(Float, default=0.0)
    avg_order_value = Column(Float, default=0.0)

    __table_args__ = (
        ForeignKeyConstraint(['store_id', 'user_id'], ['stores.id', 'stores.user_id']),
        ForeignKeyConstraint(['user_id'], ['users.id']),
    )

    # Relationships
    store = relationship("Store", back_populates="performances")
