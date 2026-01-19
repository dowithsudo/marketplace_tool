from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import pandas as pd
import io
from datetime import datetime, date
from typing import List
import hashlib

from ..database import get_db
from ..models import Store, StorePerformance, ProductPerformance, Product, User, SalesReport, Ad
from ..schemas.store_performance import (
    SalesImportResponse, 
    StorePerformanceResponse, 
    ProductSalesImportResponse,
    SalesReportResponse
)
from ..schemas.ad import AdsImportResponse
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

    # Read file and Calculate Hash
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

        # Detect file type and read accordingly
        filename = file.filename.lower()
        if filename.endswith('.csv'):
            # For CSV: First scan to find header row, then re-read properly
            try:
                content_str = contents.decode('utf-8-sig')
            except UnicodeDecodeError:
                content_str = contents.decode('latin-1')
            
            lines = content_str.splitlines()
            header_idx = -1
            
            # Find the header row containing 'Tanggal'
            for i, line in enumerate(lines):
                if 'Tanggal' in line:
                    header_idx = i
                    break
            
            if header_idx == -1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Format file CSV tidak dikenali. Kolom 'Tanggal' tidak ditemukan."
                )
            
            # Re-read CSV with proper skiprows
            df = pd.read_csv(io.StringIO(content_str), skiprows=header_idx)
        else:
            df = pd.read_excel(io.BytesIO(contents))
            
            # For Excel: Find header row containing 'Tanggal'
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
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal membaca file: {str(e)}"
        )

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

    # Read file (CSV or Excel)
    try:
        contents = await file.read()
        filename = file.filename.lower()
        if filename.endswith('.csv'):
            # For CSV: First scan to find header row, then re-read properly
            try:
                content_str = contents.decode('utf-8-sig')
            except UnicodeDecodeError:
                content_str = contents.decode('latin-1')
            
            lines = content_str.splitlines()
            header_idx = -1
            
            # Find the header row containing 'Nama Produk' or 'Product Name'
            for i, line in enumerate(lines):
                if 'Nama Produk' in line or 'Product Name' in line:
                    header_idx = i
                    break
            
            if header_idx != -1:
                df = pd.read_csv(io.StringIO(content_str), skiprows=header_idx)
            else:
                # No header found, read normally
                df = pd.read_csv(io.StringIO(content_str))
        else:
            df = pd.read_excel(io.BytesIO(contents))
            
            # For Excel: Shopee Product report often has metadata rows
            header_idx = -1
            for i, row in df.iterrows():
                if 'Nama Produk' in row.values or 'Product Name' in row.values:
                    header_idx = i
                    break
            
            if header_idx != -1:
                df.columns = df.iloc[header_idx]
                df = df.iloc[header_idx + 1:]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal membaca file: {str(e)}"
        )

    # Mapping logic: Try 'Nama Produk' or 'SKU Ibu'
    imported_count = 0
    skipped_count = 0
    product_stats = []
    
    # Validate required columns exist
    required_cols = ['Nama Produk', 'Product Name']
    has_required_col = any(col in df.columns for col in required_cols)
    
    if not has_required_col:
        # Check if this looks like an ads report
        if any(col in str(df.columns) for col in ['Biaya', 'Omzet Penjualan', 'Kata Pencarian']):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File ini terlihat seperti laporan IKLAN, bukan laporan Performa Produk. Silakan upload di halaman Iklan (Menu Iklan > Import Laporan Shopee)."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format file tidak sesuai. Kolom 'Nama Produk' tidak ditemukan. Pastikan file adalah Laporan Performa Produk dari Shopee."
        )

    # Get all products for this user for mapping
    user_products = db.query(Product).filter(Product.user_id == current_user.id).all()
    product_map = {p.nama.lower(): p.id for p in user_products}

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

@router.post("/shopee-ads", response_model=AdsImportResponse)
async def import_ads(
    store_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generic Import Ads Report Endpoint.
    Automatically detects marketplace based on Store ID and selects appropriate parser.
    Currently supports: Shopee.
    """
    # Validate store & Identify Marketplace
    store = db.query(Store).filter(
        Store.id == store_id,
        Store.user_id == current_user.id
    ).first()
    
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store tidak ditemukan"
        )

    # Dispatcher Logic
    marketplace_id = store.marketplace_id.lower()
    
    # Read file content
    try:
        contents = await file.read()
        filename = file.filename.lower()
        
        # Prepare content string for CSVs
        content_str = ""
        if filename.endswith('.csv'):
             # Use utf-8-sig to handle BOM if present, and errors='replace' for safety
             content_str = contents.decode('utf-8-sig', errors='replace')
    except Exception as e:
         raise HTTPException(status_code=400, detail=f"Gagal membaca file: {str(e)}")

    if "shopee" in marketplace_id:
        return _parse_shopee_ads(db, current_user, store_id, filename, contents, content_str)
    elif "tokopedia" in marketplace_id:
        raise HTTPException(status_code=400, detail="Import Tokopedia Ads belum didukung. Harap berikan contoh file CSV untuk pengembangan.")
    elif "tiktok" in marketplace_id:
        raise HTTPException(status_code=400, detail="Import TikTok Ads belum didukung. Harap berikan contoh file CSV untuk pengembangan.")
    else:
        # Defaults to Shopee or Error? Error is safer.
        # But if marketplace not set correctly, fallback logic might be needed.
        # For now, strict check.
        raise HTTPException(status_code=400, detail=f"Marketplace '{marketplace_id}' belum didukung untuk import otomatis.")


def _parse_shopee_ads(db, current_user, store_id, filename, contents, content_str):
    """
    Internal helper to parse Shopee Ads CSV.
    Primary format: CSV. Excel check explicitly secondary.
    """
    if filename.endswith('.csv'):
        # Use splitlines to handle various newline formats (\n, \r\n) safely
        lines = content_str.splitlines()
    elif filename.endswith('.xlsx') or filename.endswith('.xls'):
        # ... existing excel logic ...
        df_raw = pd.read_excel(io.BytesIO(contents), header=None)
        lines = df_raw.fillna('').astype(str).apply(lambda x: ','.join(x), axis=1).tolist()
    else:
        raise HTTPException(status_code=400, detail="Format file tidak didukung. Harap gunakan file .csv (Format Standar Shopee).")

    # Metadata extraction
    start_date_str = None
    end_date_str = None
    period_found = False
    
    metadata_product_name = None
    metadata_product_id = None
    
    # Header row index for data
    header_idx = -1
    
    for i, line in enumerate(lines):
        clean_line = line.strip()
        
        # Extract Period
        if "Periode" in clean_line:
            try:
                parts = clean_line.split(',')
                for part in parts:
                    if " - " in part:
                        date_parts = part.strip().split(' - ')
                        if len(date_parts) == 2:
                            def to_iso(d_str):
                                d_str = d_str.strip()
                                d_str = d_str.split(' ')[0] 
                                return datetime.strptime(d_str, "%d/%m/%Y").strftime("%Y-%m-%d")

                            start_date_str = to_iso(date_parts[0])
                            end_date_str = to_iso(date_parts[1])
                            period_found = True
            except:
                pass
        
        # Extract Metadata Product Name
        # Format: Nama Iklan,"Rak helm..."
        if "Nama Iklan" in clean_line and header_idx == -1: # Metadata section only
             # Naive csv split might break on quotes. 
             # But for single line simple parsing:
             # Look for first comma
             parts = clean_line.split(',', 1)
             if len(parts) > 1 and "Nama Iklan" in parts[0]:
                 metadata_product_name = parts[1].strip().strip('"')

        # Extract Metadata Product ID
        # Format: No. Produk,29351024010
        if "No. Produk" in clean_line and header_idx == -1:
             parts = clean_line.split(',', 1)
             if len(parts) > 1 and "No. Produk" in parts[0]:
                 metadata_product_id = parts[1].strip().strip('"')

        if "Penempatan Iklan" in clean_line or "Urutan" in clean_line:
            header_idx = i
            break
            
    if header_idx == -1:
         raise HTTPException(status_code=400, detail="Format Shopee tidak dikenali. Header tabel tidak ditemukan.")

    # Parse Data
    try:
        if filename.endswith('.csv'):
             df = pd.read_csv(io.StringIO(content_str), skiprows=header_idx)
        else:
             df = pd.read_excel(io.BytesIO(contents), skiprows=header_idx)
    except Exception as e:
         raise HTTPException(status_code=400, detail=f"Gagal memparsing data tabel: {e}")

    # Clean column names (strip whitespace and hidden chars)
    df.columns = [str(c).strip() for c in df.columns]

    # Prepare logic
    imported_count = 0
    skipped_count = 0
    created_products_count = 0
    total_spend = 0
    total_gmv = 0
    
    # User's products for mapping
    user_products = db.query(Product).filter(Product.user_id == current_user.id).all()
    # Map name to ID
    product_map = {p.nama.lower().strip(): p.id for p in user_products}
    
    def parse_num(val):
        if pd.isna(val) or val == '-': return 0
        if isinstance(val, (int, float)): return val
        s = str(val).strip()
        if '%' in s:
            s = s.replace('%', '')
            try: return float(s) / 100
            except: return 0
        try: 
            # Remove thousand separators
            s = s.replace(',', '')
            return float(s)
        except: return 0

    import uuid

    for _, row in df.iterrows():
        try:
            # 1. Identify Product
            # Priority: Column 'Nama Iklan' > Metadata Product Name
            raw_app_name = str(row.get('Nama Iklan', ''))
            
            # If empty or not present in columns, fallback to metadata
            if not raw_app_name or raw_app_name == 'nan' or raw_app_name == 'None':
                if metadata_product_name:
                    raw_app_name = metadata_product_name
                else:
                    # Generic fallback if no name found anywhere
                    raw_app_name = "Unknown Product"

            # Match
            clean_name = raw_app_name.strip()
            lower_name = clean_name.lower()
            product_id = product_map.get(lower_name)
            
            if not product_id:
                # PRODUCT NOT FOUND -> AUTO CREATE
                # Use metadata ID if available, else random UUID
                new_id = metadata_product_id if metadata_product_id else str(uuid.uuid4())[:12]
                
                # Check if this ID already exists (collision check)
                collision = db.query(Product).filter(Product.id == new_id, Product.user_id == current_user.id).first()
                if collision:
                    new_id = str(uuid.uuid4())[:12]
                
                new_product = Product(
                    id=new_id,
                    user_id=current_user.id,
                    nama=clean_name
                )
                db.add(new_product)
                db.flush() 
                
                # Update map so next rows use this new product
                product_map[lower_name] = new_id
                product_id = new_id
                created_products_count += 1

            # 2. Extract Metrics
            # Determine campaign name: Column 'Nama Iklan' OR 'Kata Pencarian/Penempatan'
            # In single product report, 'Kata Pencarian' is the differentiator
            campaign_col = row.get('Kata Pencarian/Penempatan', row.get('Kata Pencarian', ''))
            
            # If generic Bulk report, 'Nama Iklan' is usually the campaign/product identifier
            if metadata_product_name:
                # Single Product Report mode: "Nama Iklan" is the product, "Kata Pencarian" is the sub-entity
                campaign_name = str(campaign_col) if not pd.isna(campaign_col) else 'General'
            else:
                # Bulk Report mode: "Nama Iklan" serves as campaign
                campaign_name = str(row.get('Nama Iklan', 'Imported'))

            spend = parse_num(row.get('Biaya', 0))
            gmv = parse_num(row.get('Omzet Penjualan', 0))
            orders = int(parse_num(row.get('Konversi', row.get('Pesanan', 0))))
            impressions = int(parse_num(row.get('Dilihat', 0)))
            clicks = int(parse_num(row.get('Jumlah Klik', 0)))
            ctr = parse_num(row.get('Persentase Klik', 0))
            
            direct_conv = int(parse_num(row.get('Konversi Langsung', 0)))
            items_sold = int(parse_num(row.get('Produk Terjual', 0)))
            
            # 3. Double Input Prevention
            if start_date_str and end_date_str:
                existing = db.query(Ad).filter(
                    Ad.store_id == store_id,
                    Ad.product_id == product_id,
                    Ad.start_date == start_date_str,
                    Ad.end_date == end_date_str,
                    Ad.campaign == campaign_name,
                    Ad.user_id == current_user.id
                ).first()
                
                if existing:
                    skipped_count += 1
                    continue
            
            # 4. Create Record
            new_ad = Ad(
                user_id=current_user.id,
                store_id=store_id,
                product_id=product_id,
                campaign=campaign_name,
                spend=spend,
                gmv=gmv,
                orders=orders,
                total_sales=0, 
                impressions=impressions,
                clicks=clicks,
                ctr=ctr,
                direct_conversions=direct_conv,
                items_sold=items_sold,
                start_date=start_date_str,
                end_date=end_date_str
            )
            
            db.add(new_ad)
            
            total_spend += spend
            total_gmv += gmv
            imported_count += 1
            
        except Exception as row_e:
            print(f"Row error: {row_e}")
            skipped_count += 1
            continue

    if imported_count > 0 or created_products_count > 0:
        db.commit()
    
    summary_msg = f"Berhasil import {imported_count} data."
    if created_products_count > 0:
        summary_msg += f" {created_products_count} Produk baru otomatis dibuat."
    if skipped_count > 0:
        summary_msg += f" {skipped_count} data dilewati (Duplikat atau error)."

    return AdsImportResponse(
        store_id=store_id,
        rows_imported=imported_count,
        rows_skipped=skipped_count,
        total_spend=total_spend,
        total_gmv=total_gmv,
        summary=summary_msg
    )

@router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sales_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a sales report and its associated metrics record.
    Allows user to re-upload if needed.
    """
    report = db.query(SalesReport).filter(
        SalesReport.id == report_id,
        SalesReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
        
    db.delete(report)
    db.commit()
    return None
