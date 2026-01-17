from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import pandas as pd
import io
from datetime import datetime
from typing import List

from ..database import get_db
from ..models import Store, StorePerformance, User
from ..schemas.store_performance import SalesImportResponse
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

    # Read Excel
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal membaca file Excel: {str(e)}"
        )

    # Simple column mapping for Shopee Overview
    # Shopee often has some meta rows at the top, let's look for the header row
    # We find 'Tanggal'
    header_idx = -1
    for i, row in df.iterrows():
        if 'Tanggal' in row.values:
            header_idx = i
            break
    
    if header_idx == -1:
         # Try if the current columns are already headers
         if 'Tanggal' not in df.columns:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format file tidak dikenali. Pastikan kolom 'Tanggal' tersedia."
            )
    else:
        # Reset headers if found in a row
        df.columns = df.iloc[header_idx]
        df = df.iloc[header_idx + 1:]

    # Data transformation
    # We need: date, visitors, orders, revenue, conversion_rate, avg_order_value
    mapping = {
        'Tanggal': 'date',
        'Total Pengunjung (Kunjungan)': 'visitors',
        'Pesanan (COD Dibuat + non-COD Dibayar)': 'orders',
        'Penjualan (Pesanan Siap Dikirim) (IDR)': 'revenue',
        'Tingkat Konversi': 'conversion_rate'
    }

    imported_count = 0
    total_revenue = 0.0
    conv_list = []

    for _, row in df.iterrows():
        try:
            raw_date = str(row['Tanggal']).strip()
            # Shopee date usually DD-MM-YYYY or YYYY-MM-DD
            if not raw_date or raw_date == 'nan' or '-' not in raw_date:
                continue

            try:
                # Try common formats
                for fmt in ("%d-%m-%Y", "%Y-%m-%d"):
                    try:
                        record_date = datetime.strptime(raw_date, fmt).date()
                        break
                    except ValueError:
                        continue
                else:
                    continue # Skip if date fails
            except:
                continue

            def parse_num(val):
                if pd.isna(val): return 0
                if isinstance(val, (int, float)): return val
                # Remove thousand separators and handle decimal commas
                cleaned = str(val).replace('.', '').replace(',', '.')
                try:
                    return float(cleaned)
                except:
                    return 0

            visitors = int(parse_num(row.get('Total Pengunjung (Kunjungan)', 0)))
            orders = int(parse_num(row.get('Pesanan (COD Dibuat + non-COD Dibayar)', 0)))
            revenue = parse_num(row.get('Penjualan (Pesanan Siap Dikirim) (IDR)', 0))
            
            # Conversion rate usually comes as "X,XX%" string or float
            raw_conv = row.get('Tingkat Konversi', 0)
            if isinstance(raw_conv, str) and '%' in raw_conv:
                conv_rate = float(raw_conv.replace(',', '.').replace('%', '')) / 100
            else:
                conv_rate = parse_num(raw_conv)
                if conv_rate > 1: conv_rate /= 100 # Handle cases where it's 5.5 instead of 0.055

            aov = revenue / orders if orders > 0 else 0

            # Update or create performance entry
            perf = db.query(StorePerformance).filter(
                StorePerformance.store_id == store_id,
                StorePerformance.user_id == current_user.id,
                StorePerformance.date == record_date
            ).first()

            if perf:
                perf.visitors = visitors
                perf.orders = orders
                perf.revenue = revenue
                perf.conversion_rate = conv_rate
                perf.avg_order_value = aov
            else:
                perf = StorePerformance(
                    user_id=current_user.id,
                    store_id=store_id,
                    date=record_date,
                    visitors=visitors,
                    orders=orders,
                    revenue=revenue,
                    conversion_rate=conv_rate,
                    avg_order_value=aov
                )
                db.add(perf)
            
            imported_count += 1
            total_revenue += revenue
            if conv_rate > 0: conv_list.append(conv_rate)

        except Exception as e:
            print(f"Row skip error: {e}")
            continue

    db.commit()

    # Generate summary
    avg_conv = (sum(conv_list) / len(conv_list)) if conv_list else 0
    summary = f"Berhasil mengimpor {imported_count} data harian. Total omzet periode ini: Rp {total_revenue:,.0f}."
    if avg_conv < 0.02:
        summary += " Tingkat konversi rata-rata agak rendah (< 2%), pertimbangkan optimasi foto/deskripsi."
    elif avg_conv > 0.05:
        summary += " Tingkat konversi sangat baik! Produk Anda diminati pasar."

    return SalesImportResponse(
        store_id=store_id,
        store_name=store.name,
        rows_imported=imported_count,
        total_revenue=total_revenue,
        avg_conversion=avg_conv,
        analysis_summary=summary
    )
