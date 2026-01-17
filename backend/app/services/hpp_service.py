"""
HPP (Harga Pokok Penjualan) Service
Handles cost of goods sold calculations
"""
from sqlalchemy.orm import Session
from typing import Optional
from ..models import Product, BOM, Material, ProductExtraCost
from ..schemas.hpp import HPPResponse, BOMDetail
from ..schemas.product_extra_cost import ProductExtraCostResponse


class HPPService:
    """Service untuk menghitung HPP produk"""
    
    @staticmethod
    def calculate_hpp(db: Session, product_id: str, user_id: int) -> Optional[HPPResponse]:
        """
        Menghitung HPP untuk produk tertentu
        
        HPP = total_bahan + biaya_lain + sum(extra_costs)
        total_bahan = sum(qty * harga_satuan untuk setiap bahan dalam BOM)
        
        Args:
            db: Database session
            product_id: ID produk
            user_id: ID user saat ini
            
        Returns:
            HPPResponse atau None jika produk tidak ditemukan atau bukan milik user
        """
        # Get product
        product = db.query(Product).filter(
            Product.id == product_id,
            Product.user_id == user_id
        ).first()
        if not product:
            return None
        
        # Get BOM items with materials
        bom_items = db.query(BOM).filter(
            BOM.product_id == product_id,
            BOM.user_id == user_id
        ).all()
        
        bom_details = []
        total_bahan = 0.0
        
        for bom in bom_items:
            material = db.query(Material).filter(
                Material.id == bom.material_id,
                Material.user_id == user_id
            ).first()
            if material:
                biaya_bahan = bom.qty * material.harga_satuan
                total_bahan += biaya_bahan
                
                bom_details.append(BOMDetail(
                    material_id=material.id,
                    material_nama=material.nama,
                    material_satuan=material.satuan,
                    qty=bom.qty,
                    harga_satuan=material.harga_satuan,
                    biaya_bahan=biaya_bahan
                ))
        
        # Get extra costs
        extra_costs_items = db.query(ProductExtraCost).filter(
            ProductExtraCost.product_id == product_id,
            ProductExtraCost.user_id == user_id
        ).all()
        extra_costs_responses = [ProductExtraCostResponse.from_orm(ec) for ec in extra_costs_items]
        total_extra = sum(ec.value for ec in extra_costs_items)
        
        total_biaya_lain = total_extra
        hpp = total_bahan + total_biaya_lain
        
        return HPPResponse(
            product_id=product.id,
            product_nama=product.nama,
            bom_details=bom_details,
            extra_costs=extra_costs_responses,
            total_bahan=total_bahan,
            biaya_lain=total_biaya_lain,
            hpp=hpp
        )
    
    @staticmethod
    def get_hpp_value(db: Session, product_id: str, user_id: int) -> float:
        """
        Get simple HPP value (number only)
        
        Args:
            db: Database session
            product_id: ID produk
            user_id: ID user saat ini
            
        Returns:
            HPP value or 0 if product not found or unauthorized
        """
        result = HPPService.calculate_hpp(db, product_id, user_id)
        return result.hpp if result else 0
