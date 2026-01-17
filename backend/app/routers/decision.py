"""
Decision Router - Product viability grading and alerts
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.decision import DecisionResponse
from ..services.decision_service import DecisionService

from ..deps import get_current_user
from ..models import User

router = APIRouter(prefix="/decision", tags=["Decision & Grading"])


@router.get("/{store_id}/{product_id}", response_model=DecisionResponse)
def get_decision(
    store_id: str, 
    product_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get viability grading for a product in a store.
    
    Returns:
    - Grade: NOT_VIABLE, RISKY, VIABLE, or SCALABLE
    - Detailed metrics
    - Alerts and recommendations
    """
    result = DecisionService.get_decision(db, store_id, product_id, current_user.id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store, product, atau store_product tidak ditemukan"
        )
    
    return result
