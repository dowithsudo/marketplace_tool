from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Product, User
from ..schemas.product import ProductCreate, ProductUpdate, ProductResponse
from ..deps import get_current_user

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product: ProductCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new product"""
    existing = db.query(Product).filter(
        Product.id == product.id,
        Product.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product dengan ID '{product.id}' sudah ada"
        )
    
    db_product = Product(
        id=product.id,
        user_id=current_user.id,
        nama=product.nama,
    )
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.get("", response_model=List[ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all products for current user with BOM items"""
    from ..models import BOM, Material
    from ..schemas.product import BOMItem
    
    products = db.query(Product).filter(Product.user_id == current_user.id).all()
    
    # Populate BOM items for each product
    result = []
    for product in products:
        # Get BOM items for this product
        bom_items = db.query(BOM).filter(
            BOM.product_id == product.id,
            BOM.user_id == current_user.id
        ).all()
        
        # Build BOM item responses with material info
        bom_responses = []
        total_hpp = 0
        for bom in bom_items:
            material = db.query(Material).filter(
                Material.id == bom.material_id,
                Material.user_id == current_user.id
            ).first()
            
            biaya_bahan = bom.qty * material.harga_satuan if material else 0
            total_hpp += biaya_bahan
            
            bom_responses.append(BOMItem(
                id=bom.id,
                material_id=bom.material_id,
                qty=bom.qty,
                material_nama=material.nama if material else None,
                material_harga_satuan=material.harga_satuan if material else None,
                biaya_bahan=biaya_bahan
            ))
        
        # Create product response with BOM items
        product_dict = {
            "id": product.id,
            "nama": product.nama,
            "bom_items": bom_responses,
            "hpp": total_hpp if total_hpp > 0 else None
        }
        result.append(ProductResponse(**product_dict))
    
    return result


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific product"""
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == current_user.id
    ).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product tidak ditemukan"
        )
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str, 
    product: ProductUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a product"""
    db_product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == current_user.id
    ).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product tidak ditemukan"
        )
    
    if product.nama is not None:
        db_product.nama = product.nama
    
    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a product"""
    db_product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == current_user.id
    ).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product tidak ditemukan"
        )
    
    db.delete(db_product)
    db.commit()

