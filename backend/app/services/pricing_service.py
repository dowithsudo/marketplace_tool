"""
Pricing Service
Handles forward and reverse pricing calculations
"""
from sqlalchemy.orm import Session
from typing import Optional, List
from ..models import StoreProduct, Store, Product, Discount, StoreProductMarketplaceCost, MarketplaceCostType
from ..schemas.pricing import (
    PricingCalcResponse, CostBreakdown,
    ReversePricingRequest, ReversePricingResponse
)
from .hpp_service import HPPService


class PricingService:
    """Service untuk kalkulasi pricing"""
    
    @staticmethod
    def calculate_forward_pricing(db: Session, store_product_id: int, user_id: int) -> Optional[PricingCalcResponse]:
        """
        Menghitung forward pricing untuk store_product
        
        Steps:
        1. Ambil harga_jual
        2. Hitung diskon total
        3. harga_setelah_diskon = harga_jual - diskon
        4. Hitung semua biaya marketplace
        5. profit_per_order = harga_setelah_diskon - total_biaya_marketplace - HPP
        
        Args:
            db: Database session
            store_product_id: ID store_product
            user_id: ID user saat ini
            
        Returns:
            PricingCalcResponse atau None jika tidak ditemukan atau unauthorized
        """
        # Get store_product with relationships
        store_product = db.query(StoreProduct).filter(
            StoreProduct.id == store_product_id,
            StoreProduct.user_id == user_id
        ).first()
        if not store_product:
            return None
        
        store = db.query(Store).filter(
            Store.id == store_product.store_id,
            Store.user_id == user_id
        ).first()
        product = db.query(Product).filter(
            Product.id == store_product.product_id,
            Product.user_id == user_id
        ).first()
        
        if not store or not product:
            return None
        
        harga_jual = store_product.harga_jual
        
        # Calculate discounts
        discounts = db.query(Discount).filter(
            Discount.store_product_id == store_product_id,
            Discount.user_id == user_id
        ).all()
        total_diskon = 0.0
        for disc in discounts:
            if disc.discount_type == "percent":
                total_diskon += harga_jual * disc.value
            else:  # fixed
                total_diskon += disc.value
        
        harga_setelah_diskon = harga_jual - total_diskon
        
        # Calculate marketplace costs (per product)
        sp_costs = db.query(StoreProductMarketplaceCost).filter(
            StoreProductMarketplaceCost.store_product_id == store_product_id,
            StoreProductMarketplaceCost.user_id == user_id
        ).all()
        
        cost_breakdown = []
        total_biaya_marketplace = 0.0
        
        for sc in sp_costs:
            cost_type = db.query(MarketplaceCostType).filter(
                MarketplaceCostType.id == sc.cost_type_id,
                MarketplaceCostType.user_id == user_id
            ).first()
            if cost_type:
                if cost_type.calc_type == "percent":
                    if cost_type.apply_to == "price":
                        calculated = harga_jual * sc.value
                    else:  # after_discount
                        calculated = harga_setelah_diskon * sc.value
                else:  # fixed
                    calculated = sc.value
                
                total_biaya_marketplace += calculated
                
                cost_breakdown.append(CostBreakdown(
                    cost_type_id=cost_type.id,
                    cost_type_name=cost_type.name,
                    calc_type=cost_type.calc_type,
                    apply_to=cost_type.apply_to,
                    value=sc.value,
                    calculated_cost=calculated
                ))
        
        # Get HPP
        hpp = HPPService.get_hpp_value(db, product.id, user_id)
        
        # Calculate profit
        profit_per_order = harga_setelah_diskon - total_biaya_marketplace - hpp
        margin_percent = (profit_per_order / harga_jual * 100) if harga_jual > 0 else 0
        
        return PricingCalcResponse(
            store_product_id=store_product_id,
            store_id=store.id,
            store_name=store.name,
            product_id=product.id,
            product_name=product.nama,
            harga_jual=harga_jual,
            total_diskon=total_diskon,
            harga_setelah_diskon=harga_setelah_diskon,
            hpp=hpp,
            biaya_marketplace_breakdown=cost_breakdown,
            total_biaya_marketplace=total_biaya_marketplace,
            profit_per_order=profit_per_order,
            margin_percent=margin_percent
        )
    
    @staticmethod
    def calculate_reverse_pricing(db: Session, request: ReversePricingRequest, user_id: int) -> Optional[ReversePricingResponse]:
        """
        Menghitung reverse pricing untuk mencari harga jual minimum
        
        Args:
            db: Database session
            request: ReversePricingRequest dengan store_id, product_id, target_type, target_value
            user_id: ID user saat ini
            
        Returns:
            ReversePricingResponse dengan recommended_price
        """
        # Validate store and product exist
        store = db.query(Store).filter(
            Store.id == request.store_id,
            Store.user_id == user_id
        ).first()
        product = db.query(Product).filter(
            Product.id == request.product_id,
            Product.user_id == user_id
        ).first()
        
        if not store or not product:
            return None
        
        # Get HPP
        hpp = HPPService.get_hpp_value(db, product.id, user_id)
        
        # Get marketplace costs for this specific product in this store
        # First find the store_product record
        store_product = db.query(StoreProduct).filter(
            StoreProduct.store_id == request.store_id,
            StoreProduct.product_id == request.product_id,
            StoreProduct.user_id == user_id
        ).first()
        
        cost_types = {}
        if store_product:
            sp_costs = db.query(StoreProductMarketplaceCost).filter(
                StoreProductMarketplaceCost.store_product_id == store_product.id,
                StoreProductMarketplaceCost.user_id == user_id
            ).all()
            for sc in sp_costs:
                cost_type = db.query(MarketplaceCostType).filter(
                    MarketplaceCostType.id == sc.cost_type_id,
                    MarketplaceCostType.user_id == user_id
                ).first()
                if cost_type:
                    cost_types[sc.cost_type_id] = {
                        "calc_type": cost_type.calc_type,
                        "apply_to": cost_type.apply_to,
                        "value": sc.value
                    }
        
        # Algebraic Calculation
        # P = X(1 - Cp) - Cf - HPP
        # For fixed target profit P: X = (P + Cf + HPP) / (1 - Cp)
        # For percentage target margin M: X = (Cf + HPP) / (1 - Cp - M)
        
        c_p = 0.0  # Sum of percentage coefficients
        c_f = 0.0  # Sum of fixed costs
        
        for ct_id, ct_info in cost_types.items():
            if ct_info["calc_type"] == "percent":
                c_p += ct_info["value"]
            else:
                c_f += ct_info["value"]
        
        recommended_price = 0
        
        if request.target_type == "fixed":
            # X = (P + Cf + HPP) / (1 - Cp)
            denominator = (1 - c_p)
            if denominator > 0:
                recommended_price = (request.target_value + c_f + hpp) / denominator
        else: # percent
            # X = (Cf + HPP) / (1 - Cp - M)
            denominator = (1 - c_p - request.target_value)
            if denominator > 0:
                recommended_price = (c_f + hpp) / denominator
        
        # Round up to nearest integer
        recommended_price = int(recommended_price + 0.99)
        
        # Calculate resulting profit and metrics
        total_marketplace_cost = (recommended_price * c_p) + c_f
        expected_profit = recommended_price - total_marketplace_cost - hpp
        expected_margin_percent = (expected_profit / recommended_price * 100) if recommended_price > 0 else 0
        
        # Break-even metrics
        break_even_roas = (recommended_price / expected_profit) if expected_profit > 0 else float('inf')
        max_cpa = expected_profit if expected_profit > 0 else 0
        
        return ReversePricingResponse(
            store_id=request.store_id,
            product_id=request.product_id,
            hpp=hpp,
            target_type=request.target_type,
            target_value=request.target_value,
            recommended_price=recommended_price,
            expected_profit=expected_profit,
            expected_margin_percent=expected_margin_percent,
            break_even_roas=round(break_even_roas, 2),
            max_cpa=round(max_cpa, 2)
        )
