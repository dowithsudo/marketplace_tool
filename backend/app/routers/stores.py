"""
Stores Router - CRUD operations for stores
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Store, Marketplace
from ..schemas.store import StoreCreate, StoreUpdate, StoreResponse

router = APIRouter(prefix="/stores", tags=["Stores"])


@router.post("", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
def create_store(store: StoreCreate, db: Session = Depends(get_db)):
    """Create a new store"""
    # Validate marketplace exists
    marketplace = db.query(Marketplace).filter(Marketplace.id == store.marketplace_id).first()
    if not marketplace:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Marketplace dengan ID '{store.marketplace_id}' tidak ditemukan"
        )
    
    existing = db.query(Store).filter(Store.id == store.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Store dengan ID '{store.id}' sudah ada"
        )
    
    db_store = Store(
        id=store.id,
        marketplace_id=store.marketplace_id,
        name=store.name
    )
    
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    
    return _build_store_response(db_store, marketplace)


@router.get("", response_model=List[StoreResponse])
def get_stores(marketplace_id: str = None, db: Session = Depends(get_db)):
    """Get all stores, optionally filtered by marketplace"""
    query = db.query(Store)
    if marketplace_id:
        query = query.filter(Store.marketplace_id == marketplace_id)
    
    stores = query.all()
    
    responses = []
    for store in stores:
        marketplace = db.query(Marketplace).filter(Marketplace.id == store.marketplace_id).first()
        responses.append(_build_store_response(store, marketplace))
    
    return responses


@router.get("/{store_id}", response_model=StoreResponse)
def get_store(store_id: str, db: Session = Depends(get_db)):
    """Get a specific store by ID"""
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store dengan ID '{store_id}' tidak ditemukan"
        )
    
    marketplace = db.query(Marketplace).filter(Marketplace.id == store.marketplace_id).first()
    return _build_store_response(store, marketplace)


@router.put("/{store_id}", response_model=StoreResponse)
def update_store(store_id: str, store: StoreUpdate, db: Session = Depends(get_db)):
    """Update a store"""
    db_store = db.query(Store).filter(Store.id == store_id).first()
    if not db_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store dengan ID '{store_id}' tidak ditemukan"
        )
    
    if store.marketplace_id is not None:
        marketplace = db.query(Marketplace).filter(Marketplace.id == store.marketplace_id).first()
        if not marketplace:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Marketplace dengan ID '{store.marketplace_id}' tidak ditemukan"
            )
        db_store.marketplace_id = store.marketplace_id
    
    if store.name is not None:
        db_store.name = store.name
    
    db.commit()
    db.refresh(db_store)
    
    marketplace = db.query(Marketplace).filter(Marketplace.id == db_store.marketplace_id).first()
    return _build_store_response(db_store, marketplace)


@router.delete("/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_store(store_id: str, db: Session = Depends(get_db)):
    """Delete a store (cascades to store_products and marketplace_costs)"""
    db_store = db.query(Store).filter(Store.id == store_id).first()
    if not db_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store dengan ID '{store_id}' tidak ditemukan"
        )
    
    db.delete(db_store)
    db.commit()


def _build_store_response(store: Store, marketplace: Marketplace) -> StoreResponse:
    """Helper to build store response with marketplace info"""
    return StoreResponse(
        id=store.id,
        marketplace_id=store.marketplace_id,
        name=store.name,
        marketplace_name=marketplace.name if marketplace else None
    )
