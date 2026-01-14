"""
StoreProducts Router - CRUD operations for store-specific products
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import StoreProduct, Store, Product
from ..schemas.store_product import StoreProductCreate, StoreProductUpdate, StoreProductResponse

router = APIRouter(prefix="/store-products", tags=["Store Products"])


@router.post("", response_model=StoreProductResponse, status_code=status.HTTP_201_CREATED)
def create_store_product(store_product: StoreProductCreate, db: Session = Depends(get_db)):
    """Create a new store product"""
    # Validate store exists
    store = db.query(Store).filter(Store.id == store_product.store_id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Store dengan ID '{store_product.store_id}' tidak ditemukan"
        )
    
    # Validate product exists
    product = db.query(Product).filter(Product.id == store_product.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product dengan ID '{store_product.product_id}' tidak ditemukan"
        )
    
    # Check for duplicate
    existing = db.query(StoreProduct).filter(
        StoreProduct.store_id == store_product.store_id,
        StoreProduct.product_id == store_product.product_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Store product untuk store '{store_product.store_id}' dan product '{store_product.product_id}' sudah ada"
        )
    
    db_store_product = StoreProduct(
        store_id=store_product.store_id,
        product_id=store_product.product_id,
        harga_jual=store_product.harga_jual
    )
    
    db.add(db_store_product)
    db.commit()
    db.refresh(db_store_product)
    
    return _build_store_product_response(db_store_product, store, product)


@router.get("", response_model=List[StoreProductResponse])
def get_store_products(store_id: str = None, product_id: str = None, db: Session = Depends(get_db)):
    """Get store products with optional filtering"""
    query = db.query(StoreProduct)
    if store_id:
        query = query.filter(StoreProduct.store_id == store_id)
    if product_id:
        query = query.filter(StoreProduct.product_id == product_id)
    
    store_products = query.all()
    
    responses = []
    for sp in store_products:
        store = db.query(Store).filter(Store.id == sp.store_id).first()
        product = db.query(Product).filter(Product.id == sp.product_id).first()
        responses.append(_build_store_product_response(sp, store, product))
    
    return responses


@router.get("/{store_product_id}", response_model=StoreProductResponse)
def get_store_product(store_product_id: int, db: Session = Depends(get_db)):
    """Get a specific store product by ID"""
    sp = db.query(StoreProduct).filter(StoreProduct.id == store_product_id).first()
    if not sp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store product dengan ID '{store_product_id}' tidak ditemukan"
        )
    
    store = db.query(Store).filter(Store.id == sp.store_id).first()
    product = db.query(Product).filter(Product.id == sp.product_id).first()
    return _build_store_product_response(sp, store, product)


@router.put("/{store_product_id}", response_model=StoreProductResponse)
def update_store_product(store_product_id: int, store_product: StoreProductUpdate, db: Session = Depends(get_db)):
    """Update a store product"""
    db_sp = db.query(StoreProduct).filter(StoreProduct.id == store_product_id).first()
    if not db_sp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store product dengan ID '{store_product_id}' tidak ditemukan"
        )
    
    if store_product.store_id is not None:
        store = db.query(Store).filter(Store.id == store_product.store_id).first()
        if not store:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Store dengan ID '{store_product.store_id}' tidak ditemukan"
            )
        db_sp.store_id = store_product.store_id
    
    if store_product.product_id is not None:
        product = db.query(Product).filter(Product.id == store_product.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product dengan ID '{store_product.product_id}' tidak ditemukan"
            )
        db_sp.product_id = store_product.product_id
    
    if store_product.harga_jual is not None:
        db_sp.harga_jual = store_product.harga_jual
    
    db.commit()
    db.refresh(db_sp)
    
    store = db.query(Store).filter(Store.id == db_sp.store_id).first()
    product = db.query(Product).filter(Product.id == db_sp.product_id).first()
    return _build_store_product_response(db_sp, store, product)


@router.delete("/{store_product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_store_product(store_product_id: int, db: Session = Depends(get_db)):
    """Delete a store product"""
    db_sp = db.query(StoreProduct).filter(StoreProduct.id == store_product_id).first()
    if not db_sp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store product dengan ID '{store_product_id}' tidak ditemukan"
        )
    
    db.delete(db_sp)
    db.commit()


def _build_store_product_response(sp: StoreProduct, store: Store, product: Product) -> StoreProductResponse:
    """Helper to build store product response"""
    return StoreProductResponse(
        id=sp.id,
        store_id=sp.store_id,
        product_id=sp.product_id,
        harga_jual=sp.harga_jual,
        store_name=store.name if store else None,
        product_name=product.nama if product else None
    )
