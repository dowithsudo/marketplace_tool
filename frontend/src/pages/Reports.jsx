import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileUp, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ShoppingBag,
  History,
  TrendingUp,
  LineChart,
  X,
  Trash2
} from 'lucide-react';
import { storesApi, importsApi } from '../api';
import { formatCurrency, formatDecimalPercent, formatNumber } from '../utils/formatters';

const Reports = () => {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [file, setFile] = useState(null);
  const [importMode, setImportMode] = useState('overview');
  const [history, setHistory] = useState([]); // Daily performance history
  const [reportHistory, setReportHistory] = useState([]); // Uploaded files history
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const [reportDailyData, setReportDailyData] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchStores = useCallback(async () => {
    try {
      const resp = await storesApi.getAll();
      setStores(resp.data);
      if (resp.data.length > 0 && !selectedStoreId) {
        setSelectedStoreId(resp.data[0].id);
      }
    } catch (err) {
      console.error("Gagal memuat toko", err);
    }
  }, [selectedStoreId]);

  const fetchHistory = useCallback(async () => {
    try {
      const resp = await importsApi.getPerformance({ store_id: selectedStoreId });
      setHistory(resp.data.reverse().slice(0, 15));
    } catch (err) {
      console.error("Gagal memuat histori harian", err);
    }
  }, [selectedStoreId]);

  const fetchReportHistory = useCallback(async () => {
    try {
      const resp = await importsApi.getReports({ store_id: selectedStoreId });
      setReportHistory(resp.data);
    } catch (err) {
       console.error("Gagal memuat histori laporan", err);
    }
  }, [selectedStoreId]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    if (selectedStoreId) {
      fetchHistory();
      fetchReportHistory();
    }
  }, [selectedStoreId, fetchHistory, fetchReportHistory]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedStoreId || !file) {
      setError("Pilih toko dan file laporan terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiCall = importMode === 'overview' 
        ? importsApi.importShopeeSales(selectedStoreId, file)
        : importsApi.importShopeeProductSales(selectedStoreId, file);
        
      const resp = await apiCall;
      setResult(resp.data);
      setFile(null);
      fetchHistory();
      fetchReportHistory();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal mengimpor file. Pastikan format kolom sesuai.");
    } finally {
      setLoading(false);
    }
  };

  const handleReportClick = async (report) => {
    setSelectedReport(report);
    setLoadingDetails(true);
    setReportDailyData([]);
    
    try {
      const resp = await importsApi.getPerformance({
        store_id: selectedStoreId,
        start_date: report.period_start,
        end_date: report.period_end
      });
      setReportDailyData(resp.data);
    } catch (err) {
      console.error("Gagal memuat detail harian", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDeleteReport = async (id, e) => {
    e.stopPropagation(); // Mencegah modal terbuka
    if (!window.confirm("Hapus histori laporan ini? Catatan: Ini hanya menghapus catatan histori upload agar file bisa di-upload ulang jika sebelumnya gagal.")) return;
    
    try {
      await importsApi.deleteReport(id);
      setReportHistory(reportHistory.filter(h => h.id !== id));
    } catch {
      alert("Gagal menghapus laporan history");
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileUp color="#10b981" />
          Manajemen Laporan & Histori
        </h1>
        <p style={{ color: '#94a3b8' }}>Kelola file laporan dari Marketplace dan pantau histori per toko.</p>
      </header>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ maxWidth: '300px' }}>
          <label className="form-label">Toko Aktif</label>
          <select 
            className="form-control" 
            value={selectedStoreId} 
            onChange={(e) => setSelectedStoreId(e.target.value)}
          >
            {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.marketplace_name})</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem' }} className="responsive-grid">
        {/* Upload Form */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
            <button 
              className={`btn ${importMode === 'overview' ? 'active' : ''}`}
              style={{ flex: 1, borderRadius: 0, border: 'none', background: importMode === 'overview' ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: importMode === 'overview' ? '#10b981' : '#94a3b8', padding: '1rem', fontWeight: '600' }}
              onClick={() => { setImportMode('overview'); setFile(null); setResult(null); }}
            >
              Ringkasan Toko
            </button>
            <button 
              className={`btn ${importMode === 'product' ? 'active' : ''}`}
              style={{ flex: 1, borderRadius: 0, border: 'none', background: importMode === 'product' ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: importMode === 'product' ? '#10b981' : '#94a3b8', padding: '1rem', fontWeight: '600' }}
              onClick={() => { setImportMode('product'); setFile(null); setResult(null); }}
            >
              Performa Produk
            </button>
          </div>

          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={20} color="#10b981" />
            Upload {importMode === 'overview' ? 'Ringkasan Penjualan' : 'Performa Produk'}
          </h3>
          <form onSubmit={handleUpload}>
            <div 
              style={{ 
                border: '2px dashed var(--border)', 
                borderRadius: '12px', 
                padding: '2.5rem', 
                textAlign: 'center',
                background: file ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                cursor: 'pointer',
                marginBottom: '1.5rem',
                transition: 'all 0.2s'
              }}
              onClick={() => document.getElementById('reportFile').click()}
            >
               <input 
                type="file" 
                id="reportFile" 
                accept=".xlsx, .xls, .csv" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
              <Download size={40} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
              {file ? (
                <div>
                  <p style={{ fontWeight: '600', color: '#10b981' }}>{file.name}</p>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>File siap di-upload</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontWeight: '500' }}>Klik atau drop file {importMode === 'overview' ? 'Ringkasan' : 'Produk'}</p>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Format: {importMode === 'overview' ? 'Ringkasan Penjualan (.xlsx, .csv)' : 'Performa Produk (.xlsx, .csv)'}</p>
                </div>
              )}
            </div>

            {error && (
              <div style={{ display: 'flex', gap: '0.5rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', height: '48px' }}
              disabled={loading || !file}
            >
              {loading ? <RefreshCw className="animate-spin" /> : <CheckCircle2 size={18} />} 
              {loading ? 'Sedang Memproses...' : 'Upload & Analisis'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontSize: '0.85rem' }}>
             <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>💡 Tip Cara Download:</p>
             <ol style={{ paddingLeft: '1.25rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
               <li>Buka Seller Centre Shopee</li>
               {importMode === 'overview' ? (
                 <>
                  <li>Menu Bisnis Saya &gt; Penjualan</li>
                  <li>Pilih Periode, klik Download Data (Laporan Ringkasan)</li>
                 </>
               ) : (
                 <>
                  <li>Menu Bisnis Saya &gt; Produk</li>
                  <li>Pilih Periode, klik Download Data (Laporan Performa)</li>
                 </>
               )}
             </ol>
          </div>
        </div>

        {/* Dynamic Display: Result OR History List */}
        <div>
          {result ? (
            <div className="glass-card animate-fade-in" style={{ padding: '2.5rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <CheckCircle2 size={32} color="#10b981" />
                </div>
                <h2>Impor Berhasil!</h2>
                <p style={{ color: '#94a3b8' }}>
                  {importMode === 'overview' ? `Data penjualan toko ${result.store_name} diperbarui.` : result.summary}
                </p>
              </div>

              {importMode === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Net Revenue</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: '700' }}>{formatCurrency(result.total_revenue)}</p>
                  </div>
                  <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Gross Revenue</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: '700' }}>{formatCurrency(result.total_gross)}</p>
                  </div>
                </div>
              )}

              <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#10b981' }}>
                  <LineChart size={20} /> Analisis Cepat
                </h4>
                <p style={{ lineHeight: '1.6', fontSize: '1.05rem' }}>{result.analysis_summary}</p>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setResult(null)}>Kembali ke Histori</button>
                <button className="btn btn-primary" style={{ flex: 1.5 }} onClick={() => window.location.href = '/'}>Lihat Dashboard</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Report History (Files) */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={20} color="#3b82f6" /> Histori File Laporan
                </h3>
                {reportHistory.length > 0 ? (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>File & Periode</th>
                          <th>Gross Rev.</th>
                          <th>Net Rev.</th>
                          <th>Upload Di</th>
                          <th style={{ width: '50px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportHistory.map((rep) => (
                          <tr 
                            key={rep.id} 
                            onClick={() => handleReportClick(rep)}
                            style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <td>
                              <div style={{ fontWeight: '600' }}>{rep.filename}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                {new Date(rep.period_start).toLocaleDateString('id-ID')} - {new Date(rep.period_end).toLocaleDateString('id-ID')}
                              </div>
                            </td>
                            <td>{formatCurrency(rep.total_gross)}</td>
                            <td>{formatCurrency(rep.total_net)}</td>
                            <td>{new Date(rep.upload_date).toLocaleDateString('id-ID')}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                onClick={(e) => handleDeleteReport(rep.id, e)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Hapus Histori"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Belum ada histori laporan untuk toko ini.</p>
                )}
              </div>

              {/* Daily Performance Table */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={20} color="#10b981" /> Performa Harian (Recent)
                </h3>
                {history.length > 0 ? (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Tanggal</th>
                          <th>Gross Rev.</th>
                          <th>Net Rev.</th>
                          <th>Orders</th>
                          <th>Conv.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h, i) => (
                          <tr key={i}>
                            <td>{new Date(h.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</td>
                            <td>{formatCurrency(h.gross_revenue || h.revenue)}</td>
                            <td>{formatCurrency(h.revenue)}</td>
                            <td>{formatNumber(h.orders)}</td>
                            <td style={{ fontWeight: '600', color: h.conversion_rate > 0.05 ? '#22c55e' : '#f59e0b' }}>
                              {formatDecimalPercent(h.conversion_rate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Impor laporan untuk melihat data harian.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Detail Modal */}
      {selectedReport && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', 
          backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 1000 
        }} onClick={() => setSelectedReport(null)}>
          <div 
            className="glass-card animate-fade-in" 
            style={{ width: '800px', maxWidth: '95%', padding: '0', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} color="#3b82f6" /> Detail Laporan
              </h3>
              <button 
                onClick={() => setSelectedReport(null)} 
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '2rem', overflowY: 'auto' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Nama File / Sumber</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '600', wordBreak: 'break-all' }}>{selectedReport.filename}</p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                   <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Periode Mulai</p>
                   <p style={{ fontWeight: '500' }}>{new Date(selectedReport.period_start).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                   <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Periode Selesai</p>
                   <p style={{ fontWeight: '500' }}>{new Date(selectedReport.period_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.85rem' }}>Gross Revenue</span>
                    <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{formatCurrency(selectedReport.total_gross)}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.85rem' }}>Net Revenue</span>
                    <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#10b981' }}>{formatCurrency(selectedReport.total_net)}</span>
                  </div>
                  <div style={{ gridColumn: 'span 2', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>Selisih / Potensi Cancel</span>
                       <span style={{ fontWeight: '600', color: '#ef4444' }}>{formatCurrency(selectedReport.total_gross - selectedReport.total_net)}</span>
                     </div>
                  </div>
                </div>
              </div>

              <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="#10b981" /> Rincian Harian
              </h4>
              
              {loadingDetails ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '0.5rem' }} />
                  <p>Memuat data harian...</p>
                </div>
              ) : reportDailyData.length > 0 ? (
                <div className="table-container" style={{ marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                  <table style={{ fontSize: '0.9rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 1 }}>
                      <tr>
                        <th>Tanggal</th>
                        <th>Gross Rev.</th>
                        <th>Net Rev.</th>
                        <th>Orders</th>
                        <th>Conv.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportDailyData.map((d, i) => (
                        <tr key={i}>
                          <td>{new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</td>
                          <td>{formatCurrency(d.gross_revenue)}</td>
                          <td>{formatCurrency(d.revenue)}</td>
                          <td>{formatNumber(d.orders)}</td>
                          <td>{formatDecimalPercent(d.conversion_rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontStyle: 'italic', marginBottom: '1.5rem' }}>Tidak ada data harian tersedia untuk periode ini.</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#64748b', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span>ID Laporan: {selectedReport.id}</span>
                <span>Diunggah: {new Date(selectedReport.upload_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
