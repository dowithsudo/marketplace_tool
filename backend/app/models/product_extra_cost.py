from sqlalchemy import Column, Integer, String, Float, ForeignKey, ForeignKeyConstraint
from sqlalchemy.orm import relationship
from ..database import Base


class ProductExtraCost(Base):
    __tablename__ = "product_extra_costs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    product_id = Column(String, nullable=False)
    label = Column(String, nullable=False)  # e.g. "Overhead", "Packing"
    value = Column(Float, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(['product_id', 'user_id'], ['products.id', 'products.user_id']),
        ForeignKeyConstraint(['user_id'], ['users.id']),
    )

    # Relationships
    product = relationship("Product", back_populates="extra_costs")
