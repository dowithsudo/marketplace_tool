from sqlalchemy import Column, Integer, String, Float, ForeignKey, ForeignKeyConstraint
from sqlalchemy.orm import relationship
from ..database import Base


class BOM(Base):
    __tablename__ = "bom"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    product_id = Column(String, nullable=False)
    material_id = Column(String, nullable=False)
    qty = Column(Float, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(['product_id', 'user_id'], ['products.id', 'products.user_id']),
        ForeignKeyConstraint(['material_id', 'user_id'], ['materials.id', 'materials.user_id']),
        ForeignKeyConstraint(['user_id'], ['users.id']),
    )

    # Relationships
    product = relationship("Product", back_populates="bom_items")
    material = relationship("Material", back_populates="bom_items")
