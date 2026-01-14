from sqlalchemy import Column, Integer, String, ForeignKey, ForeignKeyConstraint
from sqlalchemy.orm import relationship
from ..database import Base


class StoreProduct(Base):
    __tablename__ = "store_products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    store_id = Column(String, nullable=False)
    product_id = Column(String, nullable=False)
    harga_jual = Column(Integer, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(['store_id', 'user_id'], ['stores.id', 'stores.user_id']),
        ForeignKeyConstraint(['product_id', 'user_id'], ['products.id', 'products.user_id']),
        ForeignKeyConstraint(['user_id'], ['users.id']),
    )

    # Relationships
    store = relationship("Store", back_populates="store_products")
    product = relationship("Product", back_populates="store_products")
    discounts = relationship("Discount", back_populates="store_product", cascade="all, delete-orphan")
