from sqlalchemy import Column, String, Integer, ForeignKey, ForeignKeyConstraint
from sqlalchemy.orm import relationship
from ..database import Base


class Store(Base):
    __tablename__ = "stores"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    marketplace_id = Column(String, nullable=False)
    name = Column(String, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(['marketplace_id', 'user_id'], ['marketplaces.id', 'marketplaces.user_id']),
    )

    # Relationships
    user = relationship("User", back_populates="stores")
    marketplace = relationship("Marketplace", back_populates="stores")
    store_products = relationship("StoreProduct", back_populates="store", cascade="all, delete-orphan", overlaps="store_products")
    ads = relationship("Ad", back_populates="store", cascade="all, delete-orphan", overlaps="ads")
