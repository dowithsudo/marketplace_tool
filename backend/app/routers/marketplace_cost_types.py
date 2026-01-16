"""
MarketplaceCostTypes Router - CRUD operations for cost type definitions
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import MarketplaceCostType, User
from ..schemas.marketplace_cost_type import MarketplaceCostTypeCreate, MarketplaceCostTypeUpdate, MarketplaceCostTypeResponse
from ..deps import get_current_user

router = APIRouter(prefix="/marketplace-cost-types", tags=["Marketplace Cost Types"])


@router.post("", response_model=MarketplaceCostTypeResponse, status_code=status.HTTP_201_CREATED)
def create_cost_type(
    cost_type: MarketplaceCostTypeCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new marketplace cost type"""
    existing = db.query(MarketplaceCostType).filter(
        MarketplaceCostType.id == cost_type.id,
        MarketplaceCostType.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cost type dengan ID '{cost_type.id}' sudah ada"
        )
    
    db_cost_type = MarketplaceCostType(
        id=cost_type.id,
        user_id=current_user.id,
        name=cost_type.name,
        calc_type=cost_type.calc_type,
        apply_to=cost_type.apply_to
    )
    
    db.add(db_cost_type)
    db.commit()
    db.refresh(db_cost_type)
    
    return db_cost_type


@router.get("", response_model=List[MarketplaceCostTypeResponse])
def get_cost_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all marketplace cost types for current user. Auto-seeds defaults if empty."""
    cost_types = db.query(MarketplaceCostType).filter(MarketplaceCostType.user_id == current_user.id).all()
    
    if not cost_types:
        # Seed defaults
        defaults = [
            MarketplaceCostType(
                id="fee-admin", 
                user_id=current_user.id, 
                name="Biaya Admin", 
                calc_type="percent", 
                apply_to="price"
            ),
            MarketplaceCostType(
                id="fee-layanan", 
                user_id=current_user.id, 
                name="Biaya Layanan", 
                calc_type="fixed", 
                apply_to="after_discount"
            )
        ]
        for d in defaults:
            db.add(d)
        db.commit()
        cost_types = db.query(MarketplaceCostType).filter(MarketplaceCostType.user_id == current_user.id).all()
        
    return cost_types


@router.get("/{cost_type_id}", response_model=MarketplaceCostTypeResponse)
def get_cost_type(
    cost_type_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific cost type by ID"""
    cost_type = db.query(MarketplaceCostType).filter(
        MarketplaceCostType.id == cost_type_id,
        MarketplaceCostType.user_id == current_user.id
    ).first()
    if not cost_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cost type dengan ID '{cost_type_id}' tidak ditemukan"
        )
    return cost_type


@router.put("/{cost_type_id}", response_model=MarketplaceCostTypeResponse)
def update_cost_type(
    cost_type_id: str, 
    cost_type: MarketplaceCostTypeUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a cost type"""
    db_cost_type = db.query(MarketplaceCostType).filter(
        MarketplaceCostType.id == cost_type_id,
        MarketplaceCostType.user_id == current_user.id
    ).first()
    if not db_cost_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cost type dengan ID '{cost_type_id}' tidak ditemukan"
        )
    
    if cost_type.name is not None:
        db_cost_type.name = cost_type.name
    if cost_type.calc_type is not None:
        db_cost_type.calc_type = cost_type.calc_type
    if cost_type.apply_to is not None:
        db_cost_type.apply_to = cost_type.apply_to
    
    db.commit()
    db.refresh(db_cost_type)
    
    return db_cost_type


@router.delete("/{cost_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cost_type(
    cost_type_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a cost type (cascades to store costs)"""
    db_cost_type = db.query(MarketplaceCostType).filter(
        MarketplaceCostType.id == cost_type_id,
        MarketplaceCostType.user_id == current_user.id
    ).first()
    if not db_cost_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cost type dengan ID '{cost_type_id}' tidak ditemukan"
        )
    
    db.delete(db_cost_type)
    db.commit()
