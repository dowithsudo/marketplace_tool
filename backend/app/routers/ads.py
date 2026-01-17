"""
Ads Router - CRUD operations for advertising data
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from ..database import get_db
from ..models import Ad, Store, Product, ProductPerformance, User
from ..schemas.ad import AdCreate, AdUpdate, AdResponse
from ..deps import get_current_user

router = APIRouter(prefix="/ads", tags=["Ads"])


@router.post("", response_model=AdResponse, status_code=status.HTTP_201_CREATED)
def create_ad(
    ad: AdCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new ad record"""
    store = db.query(Store).filter(
        Store.id == ad.store_id,
        Store.user_id == current_user.id
    ).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Store dengan ID '{ad.store_id}' tidak ditemukan"
        )
    
    product = db.query(Product).filter(
        Product.id == ad.product_id,
        Product.user_id == current_user.id
    ).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product dengan ID '{ad.product_id}' tidak ditemukan"
        )
    
    db_ad = Ad(
        **ad.model_dump(),
        user_id=current_user.id
    )
    db.add(db_ad)
    db.commit()
    db.refresh(db_ad)
    
    return _build_ad_response(db_ad, db)


@router.get("", response_model=List[AdResponse])
def get_ads(
    store_id: str = None, 
    product_id: str = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get ads for current user with optional filtering"""
    query = db.query(Ad).filter(Ad.user_id == current_user.id)
    if store_id:
        query = query.filter(Ad.store_id == store_id)
    if product_id:
        query = query.filter(Ad.product_id == product_id)
    
    return [_build_ad_response(ad, db) for ad in query.all()]


@router.get("/{ad_id}", response_model=AdResponse)
def get_ad(
    ad_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific ad by ID"""
    ad = db.query(Ad).filter(
        Ad.id == ad_id,
        Ad.user_id == current_user.id
    ).first()
    if not ad:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ad tidak ditemukan")
    return _build_ad_response(ad, db)


@router.put("/{ad_id}", response_model=AdResponse)
def update_ad(
    ad_id: int, 
    ad: AdUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an ad"""
    db_ad = db.query(Ad).filter(
        Ad.id == ad_id,
        Ad.user_id == current_user.id
    ).first()
    if not db_ad:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ad tidak ditemukan")
    
    for key, value in ad.model_dump(exclude_unset=True).items():
        setattr(db_ad, key, value)
    
    db.commit()
    db.refresh(db_ad)
    return _build_ad_response(db_ad, db)


@router.delete("/{ad_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ad(
    ad_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an ad"""
    db_ad = db.query(Ad).filter(
        Ad.id == ad_id,
        Ad.user_id == current_user.id
    ).first()
    if not db_ad:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ad tidak ditemukan")
    db.delete(db_ad)
    db.commit()


def _build_ad_response(ad: Ad, db: Session = None) -> AdResponse:
    """Build ad response with derived metrics"""
    roas = ad.gmv / ad.spend if ad.spend > 0 else None
    acos = ad.spend / ad.gmv if ad.gmv > 0 else None
    aov = ad.gmv / ad.orders if ad.orders > 0 else None
    cpa = ad.spend / ad.orders if ad.orders > 0 else None
    
    total_sales = ad.total_sales
    
    # If total_sales is not provided, try to find it in ProductPerformance
    if not total_sales and db:
        # Sum revenue for this product in this store (for today or recent period)
        # For simplicity, we take the most recent record or sum last 30 days
        perf_revenue = db.query(func.sum(ProductPerformance.revenue)).filter(
            ProductPerformance.product_id == ad.product_id,
            ProductPerformance.store_id == ad.store_id,
            ProductPerformance.user_id == ad.user_id
        ).scalar()
        if perf_revenue:
            total_sales = float(perf_revenue)

    tacos = None
    if total_sales and total_sales > 0:
        tacos = ad.spend / total_sales

    return AdResponse(
        id=ad.id, store_id=ad.store_id, product_id=ad.product_id,
        campaign=ad.campaign, spend=ad.spend, gmv=ad.gmv, orders=ad.orders,
        total_sales=total_sales,
        roas=round(roas, 2) if roas else None,
        acos=round(acos, 4) if acos else None,
        aov=round(aov, 2) if aov else None,
        cpa=round(cpa, 2) if cpa else None,
        tacos=round(tacos, 4) if tacos else None
    )
