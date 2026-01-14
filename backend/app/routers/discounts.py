"""
Discounts Router - CRUD operations for discounts
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Discount, StoreProduct
from ..schemas.discount import DiscountCreate, DiscountUpdate, DiscountResponse

router = APIRouter(prefix="/discounts", tags=["Discounts"])


@router.post("", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def create_discount(discount: DiscountCreate, db: Session = Depends(get_db)):
    """Create a new discount"""
    # Validate store_product exists
    sp = db.query(StoreProduct).filter(StoreProduct.id == discount.store_product_id).first()
    if not sp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Store product dengan ID '{discount.store_product_id}' tidak ditemukan"
        )
    
    db_discount = Discount(
        store_product_id=discount.store_product_id,
        discount_type=discount.discount_type,
        value=discount.value
    )
    
    db.add(db_discount)
    db.commit()
    db.refresh(db_discount)
    
    return db_discount


@router.get("", response_model=List[DiscountResponse])
def get_discounts(store_product_id: int = None, db: Session = Depends(get_db)):
    """Get all discounts, optionally filtered by store_product"""
    query = db.query(Discount)
    if store_product_id:
        query = query.filter(Discount.store_product_id == store_product_id)
    
    return query.all()


@router.get("/{discount_id}", response_model=DiscountResponse)
def get_discount(discount_id: int, db: Session = Depends(get_db)):
    """Get a specific discount by ID"""
    discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discount dengan ID '{discount_id}' tidak ditemukan"
        )
    return discount


@router.put("/{discount_id}", response_model=DiscountResponse)
def update_discount(discount_id: int, discount: DiscountUpdate, db: Session = Depends(get_db)):
    """Update a discount"""
    db_discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not db_discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discount dengan ID '{discount_id}' tidak ditemukan"
        )
    
    if discount.store_product_id is not None:
        sp = db.query(StoreProduct).filter(StoreProduct.id == discount.store_product_id).first()
        if not sp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Store product dengan ID '{discount.store_product_id}' tidak ditemukan"
            )
        db_discount.store_product_id = discount.store_product_id
    
    if discount.discount_type is not None:
        db_discount.discount_type = discount.discount_type
    
    if discount.value is not None:
        db_discount.value = discount.value
    
    db.commit()
    db.refresh(db_discount)
    
    return db_discount


@router.delete("/{discount_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discount(discount_id: int, db: Session = Depends(get_db)):
    """Delete a discount"""
    db_discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not db_discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discount dengan ID '{discount_id}' tidak ditemukan"
        )
    
    db.delete(db_discount)
    db.commit()
