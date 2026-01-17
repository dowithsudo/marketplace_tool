import React, { useState, useEffect } from 'react';
import { 
  FileUp, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ShoppingBag,
  History,
  TrendingDown,
  TrendingUp,
  LineChart
} from 'lucide-react';
import { storesApi, importsApi } from '../api';
import { formatCurrency, formatDecimalPercent } from '../utils/formatters';

const SalesImport = () => {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const resp = await storesApi.getAll();
        setStores(resp.data);
      } catch (err) {
        console.error("Gagal memuat toko", err);
      }
    };
    fetchStores();
  }, []);

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
      const resp = await importsApi.importShopeeSales(selectedStoreId, file);
      setResult(resp.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal mengimpor file. Pastikan format kolom sesuai.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileUp color="#10b981" />
          Impor Laporan Penjualan
        </h1>
        <p style={{ color: '#94a3b8' }}>Upload laporan Bisnis Saya / Business Insight dari Marketplace untuk dianalisa.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', flexWrap: 'wrap' }} className="responsive-grid">
        {/* Upload Form */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={20} color="#10b981" />
            Upload File Shopee
          </h3>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label className="form-label">Target Toko</label>
              <select 
                className="form-control" 
                value={selectedStoreId} 
                onChange={(e) => setSelectedStoreId(e.target.value)}
                required
              >
                <option value="">Pilih Toko</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.marketplace_name})</option>)}
              </select>
            </div>

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
                accept=".xlsx, .xls" 
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
                  <p style={{ fontWeight: '500' }}>Klik atau drop file Excel laporan Shopee</p>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Format: Ringkasan Penjualan (.xlsx)</p>
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
               <li>Menu Bisnis Saya &gt; Penjualan</li>
               <li>Pilih Periode, klik Download Data (Laporan Ringkasan)</li>
             </ol>
          </div>
        </div>

        {/* Analysis Result */}
        <div>
          {result ? (
            <div className="glass-card animate-fade-in" style={{ padding: '2.5rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <CheckCircle2 size={32} color="#10b981" />
                </div>
                <h2>Impor Berhasil!</h2>
                <p style={{ color: '#94a3b8' }}>Data penjualan toko {result.store_name} telah diperbarui.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</p>
                  <p style={{ fontSize: '1.75rem', fontWeight: '700' }}>{formatCurrency(result.total_revenue)}</p>
                </div>
                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg. Conversion</p>
                  <p style={{ fontSize: '1.75rem', fontWeight: '700', color: result.avg_conversion > 0.05 ? '#22c55e' : '#f59e0b' }}>
                    {formatDecimalPercent(result.avg_conversion)}
                  </p>
                </div>
              </div>

              <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#10b981' }}>
                  <LineChart size={20} /> Smart Analysis
                </h4>
                <p style={{ lineHeight: '1.6', fontSize: '1.05rem' }}>{result.analysis_summary}</p>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setResult(null)}>Upload Lagi</button>
                <button className="btn btn-primary" style={{ flex: 1.5 }} onClick={() => window.location.href = '/ads'}>Lihat Performa Iklan (TACoS)</button>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '3rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#94a3b8' }}>
              <History size={64} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
              <h3>Belum ada data di-upload</h3>
              <p>Analisis kilat akan muncul di sini setelah Anda mengimpor data penjualan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesImport;
