from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import ProductExtraCost, Product, User
from ..schemas.product_extra_cost import ProductExtraCostCreate, ProductExtraCostUpdate, ProductExtraCostResponse
from ..deps import get_current_user

router = APIRouter(prefix="/extra-costs", tags=["Extra Costs"])


@router.post("", response_model=ProductExtraCostResponse, status_code=status.HTTP_201_CREATED)
def create_extra_cost(
    extra_cost: ProductExtraCostCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new extra cost for a product"""
    # Validate product exists for this user
    product = db.query(Product).filter(
        Product.id == extra_cost.product_id,
        Product.user_id == current_user.id
    ).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product tidak ditemukan"
        )
    
    db_extra_cost = ProductExtraCost(
        product_id=extra_cost.product_id,
        user_id=current_user.id,
        label=extra_cost.label,
        value=extra_cost.value
    )
    
    db.add(db_extra_cost)
    db.commit()
    db.refresh(db_extra_cost)
    return db_extra_cost


@router.get("/{product_id}", response_model=List[ProductExtraCostResponse])
def get_extra_costs_by_product(
    product_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all extra costs for a product"""
    return db.query(ProductExtraCost).filter(
        ProductExtraCost.product_id == product_id,
        ProductExtraCost.user_id == current_user.id
    ).all()


@router.put("/{cost_id}", response_model=ProductExtraCostResponse)
def update_extra_cost(
    cost_id: int, 
    extra_cost: ProductExtraCostUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an extra cost entry"""
    db_cost = db.query(ProductExtraCost).filter(
        ProductExtraCost.id == cost_id,
        ProductExtraCost.user_id == current_user.id
    ).first()
    
    if not db_cost:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Biaya tidak ditemukan"
        )
    
    if extra_cost.label is not None:
        db_cost.label = extra_cost.label
    if extra_cost.value is not None:
        db_cost.value = extra_cost.value
        
    db.commit()
    db.refresh(db_cost)
    return db_cost


@router.delete("/{cost_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_extra_cost(
    cost_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an extra cost entry"""
    db_cost = db.query(ProductExtraCost).filter(
        ProductExtraCost.id == cost_id,
        ProductExtraCost.user_id == current_user.id
    ).first()
    
    if not db_cost:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Biaya tidak ditemukan"
        )
    
    db.delete(db_cost)
    db.commit()
