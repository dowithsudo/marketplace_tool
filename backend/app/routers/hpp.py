"""
HPP Router - Cost of Goods Sold calculations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.hpp import HPPResponse
from ..services.hpp_service import HPPService
from ..deps import get_current_user
from ..models import User

router = APIRouter(prefix="/hpp", tags=["HPP"])


@router.get("/{product_id}", response_model=HPPResponse)
def calculate_hpp(
    product_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculate HPP for a product"""
    result = HPPService.calculate_hpp(db, product_id, current_user.id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product dengan ID '{product_id}' tidak ditemukan"
        )
    
    return result
