"""
Material Model - Global bahan untuk perhitungan HPP
"""
from sqlalchemy import Column, String, Integer, Float
from sqlalchemy.orm import relationship
from ..database import Base


class Material(Base):
    __tablename__ = "materials"

    id = Column(String, primary_key=True, index=True)
    nama = Column(String, nullable=False)
    harga_total = Column(Integer, nullable=False)
    jumlah_unit = Column(Float, nullable=False)
    harga_satuan = Column(Float, nullable=False)  # Computed: harga_total / jumlah_unit
    satuan = Column(String, nullable=False)

    # Relationship
    bom_items = relationship("BOM", back_populates="material")
