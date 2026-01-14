"""
Pricing Service
Handles forward and reverse pricing calculations
"""
from sqlalchemy.orm import Session
from typing import Optional, List
from ..models import StoreProduct, Store, Product, Discount, StoreMarketplaceCost, MarketplaceCostType
from ..schemas.pricing import (
    PricingCalcResponse, CostBreakdown,
    ReversePricingRequest, ReversePricingResponse
)
from .hpp_service import HPPService


class PricingService:
    """Service untuk kalkulasi pricing"""
    
    @staticmethod
    def calculate_forward_pricing(db: Session, store_product_id: int) -> Optional[PricingCalcResponse]:
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
            
        Returns:
            PricingCalcResponse atau None jika tidak ditemukan
        """
        # Get store_product with relationships
        store_product = db.query(StoreProduct).filter(StoreProduct.id == store_product_id).first()
        if not store_product:
            return None
        
        store = db.query(Store).filter(Store.id == store_product.store_id).first()
        product = db.query(Product).filter(Product.id == store_product.product_id).first()
        
        if not store or not product:
            return None
        
        harga_jual = store_product.harga_jual
        
        # Calculate discounts
        discounts = db.query(Discount).filter(Discount.store_product_id == store_product_id).all()
        total_diskon = 0.0
        for disc in discounts:
            if disc.discount_type == "percent":
                total_diskon += harga_jual * disc.value
            else:  # fixed
                total_diskon += disc.value
        
        harga_setelah_diskon = harga_jual - total_diskon
        
        # Calculate marketplace costs
        store_costs = db.query(StoreMarketplaceCost).filter(StoreMarketplaceCost.store_id == store.id).all()
        
        cost_breakdown = []
        total_biaya_marketplace = 0.0
        
        for sc in store_costs:
            cost_type = db.query(MarketplaceCostType).filter(MarketplaceCostType.id == sc.cost_type_id).first()
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
        hpp = HPPService.get_hpp_value(db, product.id)
        
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
    def calculate_reverse_pricing(db: Session, request: ReversePricingRequest) -> Optional[ReversePricingResponse]:
        """
        Menghitung reverse pricing untuk mencari harga jual minimum
        
        Args:
            db: Database session
            request: ReversePricingRequest dengan store_id, product_id, target_type, target_value
            
        Returns:
            ReversePricingResponse dengan recommended_price
        """
        # Validate store and product exist
        store = db.query(Store).filter(Store.id == request.store_id).first()
        product = db.query(Product).filter(Product.id == request.product_id).first()
        
        if not store or not product:
            return None
        
        # Get HPP
        hpp = HPPService.get_hpp_value(db, product.id)
        
        # Get marketplace costs for this store
        store_costs = db.query(StoreMarketplaceCost).filter(StoreMarketplaceCost.store_id == store.id).all()
        cost_types = {}
        for sc in store_costs:
            cost_type = db.query(MarketplaceCostType).filter(MarketplaceCostType.id == sc.cost_type_id).first()
            if cost_type:
                cost_types[sc.cost_type_id] = {
                    "calc_type": cost_type.calc_type,
                    "apply_to": cost_type.apply_to,
                    "value": sc.value
                }
        
        # Iterative search for minimum price
        # Start from HPP and iterate upward
        start_price = int(hpp) if hpp > 0 else 1000
        max_price = start_price * 10  # Upper limit
        step = 100  # Price step
        
        recommended_price = 0
        expected_profit = 0.0
        
        for price in range(start_price, max_price, step):
            # Calculate costs at this price (assuming no discount for reverse pricing)
            total_marketplace_cost = 0.0
            
            for ct_id, ct_info in cost_types.items():
                if ct_info["calc_type"] == "percent":
                    if ct_info["apply_to"] == "price":
                        total_marketplace_cost += price * ct_info["value"]
                    else:  # after_discount (same as price for reverse pricing)
                        total_marketplace_cost += price * ct_info["value"]
                else:  # fixed
                    total_marketplace_cost += ct_info["value"]
            
            # Calculate profit at this price
            profit = price - total_marketplace_cost - hpp
            
            # Check if target met
            target_met = False
            if request.target_type == "fixed":
                target_met = profit >= request.target_value
            else:  # percent
                margin = (profit / price) if price > 0 else 0
                target_met = margin >= request.target_value
            
            if target_met:
                recommended_price = price
                expected_profit = profit
                break
        
        if recommended_price == 0:
            # Target not achievable within range, return max price
            recommended_price = max_price
            total_marketplace_cost = 0.0
            for ct_id, ct_info in cost_types.items():
                if ct_info["calc_type"] == "percent":
                    total_marketplace_cost += max_price * ct_info["value"]
                else:
                    total_marketplace_cost += ct_info["value"]
            expected_profit = max_price - total_marketplace_cost - hpp
        
        expected_margin_percent = (expected_profit / recommended_price * 100) if recommended_price > 0 else 0
        
        # Calculate break-even ROAS and max CPA
        # Break-even ROAS = harga_jual / profit_per_order (when spend = profit)
        # Max CPA = profit_per_order (max you can spend per acquisition)
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
