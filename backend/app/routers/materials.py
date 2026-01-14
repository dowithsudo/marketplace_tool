from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Material, BOM, User
from ..schemas.material import MaterialCreate, MaterialUpdate, MaterialResponse
from ..deps import get_current_user

router = APIRouter(prefix="/materials", tags=["Materials"])


@router.post("", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
def create_material(
    material: MaterialCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new material"""
    # Check if ID already exists for THIS user
    existing = db.query(Material).filter(
        Material.id == material.id, 
        Material.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Material dengan ID '{material.id}' sudah ada"
        )
    
    # Calculate harga_satuan
    harga_satuan = material.harga_total / material.jumlah_unit
    
    db_material = Material(
        id=material.id,
        user_id=current_user.id,
        nama=material.nama,
        harga_total=material.harga_total,
        jumlah_unit=material.jumlah_unit,
        harga_satuan=harga_satuan,
        satuan=material.satuan
    )
    
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    
    return db_material


@router.get("", response_model=List[MaterialResponse])
def get_materials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all materials for current user"""
    return db.query(Material).filter(Material.user_id == current_user.id).all()


@router.get("/{material_id}", response_model=MaterialResponse)
def get_material(
    material_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific material for current user"""
    material = db.query(Material).filter(
        Material.id == material_id,
        Material.user_id == current_user.id
    ).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material tidak ditemukan"
        )
    return material


@router.put("/{material_id}", response_model=MaterialResponse)
def update_material(
    material_id: str, 
    material: MaterialUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a material"""
    db_material = db.query(Material).filter(
        Material.id == material_id,
        Material.user_id == current_user.id
    ).first()
    if not db_material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material tidak ditemukan"
        )
    
    if material.nama is not None:
        db_material.nama = material.nama
    if material.harga_total is not None:
        db_material.harga_total = material.harga_total
    if material.jumlah_unit is not None:
        db_material.jumlah_unit = material.jumlah_unit
    if material.satuan is not None:
        db_material.satuan = material.satuan
    
    db_material.harga_satuan = db_material.harga_total / db_material.jumlah_unit
    
    db.commit()
    db.refresh(db_material)
    return db_material


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(
    material_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a material"""
    db_material = db.query(Material).filter(
        Material.id == material_id,
        Material.user_id == current_user.id
    ).first()
    if not db_material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material tidak ditemukan"
        )
    
    # Check if used in any BOM (only current user's BOM)
    bom_usage = db.query(BOM).filter(
        BOM.material_id == material_id, 
        BOM.user_id == current_user.id
    ).first()
    if bom_usage:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Material masih digunakan di BOM"
        )
    
    db.delete(db_material)
    db.commit()

