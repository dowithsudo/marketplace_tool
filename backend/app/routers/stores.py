from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Store, Marketplace, User
from ..schemas.store import StoreCreate, StoreUpdate, StoreResponse
from ..deps import get_current_user

router = APIRouter(prefix="/stores", tags=["Stores"])


@router.post("", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
def create_store(
    store: StoreCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new store"""
    # Validate marketplace exists for this user
    marketplace = db.query(Marketplace).filter(
        Marketplace.id == store.marketplace_id,
        Marketplace.user_id == current_user.id
    ).first()
    if not marketplace:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Marketplace tidak ditemukan"
        )
    
    existing = db.query(Store).filter(
        Store.id == store.id,
        Store.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Store '{store.id}' sudah ada"
        )
    
    db_store = Store(
        id=store.id,
        user_id=current_user.id,
        marketplace_id=store.marketplace_id,
        name=store.name
    )
    
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return _build_store_response(db_store, marketplace)


@router.get("", response_model=List[StoreResponse])
def get_stores(
    marketplace_id: str = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all stores for current user"""
    query = db.query(Store).filter(Store.user_id == current_user.id)
    if marketplace_id:
        query = query.filter(Store.marketplace_id == marketplace_id)
    
    stores = query.all()
    responses = []
    for store in stores:
        marketplace = db.query(Marketplace).filter(
            Marketplace.id == store.marketplace_id,
            Marketplace.user_id == current_user.id
        ).first()
        responses.append(_build_store_response(store, marketplace))
    return responses


@router.get("/{store_id}", response_model=StoreResponse)
def get_store(
    store_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific store"""
    store = db.query(Store).filter(
        Store.id == store_id,
        Store.user_id == current_user.id
    ).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store tidak ditemukan"
        )
    
    marketplace = db.query(Marketplace).filter(
        Marketplace.id == store.marketplace_id,
        Marketplace.user_id == current_user.id
    ).first()
    return _build_store_response(store, marketplace)


@router.put("/{store_id}", response_model=StoreResponse)
def update_store(
    store_id: str, 
    store: StoreUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a store"""
    db_store = db.query(Store).filter(
        Store.id == store_id,
        Store.user_id == current_user.id
    ).first()
    if not db_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store tidak ditemukan"
        )
    
    if store.name is not None:
        db_store.name = store.name
    
    db.commit()
    db.refresh(db_store)
    
    marketplace = db.query(Marketplace).filter(
        Marketplace.id == db_store.marketplace_id,
        Marketplace.user_id == current_user.id
    ).first()
    return _build_store_response(db_store, marketplace)


@router.delete("/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_store(
    store_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a store"""
    db_store = db.query(Store).filter(
        Store.id == store_id,
        Store.user_id == current_user.id
    ).first()
    if not db_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store tidak ditemukan"
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

