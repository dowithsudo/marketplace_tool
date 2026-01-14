"""
Decision & Grading Service
Handles product viability grading and alerts
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from ..models import Store, Product, StoreProduct, Ad
from ..schemas.decision import DecisionResponse, Alert
from .hpp_service import HPPService
from .pricing_service import PricingService


class DecisionService:
    """Service untuk grading dan rekomendasi keputusan"""
    
    # Grading thresholds
    MARGIN_THRESHOLD_LOW = 5      # Below 5% margin is risky
    MARGIN_THRESHOLD_GOOD = 15    # Above 15% margin is viable
    MARGIN_THRESHOLD_SCALE = 25   # Above 25% margin is scalable
    
    ROAS_THRESHOLD_WARNING = 2.0  # ROAS below 2 is concerning
    
    @staticmethod
    def get_decision(db: Session, store_id: str, product_id: str) -> Optional[DecisionResponse]:
        """
        Mendapatkan keputusan/grading untuk produk di toko tertentu
        
        Grading:
        - NOT_VIABLE: profit_per_order < 0
        - RISKY: profit_per_order > 0 tapi margin < 5%
        - VIABLE: margin 5-25%
        - SCALABLE: margin > 25%, profit stabil, ROAS bagus
        
        Args:
            db: Database session
            store_id: ID toko
            product_id: ID produk
            
        Returns:
            DecisionResponse dengan grade dan alerts
        """
        # Get store and product
        store = db.query(Store).filter(Store.id == store_id).first()
        product = db.query(Product).filter(Product.id == product_id).first()
        
        if not store or not product:
            return None
        
        # Get store_product
        store_product = db.query(StoreProduct).filter(
            StoreProduct.store_id == store_id,
            StoreProduct.product_id == product_id
        ).first()
        
        if not store_product:
            return None
        
        # Get pricing info
        pricing = PricingService.calculate_forward_pricing(db, store_product.id)
        if not pricing:
            return None
        
        harga_jual = pricing.harga_jual
        hpp = pricing.hpp
        profit_per_order = pricing.profit_per_order
        margin_percent = pricing.margin_percent
        
        # Calculate break-even metrics
        # Break-even ROAS = harga_jual / profit_per_order
        # Max CPA = profit_per_order
        break_even_roas = (harga_jual / profit_per_order) if profit_per_order > 0 else float('inf')
        max_cpa = profit_per_order if profit_per_order > 0 else 0
        
        # Get ads data
        ads = db.query(Ad).filter(
            Ad.store_id == store_id,
            Ad.product_id == product_id
        ).all()
        
        has_ads_data = len(ads) > 0
        total_ads_spend = None
        total_gmv = None
        total_orders = None
        roas = None
        cpa = None
        ads_profit_total = None
        ads_profit_per_order = None
        
        if has_ads_data:
            total_ads_spend = sum(ad.spend for ad in ads)
            total_gmv = sum(ad.gmv for ad in ads)
            total_orders = sum(ad.orders for ad in ads)
            
            if total_ads_spend > 0:
                roas = total_gmv / total_ads_spend
            if total_orders > 0:
                cpa = total_ads_spend / total_orders
                
                # Calculate ads profit
                # profit_total = gmv - (HPP * orders) - total_biaya_marketplace*orders - spend
                total_cost_per_order = hpp + pricing.total_biaya_marketplace
                ads_profit_total = total_gmv - (total_cost_per_order * total_orders) - total_ads_spend
                ads_profit_per_order = ads_profit_total / total_orders
        
        # Determine grade
        grade, grade_reason = DecisionService._calculate_grade(
            profit_per_order, margin_percent, roas, break_even_roas, ads_profit_per_order
        )
        
        # Generate alerts
        alerts = DecisionService._generate_alerts(
            profit_per_order, margin_percent, roas, break_even_roas, cpa, max_cpa, ads_profit_per_order
        )
        
        return DecisionResponse(
            store_id=store_id,
            product_id=product_id,
            product_name=product.nama,
            store_name=store.name,
            harga_jual=harga_jual,
            hpp=hpp,
            profit_per_order=profit_per_order,
            margin_percent=margin_percent,
            has_ads_data=has_ads_data,
            total_ads_spend=total_ads_spend,
            total_gmv=total_gmv,
            total_orders=total_orders,
            roas=round(roas, 2) if roas else None,
            cpa=round(cpa, 2) if cpa else None,
            ads_profit_total=round(ads_profit_total, 2) if ads_profit_total else None,
            ads_profit_per_order=round(ads_profit_per_order, 2) if ads_profit_per_order else None,
            grade=grade,
            grade_reason=grade_reason,
            alerts=alerts,
            break_even_roas=round(break_even_roas, 2) if break_even_roas != float('inf') else 999.99,
            max_cpa=round(max_cpa, 2)
        )
    
    @staticmethod
    def _calculate_grade(
        profit_per_order: float,
        margin_percent: float,
        roas: Optional[float],
        break_even_roas: float,
        ads_profit_per_order: Optional[float]
    ) -> tuple[str, str]:
        """Calculate grade based on metrics"""
        
        # Check if profitable at all
        if profit_per_order < 0:
            return "NOT_VIABLE", "Produk merugi per order tanpa iklan"
        
        # If has ads data, consider ads profitability
        if ads_profit_per_order is not None:
            if ads_profit_per_order < 0:
                return "NOT_VIABLE", "Produk merugi dengan iklan saat ini"
        
        # Check margin thresholds
        if margin_percent < DecisionService.MARGIN_THRESHOLD_LOW:
            return "RISKY", f"Margin terlalu tipis ({margin_percent:.1f}%)"
        
        # Check if ROAS is close to break-even
        if roas is not None and break_even_roas != float('inf'):
            if roas < break_even_roas * 1.2:  # Within 20% of break-even
                return "RISKY", f"ROAS ({roas:.2f}) mendekati break-even ({break_even_roas:.2f})"
        
        # Check for scalability
        if margin_percent >= DecisionService.MARGIN_THRESHOLD_SCALE:
            if roas is None or roas >= DecisionService.ROAS_THRESHOLD_WARNING:
                return "SCALABLE", f"Margin tinggi ({margin_percent:.1f}%) dengan performa baik"
        
        # Default to viable
        return "VIABLE", f"Produk profitable dengan margin {margin_percent:.1f}%"
    
    @staticmethod
    def _generate_alerts(
        profit_per_order: float,
        margin_percent: float,
        roas: Optional[float],
        break_even_roas: float,
        cpa: Optional[float],
        max_cpa: float,
        ads_profit_per_order: Optional[float]
    ) -> List[Alert]:
        """Generate alerts based on metrics"""
        alerts = []
        
        # Loss alert
        if profit_per_order < 0:
            alerts.append(Alert(
                level="danger",
                message=f"Produk merugi Rp {abs(profit_per_order):,.0f} per order tanpa iklan"
            ))
        
        # Margin alerts
        if 0 <= margin_percent < DecisionService.MARGIN_THRESHOLD_LOW:
            alerts.append(Alert(
                level="warning",
                message=f"Margin sangat tipis: {margin_percent:.1f}%"
            ))
        
        # ROAS alerts
        if roas is not None:
            if roas < break_even_roas:
                alerts.append(Alert(
                    level="danger",
                    message=f"ROAS ({roas:.2f}) di bawah break-even ({break_even_roas:.2f}). Iklan merugi!"
                ))
            elif roas < break_even_roas * 1.3:
                alerts.append(Alert(
                    level="warning",
                    message=f"ROAS ({roas:.2f}) mendekati break-even ({break_even_roas:.2f})"
                ))
        
        # CPA alerts
        if cpa is not None and max_cpa > 0:
            if cpa > max_cpa:
                alerts.append(Alert(
                    level="danger",
                    message=f"CPA (Rp {cpa:,.0f}) melebihi Max CPA (Rp {max_cpa:,.0f})"
                ))
            elif cpa > max_cpa * 0.8:
                alerts.append(Alert(
                    level="warning",
                    message=f"CPA (Rp {cpa:,.0f}) mendekati batas Max CPA (Rp {max_cpa:,.0f})"
                ))
        
        # Ads profitability
        if ads_profit_per_order is not None:
            if ads_profit_per_order < 0:
                alerts.append(Alert(
                    level="danger",
                    message=f"Dengan iklan saat ini, produk rugi Rp {abs(ads_profit_per_order):,.0f} per order"
                ))
            elif ads_profit_per_order < profit_per_order * 0.5:
                alerts.append(Alert(
                    level="warning",
                    message="Iklan menggerus lebih dari 50% profit organik"
                ))
        
        # Info alerts
        if profit_per_order > 0 and len(alerts) == 0:
            if margin_percent >= DecisionService.MARGIN_THRESHOLD_SCALE:
                alerts.append(Alert(
                    level="info",
                    message="Produk ini layak untuk di-scale dengan iklan"
                ))
            elif margin_percent >= DecisionService.MARGIN_THRESHOLD_GOOD:
                alerts.append(Alert(
                    level="info",
                    message="Produk memiliki margin sehat untuk diiklankan"
                ))
        
        return alerts
