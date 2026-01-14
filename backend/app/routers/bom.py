"""
BOM Router - CRUD operations for Bill of Materials
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import BOM, Product, Material
from ..schemas.bom import BOMCreate, BOMUpdate, BOMResponse

router = APIRouter(prefix="/bom", tags=["BOM"])


@router.post("", response_model=BOMResponse, status_code=status.HTTP_201_CREATED)
def create_bom(bom: BOMCreate, db: Session = Depends(get_db)):
    """Create a new BOM entry"""
    # Validate product exists
    product = db.query(Product).filter(Product.id == bom.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product dengan ID '{bom.product_id}' tidak ditemukan"
        )
    
    # Validate material exists
    material = db.query(Material).filter(Material.id == bom.material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Material dengan ID '{bom.material_id}' tidak ditemukan"
        )
    
    # Check for duplicate entry
    existing = db.query(BOM).filter(
        BOM.product_id == bom.product_id,
        BOM.material_id == bom.material_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"BOM entry untuk product '{bom.product_id}' dan material '{bom.material_id}' sudah ada"
        )
    
    db_bom = BOM(
        product_id=bom.product_id,
        material_id=bom.material_id,
        qty=bom.qty
    )
    
    db.add(db_bom)
    db.commit()
    db.refresh(db_bom)
    
    # Build response with material info
    return _build_bom_response(db_bom, material)


@router.get("/{product_id}", response_model=List[BOMResponse])
def get_bom_by_product(product_id: str, db: Session = Depends(get_db)):
    """Get all BOM entries for a product"""
    # Validate product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product dengan ID '{product_id}' tidak ditemukan"
        )
    
    bom_items = db.query(BOM).filter(BOM.product_id == product_id).all()
    
    responses = []
    for bom in bom_items:
        material = db.query(Material).filter(Material.id == bom.material_id).first()
        responses.append(_build_bom_response(bom, material))
    
    return responses


@router.put("/{bom_id}", response_model=BOMResponse)
def update_bom(bom_id: int, bom: BOMUpdate, db: Session = Depends(get_db)):
    """Update a BOM entry"""
    db_bom = db.query(BOM).filter(BOM.id == bom_id).first()
    if not db_bom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BOM dengan ID '{bom_id}' tidak ditemukan"
        )
    
    # Validate new product if provided
    if bom.product_id is not None:
        product = db.query(Product).filter(Product.id == bom.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product dengan ID '{bom.product_id}' tidak ditemukan"
            )
        db_bom.product_id = bom.product_id
    
    # Validate new material if provided
    if bom.material_id is not None:
        material = db.query(Material).filter(Material.id == bom.material_id).first()
        if not material:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Material dengan ID '{bom.material_id}' tidak ditemukan"
            )
        db_bom.material_id = bom.material_id
    
    if bom.qty is not None:
        db_bom.qty = bom.qty
    
    db.commit()
    db.refresh(db_bom)
    
    material = db.query(Material).filter(Material.id == db_bom.material_id).first()
    return _build_bom_response(db_bom, material)


@router.delete("/{bom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bom(bom_id: int, db: Session = Depends(get_db)):
    """Delete a BOM entry"""
    db_bom = db.query(BOM).filter(BOM.id == bom_id).first()
    if not db_bom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BOM dengan ID '{bom_id}' tidak ditemukan"
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
