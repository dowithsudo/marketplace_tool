"""
StoreMarketplaceCosts Router - CRUD operations for store-specific costs
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import StoreMarketplaceCost, Store, MarketplaceCostType
from ..schemas.store_marketplace_cost import StoreMarketplaceCostCreate, StoreMarketplaceCostUpdate, StoreMarketplaceCostResponse

router = APIRouter(prefix="/store-marketplace-costs", tags=["Store Marketplace Costs"])


@router.post("", response_model=StoreMarketplaceCostResponse, status_code=status.HTTP_201_CREATED)
def create_store_cost(cost: StoreMarketplaceCostCreate, db: Session = Depends(get_db)):
    """Create a new store marketplace cost"""
    # Validate store exists
    store = db.query(Store).filter(Store.id == cost.store_id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Store dengan ID '{cost.store_id}' tidak ditemukan"
        )
    
    # Validate cost type exists
    cost_type = db.query(MarketplaceCostType).filter(MarketplaceCostType.id == cost.cost_type_id).first()
    if not cost_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cost type dengan ID '{cost.cost_type_id}' tidak ditemukan"
        )
    
    # Check for duplicate
    existing = db.query(StoreMarketplaceCost).filter(
        StoreMarketplaceCost.store_id == cost.store_id,
        StoreMarketplaceCost.cost_type_id == cost.cost_type_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Store cost untuk store '{cost.store_id}' dan cost type '{cost.cost_type_id}' sudah ada"
        )
    
    db_cost = StoreMarketplaceCost(
        store_id=cost.store_id,
        cost_type_id=cost.cost_type_id,
        value=cost.value
    )
    
    db.add(db_cost)
    db.commit()
    db.refresh(db_cost)
    
    return _build_cost_response(db_cost, cost_type)


@router.get("", response_model=List[StoreMarketplaceCostResponse])
def get_store_costs(store_id: str = None, db: Session = Depends(get_db)):
    """Get all store costs, optionally filtered by store"""
    query = db.query(StoreMarketplaceCost)
    if store_id:
        query = query.filter(StoreMarketplaceCost.store_id == store_id)
    
    costs = query.all()
    
    responses = []
    for cost in costs:
        cost_type = db.query(MarketplaceCostType).filter(MarketplaceCostType.id == cost.cost_type_id).first()
        responses.append(_build_cost_response(cost, cost_type))
    
    return responses


@router.get("/{cost_id}", response_model=StoreMarketplaceCostResponse)
def get_store_cost(cost_id: int, db: Session = Depends(get_db)):
    """Get a specific store cost by ID"""
    cost = db.query(StoreMarketplaceCost).filter(StoreMarketplaceCost.id == cost_id).first()
    if not cost:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store cost dengan ID '{cost_id}' tidak ditemukan"
        )
    
    cost_type = db.query(MarketplaceCostType).filter(MarketplaceCostType.id == cost.cost_type_id).first()
    return _build_cost_response(cost, cost_type)


@router.put("/{cost_id}", response_model=StoreMarketplaceCostResponse)
def update_store_cost(cost_id: int, cost: StoreMarketplaceCostUpdate, db: Session = Depends(get_db)):
    """Update a store cost"""
    db_cost = db.query(StoreMarketplaceCost).filter(StoreMarketplaceCost.id == cost_id).first()
    if not db_cost:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store cost dengan ID '{cost_id}' tidak ditemukan"
        )
    
    if cost.store_id is not None:
        store = db.query(Store).filter(Store.id == cost.store_id).first()
        if not store:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Store dengan ID '{cost.store_id}' tidak ditemukan"
            )
        db_cost.store_id = cost.store_id
    
    if cost.cost_type_id is not None:
        cost_type = db.query(MarketplaceCostType).filter(MarketplaceCostType.id == cost.cost_type_id).first()
        if not cost_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cost type dengan ID '{cost.cost_type_id}' tidak ditemukan"
            )
        db_cost.cost_type_id = cost.cost_type_id
    
    if cost.value is not None:
        db_cost.value = cost.value
    
    db.commit()
    db.refresh(db_cost)
    
    cost_type = db.query(MarketplaceCostType).filter(MarketplaceCostType.id == db_cost.cost_type_id).first()
    return _build_cost_response(db_cost, cost_type)


@router.delete("/{cost_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_store_cost(cost_id: int, db: Session = Depends(get_db)):
    """Delete a store cost"""
    db_cost = db.query(StoreMarketplaceCost).filter(StoreMarketplaceCost.id == cost_id).first()
    if not db_cost:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store cost dengan ID '{cost_id}' tidak ditemukan"
        )
    
    db.delete(db_cost)
    db.commit()


def _build_cost_response(cost: StoreMarketplaceCost, cost_type: MarketplaceCostType) -> StoreMarketplaceCostResponse:
    """Helper to build cost response"""
    return StoreMarketplaceCostResponse(
        id=cost.id,
        store_id=cost.store_id,
        cost_type_id=cost.cost_type_id,
        value=cost.value,
        cost_type_name=cost_type.name if cost_type else None,
        calc_type=cost_type.calc_type if cost_type else None,
        apply_to=cost_type.apply_to if cost_type else None
    )
