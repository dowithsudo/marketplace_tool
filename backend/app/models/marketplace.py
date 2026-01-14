from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Marketplace(Base):
    __tablename__ = "marketplaces"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    name = Column(String, nullable=False)

    # Relationships
    user = relationship("User", back_populates="marketplaces")
    stores = relationship("Store", back_populates="marketplace", cascade="all, delete-orphan")
