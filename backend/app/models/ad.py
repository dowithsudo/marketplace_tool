"""
Ad Model - Data iklan untuk analisis GMV dan ROAS
"""
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Ad(Base):
    __tablename__ = "ads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    store_id = Column(String, ForeignKey("stores.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    campaign = Column(String, nullable=True)
    spend = Column(Integer, nullable=False)
    gmv = Column(Integer, nullable=False)
    orders = Column(Integer, nullable=False)

    # Relationships
    store = relationship("Store", back_populates="ads")
    product = relationship("Product", back_populates="ads")
