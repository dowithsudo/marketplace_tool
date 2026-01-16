"""
StoreProductMarketplaceCosts Router - CRUD operations for product-specific marketplace costs
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import StoreProductMarketplaceCost, StoreProduct, MarketplaceCostType, User
from ..schemas.store_product_marketplace_cost import (
    StoreProductMarketplaceCostCreate, 
    StoreProductMarketplaceCostUpdate, 
    StoreProductMarketplaceCostResponse
)
from ..deps import get_current_user

router = APIRouter(prefix="/store-product-marketplace-costs", tags=["Store Product Marketplace Costs"])


@router.post("", response_model=StoreProductMarketplaceCostResponse, status_code=status.HTTP_201_CREATED)
def create_product_cost(
    cost: StoreProductMarketplaceCostCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new product-specific marketplace cost"""
    # Validate store product exists for this user
    sp = db.query(StoreProduct).filter(
        StoreProduct.id == cost.store_product_id,
        StoreProduct.user_id == current_user.id
    ).first()
    if not sp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Store Product dengan ID '{cost.store_product_id}' tidak ditemukan"
        )
    
    # Validate cost type exists for this user
    cost_type = db.query(MarketplaceCostType).filter(
        MarketplaceCostType.id == cost.cost_type_id,
        MarketplaceCostType.user_id == current_user.id
    ).first()
    if not cost_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cost type dengan ID '{cost.cost_type_id}' tidak ditemukan"
        )
    
    # Check for duplicate
    existing = db.query(StoreProductMarketplaceCost).filter(
        StoreProductMarketplaceCost.store_product_id == cost.store_product_id,
        StoreProductMarketplaceCost.cost_type_id == cost.cost_type_id,
        StoreProductMarketplaceCost.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Fee '{(cost_type.name)}' sudah ada untuk produk ini"
        )
    
    db_cost = StoreProductMarketplaceCost(
        store_product_id=cost.store_product_id,
        cost_type_id=cost.cost_type_id,
        user_id=current_user.id,
        value=cost.value
    )
    
    db.add(db_cost)
    db.commit()
    db.refresh(db_cost)
    
    return _build_cost_response(db_cost, cost_type)


@router.get("", response_model=List[StoreProductMarketplaceCostResponse])
def get_product_costs(
    store_product_id: int = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all product costs for current user, optionally filtered by store_product"""
    query = db.query(StoreProductMarketplaceCost).filter(StoreProductMarketplaceCost.user_id == current_user.id)
    if store_product_id:
        query = query.filter(StoreProductMarketplaceCost.store_product_id == store_product_id)
    
    costs = query.all()
    
    responses = []
    for cost in costs:
        cost_type = db.query(MarketplaceCostType).filter(
            MarketplaceCostType.id == cost.cost_type_id,
            MarketplaceCostType.user_id == current_user.id
        ).first()
        responses.append(_build_cost_response(cost, cost_type))
    
    return responses


@router.put("/{cost_id}", response_model=StoreProductMarketplaceCostResponse)
def update_product_cost(
    cost_id: int, 
    cost: StoreProductMarketplaceCostUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a product marketplace cost"""
    db_cost = db.query(StoreProductMarketplaceCost).filter(
        StoreProductMarketplaceCost.id == cost_id,
        StoreProductMarketplaceCost.user_id == current_user.id
    ).first()
    if not db_cost:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product cost tidak ditemukan"
        )
    
    db_cost.value = cost.value
    
    db.commit()
    db.refresh(db_cost)
    
    cost_type = db.query(MarketplaceCostType).filter(
        MarketplaceCostType.id == db_cost.cost_type_id,
        MarketplaceCostType.user_id == current_user.id
    ).first()
    return _build_cost_response(db_cost, cost_type)


@router.delete("/{cost_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_cost(
    cost_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a product cost"""
    db_cost = db.query(StoreProductMarketplaceCost).filter(
        StoreProductMarketplaceCost.id == cost_id,
        StoreProductMarketplaceCost.user_id == current_user.id
    ).first()
    if not db_cost:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product cost tidak ditemukan"
        )
    
    db.delete(db_cost)
    db.commit()


def _build_cost_response(cost: StoreProductMarketplaceCost, cost_type: MarketplaceCostType) -> StoreProductMarketplaceCostResponse:
    """Helper to build cost response"""
    return StoreProductMarketplaceCostResponse(
        id=cost.id,
        user_id=cost.user_id,
        store_product_id=cost.store_product_id,
        cost_type_id=cost.cost_type_id,
        value=cost.value,
        cost_type_name=cost_type.name if cost_type else None,
        calc_type=cost_type.calc_type if cost_type else None,
        apply_to=cost_type.apply_to if cost_type else None
    )
