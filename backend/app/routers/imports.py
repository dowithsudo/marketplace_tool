from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import pandas as pd
import io
from datetime import datetime, date
from typing import List
import hashlib

from ..database import get_db
from ..models import Store, StorePerformance, ProductPerformance, Product, User, SalesReport
from ..schemas.store_performance import (
    SalesImportResponse, 
    StorePerformanceResponse, 
    ProductSalesImportResponse,
    SalesReportResponse
)
from ..deps import get_current_user

router = APIRouter(prefix="/imports", tags=["Imports & Sales Reports"])

@router.post("/shopee-sales", response_model=SalesImportResponse)
async def import_shopee_sales(
    store_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import Shopee Business Insight (Sales Overview) Excel file.
    """
    # Validate store
    store = db.query(Store).filter(
        Store.id == store_id,
        Store.user_id == current_user.id
    ).first()
    
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store tidak ditemukan"
        )

    # Read Excel and Calculate Hash
    try:
        contents = await file.read()
        file_hash = hashlib.sha256(contents).hexdigest()
        
        # Check if file hash already exists
        duplicate_hash = db.query(SalesReport).filter(
            SalesReport.file_hash == file_hash,
            SalesReport.user_id == current_user.id
        ).first()
        
        if duplicate_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File ini sudah pernah di-upload sebelumnya (ID Laporan: {duplicate_hash.id})"
            )

        df = pd.read_excel(io.BytesIO(contents))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal membaca file Excel: {str(e)}"
        )

    # Simple column mapping for Shopee Overview
    header_idx = -1
    for i, row in df.iterrows():
        if 'Tanggal' in row.values:
            header_idx = i
            break
    
    if header_idx == -1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format file tidak dikenali. Kolom 'Tanggal' tidak ditemukan."
        )

    df.columns = df.iloc[header_idx]
    df = df.iloc[header_idx + 1:]

    # Mapping logic
    imported_count = 0
    total_rev = 0
    total_gross = 0
    conversions = []
    
    dates_found = []

    for _, row in df.iterrows():
        try:
            raw_date = str(row['Tanggal']).strip()
            if not raw_date or raw_date == 'nan':
                continue
            
            # Shopee date format is often DD-MM-YYYY
            try:
                processed_date = None
                for fmt in ("%d-%m-%Y", "%Y-%m-%d"):
                    try:
                        processed_date = datetime.strptime(raw_date, fmt).date()
                        break
                    except ValueError:
                        continue
                
                if not processed_date:
                    continue
            except:
                continue

            def parse_num(val):
                if pd.isna(val): return 0
                if isinstance(val, (int, float)): return val
                cleaned = str(val).replace('.', '').replace(',', '.')
                try:
                    return float(cleaned)
                except:
                    return 0

            # Net Revenue = Penjualan (Pesanan Siap Dikirim)
            # Gross Revenue = Penjualan (Pesanan Dibuat)
            revenue_net = parse_num(row.get('Penjualan (Pesanan Siap Dikirim) (IDR)', 0))
            revenue_gross = parse_num(row.get('Penjualan (Pesanan Dibuat) (IDR)', 0))
            
            visitors = int(parse_num(row.get('Total Pengunjung (Kunjungan)', 0)))
            orders = int(parse_num(row.get('Pesanan (COD Dibuat + non-COD Dibayar)', 0)))
            conv_rate = parse_num(row.get('Tingkat Konversi', 0))
            if conv_rate > 1: # percentage format 50.5
                conv_rate = conv_rate / 100

            # Update or create performance entry
            perf = db.query(StorePerformance).filter(
                StorePerformance.store_id == store_id,
                StorePerformance.user_id == current_user.id,
                StorePerformance.date == processed_date
            ).first()

            if perf:
                perf.visitors = visitors
                perf.orders = orders
                perf.revenue = revenue_net
                perf.gross_revenue = revenue_gross
                perf.conversion_rate = conv_rate
            else:
                perf = StorePerformance(
                    user_id=current_user.id,
                    store_id=store_id,
                    date=processed_date,
                    visitors=visitors,
                    orders=orders,
                    revenue=revenue_net,
                    gross_revenue=revenue_gross,
                    conversion_rate=conv_rate
                )
                db.add(perf)
            
            dates_found.append(processed_date)
            imported_count += 1
            total_rev += revenue_net
            total_gross += revenue_gross
            conversions.append(conv_rate)

        except Exception as e:
            print(f"Row skip error: {e}")
            continue

    if imported_count == 0:
        raise HTTPException(status_code=400, detail="Tidak ada data yang valid untuk diimpor.")

    # Check for period duplication
    period_start = min(dates_found)
    period_end = max(dates_found)
    
    duplicate_period = db.query(SalesReport).filter(
        SalesReport.store_id == store_id,
        SalesReport.user_id == current_user.id,
        SalesReport.period_start == period_start,
        SalesReport.period_end == period_end
    ).first()
    
    if duplicate_period:
        # We allow it if the user explicitly wants to re-upload, but per requirements:
        # "Jangan simpan dan tampilkan pesan bahwa laporan sudah pernah di-upload"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Laporan untuk periode {period_start} s/d {period_end} sudah pernah di-upload (ID: {duplicate_period.id})."
        )

    # Save to SalesReport history
    report = SalesReport(
        user_id=current_user.id,
        store_id=store_id,
        filename=file.filename,
        file_hash=file_hash,
        period_start=period_start,
        period_end=period_end,
        total_gross=total_gross,
        total_net=total_rev,
        upload_date=date.today()
    )
    db.add(report)
    db.commit()

    avg_conv = sum(conversions) / len(conversions) if conversions else 0
    
    # Analysis summary
    summary = f"Berhasil mengimpor {imported_count} data harian. Periode: {period_start} hingga {period_end}. "
    summary += f"Total Omzet periode ini: Rp {total_rev:,.0f}."

    return SalesImportResponse(
        store_id=store_id,
        store_name=store.name,
        rows_imported=imported_count,
        total_revenue=total_rev,
        total_gross=total_gross,
        avg_conversion=avg_conv,
        analysis_summary=summary
    )

@router.get("/performance", response_model=List[StorePerformanceResponse])
def get_performance(
    store_id: str = None,
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get store performance data for charts/analytics.
    """
    query = db.query(StorePerformance).filter(StorePerformance.user_id == current_user.id)
    
    if store_id:
        query = query.filter(StorePerformance.store_id == store_id)
    
    if start_date:
        query = query.filter(StorePerformance.date >= start_date)
    
    if end_date:
        query = query.filter(StorePerformance.date <= end_date)
    
    return query.order_by(StorePerformance.date.asc()).all()

@router.get("/reports", response_model=List[SalesReportResponse])
async def get_reports(
    store_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get report history, optionally filtered by store"""
    query = db.query(SalesReport).filter(SalesReport.user_id == current_user.id)
    if store_id:
        query = query.filter(SalesReport.store_id == store_id)
    return query.order_by(SalesReport.upload_date.desc()).all()

@router.post("/shopee-products", response_model=ProductSalesImportResponse)
async def import_shopee_product_sales(
    store_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import Shopee Business Insight (Product Performance) Excel file.
    """
    # Validate store
    store = db.query(Store).filter(
        Store.id == store_id,
        Store.user_id == current_user.id
    ).first()
    
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store tidak ditemukan"
        )

    # Read Excel
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal membaca file Excel: {str(e)}"
        )

    # Shopee Product report often has metadata rows
    header_idx = -1
    for i, row in df.iterrows():
        if 'Nama Produk' in row.values or 'Product Name' in row.values:
            header_idx = i
            break
    
    if header_idx != -1:
        df.columns = df.iloc[header_idx]
        df = df.iloc[header_idx + 1:]

    # Mapping logic: Try 'Nama Produk' or 'SKU Ibu'
    imported_count = 0
    skipped_count = 0
    product_stats = []

    # Get all products for this user for mapping
    user_products = db.query(Product).filter(Product.user_id == current_user.id).all()
    product_map = {p.nama.lower(): p.id for p in user_products}
    
    # We also try SKU mapping if available
    # For now, let's keep it simple with Name mapping

    for _, row in df.iterrows():
        try:
            raw_name = str(row.get('Nama Produk', row.get('Product Name', ''))).strip()
            if not raw_name or raw_name == 'nan':
                continue
            
            product_id = product_map.get(raw_name.lower())
            if not product_id:
                skipped_count += 1
                continue

            def parse_num(val):
                if pd.isna(val): return 0
                if isinstance(val, (int, float)): return val
                cleaned = str(val).replace('.', '').replace(',', '.')
                try:
                    return float(cleaned)
                except:
                    return 0

            # Product report might be period-based, not daily
            # We'll use the 'Penjualan' column
            revenue = parse_num(row.get('Penjualan', row.get('Sales', 0)))
            orders = int(parse_num(row.get('Pesanan', row.get('Orders', 0))))
            visitors = int(parse_num(row.get('Pengunjung', row.get('Visitors', 0))))
            
            # Update ProductPerformance (Simplified: last 30 days summary or similar)
            # For now, we will store it with a generic 'current' date if not provided
            # Better: if the file has 'Tanggal', use it. Else use last 30 days.
            
            # Shopee product reports usually cover a selected period.
            record_date = date.today() # Placeholder
            
            perf = db.query(ProductPerformance).filter(
                ProductPerformance.product_id == product_id,
                ProductPerformance.store_id == store_id,
                ProductPerformance.user_id == current_user.id,
                ProductPerformance.date == record_date
            ).first()

            if perf:
                perf.revenue = revenue
                perf.orders = orders
                perf.visitors = visitors
            else:
                perf = ProductPerformance(
                    user_id=current_user.id,
                    product_id=product_id,
                    store_id=store_id,
                    date=record_date,
                    revenue=revenue,
                    orders=orders,
                    visitors=visitors
                )
                db.add(perf)
            
            imported_count += 1
            product_stats.append({
                "product_id": product_id,
                "product_name": raw_name,
                "revenue": revenue
            })

        except Exception as e:
            print(f"Row product skip error: {e}")
            continue

    db.commit()

    return ProductSalesImportResponse(
        store_id=store_id,
        rows_imported=imported_count,
        rows_skipped=skipped_count,
        summary=f"Berhasil mengimpor {imported_count} produk. {skipped_count} produk dilewati karena tidak terdaftar di MartTool."
    )
