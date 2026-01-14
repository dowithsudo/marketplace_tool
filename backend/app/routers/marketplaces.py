from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Marketplace, User
from ..schemas.marketplace import MarketplaceCreate, MarketplaceUpdate, MarketplaceResponse
from ..deps import get_current_user

router = APIRouter(prefix="/marketplaces", tags=["Marketplaces"])


@router.post("", response_model=MarketplaceResponse, status_code=status.HTTP_201_CREATED)
def create_marketplace(
    marketplace: MarketplaceCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new marketplace"""
    existing = db.query(Marketplace).filter(
        Marketplace.id == marketplace.id,
        Marketplace.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Marketplace '{marketplace.id}' sudah ada"
        )
    
    db_marketplace = Marketplace(
        id=marketplace.id,
        user_id=current_user.id,
        name=marketplace.name
    )
    
    db.add(db_marketplace)
    db.commit()
    db.refresh(db_marketplace)
    return db_marketplace


@router.get("", response_model=List[MarketplaceResponse])
def get_marketplaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all marketplaces for current user"""
    return db.query(Marketplace).filter(Marketplace.user_id == current_user.id).all()


@router.get("/{marketplace_id}", response_model=MarketplaceResponse)
def get_marketplace(
    marketplace_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific marketplace"""
    marketplace = db.query(Marketplace).filter(
        Marketplace.id == marketplace_id,
        Marketplace.user_id == current_user.id
    ).first()
    if not marketplace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marketplace tidak ditemukan"
        )
    return marketplace


@router.put("/{marketplace_id}", response_model=MarketplaceResponse)
def update_marketplace(
    marketplace_id: str, 
    marketplace: MarketplaceUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a marketplace"""
    db_marketplace = db.query(Marketplace).filter(
        Marketplace.id == marketplace_id,
        Marketplace.user_id == current_user.id
    ).first()
    if not db_marketplace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marketplace tidak ditemukan"
        )
    
    if marketplace.name is not None:
        db_marketplace.name = marketplace.name
    
    db.commit()
    db_marketplace.refresh(db_marketplace)
    return db_marketplace


@router.delete("/{marketplace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_marketplace(
    marketplace_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a marketplace"""
    db_marketplace = db.query(Marketplace).filter(
        Marketplace.id == marketplace_id,
        Marketplace.user_id == current_user.id
    ).first()
    if not db_marketplace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marketplace tidak ditemukan"
        )
    
    db.delete(db_marketplace)
    db.commit()

