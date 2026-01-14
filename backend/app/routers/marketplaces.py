"""
Marketplaces Router - CRUD operations for marketplaces
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Marketplace
from ..schemas.marketplace import MarketplaceCreate, MarketplaceUpdate, MarketplaceResponse

router = APIRouter(prefix="/marketplaces", tags=["Marketplaces"])


@router.post("", response_model=MarketplaceResponse, status_code=status.HTTP_201_CREATED)
def create_marketplace(marketplace: MarketplaceCreate, db: Session = Depends(get_db)):
    """Create a new marketplace"""
    existing = db.query(Marketplace).filter(Marketplace.id == marketplace.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Marketplace dengan ID '{marketplace.id}' sudah ada"
        )
    
    db_marketplace = Marketplace(
        id=marketplace.id,
        name=marketplace.name
    )
    
    db.add(db_marketplace)
    db.commit()
    db.refresh(db_marketplace)
    
    return db_marketplace


@router.get("", response_model=List[MarketplaceResponse])
def get_marketplaces(db: Session = Depends(get_db)):
    """Get all marketplaces"""
    return db.query(Marketplace).all()


@router.get("/{marketplace_id}", response_model=MarketplaceResponse)
def get_marketplace(marketplace_id: str, db: Session = Depends(get_db)):
    """Get a specific marketplace by ID"""
    marketplace = db.query(Marketplace).filter(Marketplace.id == marketplace_id).first()
    if not marketplace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Marketplace dengan ID '{marketplace_id}' tidak ditemukan"
        )
    return marketplace


@router.put("/{marketplace_id}", response_model=MarketplaceResponse)
def update_marketplace(marketplace_id: str, marketplace: MarketplaceUpdate, db: Session = Depends(get_db)):
    """Update a marketplace"""
    db_marketplace = db.query(Marketplace).filter(Marketplace.id == marketplace_id).first()
    if not db_marketplace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Marketplace dengan ID '{marketplace_id}' tidak ditemukan"
        )
    
    if marketplace.name is not None:
        db_marketplace.name = marketplace.name
    
    db.commit()
    db.refresh(db_marketplace)
    
    return db_marketplace


@router.delete("/{marketplace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_marketplace(marketplace_id: str, db: Session = Depends(get_db)):
    """Delete a marketplace (cascades to stores)"""
    db_marketplace = db.query(Marketplace).filter(Marketplace.id == marketplace_id).first()
    if not db_marketplace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Marketplace dengan ID '{marketplace_id}' tidak ditemukan"
        )
    
    db.delete(db_marketplace)
    db.commit()
