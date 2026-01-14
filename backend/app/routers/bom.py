from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import BOM, Product, Material, User
from ..schemas.bom import BOMCreate, BOMUpdate, BOMResponse
from ..deps import get_current_user

router = APIRouter(prefix="/bom", tags=["BOM"])


@router.post("", response_model=BOMResponse, status_code=status.HTTP_201_CREATED)
def create_bom(
    bom: BOMCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new BOM entry"""
    # Validate product exists for this user
    product = db.query(Product).filter(
        Product.id == bom.product_id,
        Product.user_id == current_user.id
    ).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product tidak ditemukan"
        )
    
    # Validate material exists for this user
    material = db.query(Material).filter(
        Material.id == bom.material_id,
        Material.user_id == current_user.id
    ).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Material tidak ditemukan"
        )
    
    # Check for duplicate entry
    existing = db.query(BOM).filter(
        BOM.product_id == bom.product_id,
        BOM.material_id == bom.material_id,
        BOM.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="BOM entry sudah ada"
        )
    
    db_bom = BOM(
        product_id=bom.product_id,
        material_id=bom.material_id,
        user_id=current_user.id,
        qty=bom.qty
    )
    
    db.add(db_bom)
    db.commit()
    db.refresh(db_bom)
    
    return _build_bom_response(db_bom, material)


@router.get("/{product_id}", response_model=List[BOMResponse])
def get_bom_by_product(
    product_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all BOM entries for a product for current user"""
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == current_user.id
    ).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product tidak ditemukan"
        )
    
    bom_items = db.query(BOM).filter(
        BOM.product_id == product_id,
        BOM.user_id == current_user.id
    ).all()
    
    responses = []
    for bom in bom_items:
        material = db.query(Material).filter(
            Material.id == bom.material_id,
            Material.user_id == current_user.id
        ).first()
        responses.append(_build_bom_response(bom, material))
    
    return responses


@router.put("/{bom_id}", response_model=BOMResponse)
def update_bom(
    bom_id: int, 
    bom: BOMUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a BOM entry"""
    db_bom = db.query(BOM).filter(
        BOM.id == bom_id,
        BOM.user_id == current_user.id
    ).first()
    if not db_bom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BOM tidak ditemukan"
        )
    
    if bom.qty is not None:
        db_bom.qty = bom.qty
    
    db.commit()
    db.refresh(db_bom)
    
    material = db.query(Material).filter(
        Material.id == db_bom.material_id,
        Material.user_id == current_user.id
    ).first()
    return _build_bom_response(db_bom, material)


@router.delete("/{bom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bom(
    bom_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a BOM entry"""
    db_bom = db.query(BOM).filter(
        BOM.id == bom_id,
        BOM.user_id == current_user.id
    ).first()
    if not db_bom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BOM tidak ditemukan"
        )
    
    db.delete(db_bom)
    db.commit()


def _build_bom_response(bom: BOM, material: Material) -> BOMResponse:
    """Helper to build BOM response with material info"""
    return BOMResponse(
        id=bom.id,
        product_id=bom.product_id,
        material_id=bom.material_id,
        qty=bom.qty,
        material_nama=material.nama if material else None,
        material_satuan=material.satuan if material else None,
        material_harga_satuan=material.harga_satuan if material else None,
        biaya_bahan=bom.qty * material.harga_satuan if material else None
    )

