"""
Pricing Router - Forward and reverse pricing calculations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.pricing import (
    PricingCalcRequest, PricingCalcResponse,
    ReversePricingRequest, ReversePricingResponse
)
from ..services.pricing_service import PricingService

router = APIRouter(prefix="/pricing", tags=["Pricing"])


@router.post("/calc", response_model=PricingCalcResponse)
def calculate_forward_pricing(request: PricingCalcRequest, db: Session = Depends(get_db)):
    """Calculate forward pricing for a store product."""
    result = PricingService.calculate_forward_pricing(db, request.store_product_id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store product dengan ID '{request.store_product_id}' tidak ditemukan"
        )
    
    return result


@router.post("/reverse", response_model=ReversePricingResponse)
def calculate_reverse_pricing(request: ReversePricingRequest, db: Session = Depends(get_db)):
    """Calculate reverse pricing to find minimum selling price."""
    result = PricingService.calculate_reverse_pricing(db, request)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store atau product tidak ditemukan"
        )
    
    return result
