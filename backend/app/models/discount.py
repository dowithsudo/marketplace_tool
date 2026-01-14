from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    store_product_id = Column(Integer, ForeignKey("store_products.id"), nullable=False)
    discount_type = Column(String, nullable=False)  # 'percent' atau 'fixed'
    value = Column(Float, nullable=False)

    # Relationships
    store_product = relationship("StoreProduct", back_populates="discounts")
