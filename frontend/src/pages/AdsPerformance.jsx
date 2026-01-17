import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  Zap, 
  Target, 
  RefreshCw,
  Plus,
  Trash2,
  ArrowRightLeft,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { storesApi, productsApi, adsApi, decisionApi, pricingApi } from '../api';
import { formatCurrency, formatNumber, formatRawPercent, formatDecimalPercent } from '../utils/formatters';

const AdsPerformance = () => {
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  
  const [adsData, setAdsData] = useState([]);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [showAddAdModal, setShowAddAdModal] = useState(false);
  
  // Forms
  const [adForm, setAdForm] = useState({ campaign: '', spend: '', gmv: '', orders: '', total_sales: '' });
  const [reverseForm, setReverseForm] = useState({ target_type: 'percent', target_value: 0.15 });
  const [reverseResult, setReverseResult] = useState(null);

  useEffect(() => {
    fetchInit();
  }, []);

  const fetchInit = async () => {
    try {
      const [sData, pData] = await Promise.all([storesApi.getAll(), productsApi.getAll()]);
      setStores(sData.data);
      setProducts(pData.data);
    } catch (error) { console.error(error); }
  };

  const handleAnalyze = async () => {
    if(!selectedStoreId || !selectedProductId) return;
    setLoading(true);
    try {
      const [adsResp, decResp] = await Promise.all([
        adsApi.getAll({ store_id: selectedStoreId, product_id: selectedProductId }),
        decisionApi.get(selectedStoreId, selectedProductId)
      ]);
      setAdsData(adsResp.data);
      setDecision(decResp.data);
    } catch {
      alert("Analisis gagal. Pastikan produk terdaftar di toko tersebut.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAd = async (e) => {
    e.preventDefault();
    try {
      await adsApi.create({
        store_id: selectedStoreId,
        product_id: selectedProductId,
        ...adForm
      });
      setShowAddAdModal(false);
      handleAnalyze();
      setAdForm({ campaign: '', spend: '', gmv: '', orders: '', total_sales: '' });
    } catch { alert("Gagal menambah data iklan"); }
  };

  const handleReversePricing = async (e) => {
    e.preventDefault();
    try {
      const resp = await pricingApi.reverse({
        store_id: selectedStoreId,
        product_id: selectedProductId,
        ...reverseForm
      });
      setReverseResult(resp.data);
    } catch { alert("Reverse pricing gagal"); }
  };

  const getDecisionUI = (grade) => {
    switch(grade) {
      case 'SCALABLE': 
        return {
          label: "Aman untuk Ditingkatkan",
          desc: "Kinerja iklan sangat sehat. Anda bisa menambah budget untuk scale-up.",
          color: '#22c55e',
          bgColor: 'rgba(34, 197, 94, 0.1)',
          icon: <Zap size={32} />
        };
      case 'VIABLE': 
        return {
          label: "Stabil, Lanjutkan",
          desc: "Iklan masih menguntungkan dan dalam batas aman. Pantau rutin.",
          color: '#3b82f6',
          bgColor: 'rgba(59, 130, 246, 0.1)',
          icon: <CheckCircle2 size={32} />
        };
      case 'RISKY': 
        return {
          label: "Perlu Diperbaiki / Waspada",
          desc: "Margin keuntungan sudah sangat tipis. Coba optimalkan iklan atau harga.",
          color: '#f59e0b',
          bgColor: 'rgba(245, 158, 11, 0.1)',
          icon: <AlertCircle size={32} />
        };
      case 'NOT_VIABLE': 
        return {
          label: "Sebaiknya Dihentikan",
          desc: "Iklan ini MERUGIKAN. Pengeluaran lebih besar dari keuntungan produk.",
          color: '#ef4444',
          bgColor: 'rgba(239, 68, 68, 0.1)',
          icon: <XCircle size={32} />
        };
      default: 
        return {
          label: "Data Belum Cukup",
          desc: "Belum bisa menyimpulkan. Tambahkan data iklan lagi.",
          color: '#94a3b8',
          bgColor: 'rgba(148, 163, 184, 0.1)',
          icon: <HelpCircle size={32} />
        };
    }
  };

  const calculateNetProfitAfterAd = () => {
    if (!decision || adsData.length === 0) return null;
    
    // Aggregated stats from current adsData
    const totalSpend = adsData.reduce((acc, curr) => acc + curr.spend, 0);
    const totalOrders = adsData.reduce((acc, curr) => acc + curr.orders, 0);

    if (totalOrders === 0) return 0;

    const adCostPerOrder = totalSpend / totalOrders;
    
    // decision.profit_per_order is Gross Profit (Price - HPP - Fees) without Ad Cost
    const netProfit = decision.profit_per_order - adCostPerOrder;
    
    return {
      netProfit,
      adCostPerOrder,
      isProfitable: netProfit > 0
    };
  };

  const getCampaignTrend = (campaignRoas, breakEvenRoas) => {
    const diff = campaignRoas - breakEvenRoas;
    const percentDiff = (diff / breakEvenRoas) * 100;

    if (percentDiff > 20) return { icon: <ArrowUpRight size={16} color="#22c55e" />, text: "Sangat Bagus", color: '#22c55e' };
    if (percentDiff > 0) return { icon: <ArrowUpRight size={16} color="#3b82f6" />, text: "Di atas BEP", color: '#3b82f6' };
    if (percentDiff > -10) return { icon: <Minus size={16} color="#f59e0b" />, text: "Mendekati BEP", color: '#f59e0b' }; 
    return { icon: <ArrowDownRight size={16} color="#ef4444" />, text: "Di bawah BEP", color: '#ef4444' };
  };

  const netStats = calculateNetProfitAfterAd();
  const decisionUI = decision ? getDecisionUI(decision.grade) : null;

  return (
    <>
      <div className="animate-fade-in">
        {/* Educational Banner */}
        <div style={{ background: 'linear-gradient(to right, #e0e7ff, #f3e8ff)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid #c7d2fe', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <HelpCircle size={32} color="#6366f1" />
          </div>
          <div>
            <h3 style={{ color: '#4338ca', marginBottom: '0.25rem', fontSize: '1.1rem' }}>Pojok Edukasi Iklan 💡</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <strong>ROAS (Return on Ad Spend):</strong> Efektivitas iklan. Kalau 5x, berarti keluar 1rb dapet 5rb. <br/>
              <strong>TACoS (Total Ad Cost of Sales):</strong> Kesehatan toko. Mengukur seberapa boros iklan dibanding TOTAL omzet (organik + iklan). Makin kecil, makin sehat.
            </p>
          </div>
        </div>

        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BarChart3 color="#8b5cf6" />
            Analisis & Grading Iklan
          </h1>
          <p style={{ color: '#94a3b8' }}>Evaluasi performa iklan dan tentukan kelayakan scale-up produk.</p>
        </header>

        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1.5rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Pilih Toko</label>
              <select className="form-control" value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)}>
                <option value="">Pilih Toko</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.marketplace_name})</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Pilih Produk</label>
              <select className="form-control" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                <option value="">Pilih Produk</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" style={{ padding: '0.8rem 2rem' }} onClick={handleAnalyze} disabled={loading}>
              {loading ? <RefreshCw className="animate-spin" /> : <Zap size={18} />} Analisis Kelayakan
            </button>
          </div>
        </div>

        {decision && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Main Decision Banner */}
            <div style={{ 
              background: decisionUI.bgColor, 
              border: `1px solid ${decisionUI.color}`, 
              borderRadius: '16px', 
              padding: '2rem', 
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '2rem'
            }}>
              <div style={{ color: decisionUI.color }}>{decisionUI.icon}</div>
              <div>
                <h2 style={{ fontSize: '2rem', color: decisionUI.color, marginBottom: '0.5rem' }}>{decisionUI.label}</h2>
                <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>{decisionUI.desc}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              {/* Profitability Analysis */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                 <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Target size={20} color="#6366f1" />
                  Kesehatan Profit (Per Order)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span title="Harga Jual - HPP - Biaya Marketplace">Untung Produk (Sebelum Iklan)</span>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(decision.profit_per_order)}</span>
                  </div>
                  {netStats && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                        <span>Biaya Iklan Rata-rata</span>
                        <span>- {formatCurrency(netStats.adCostPerOrder)}</span>
                      </div>
                      <div style={{ 
                        marginTop: '1rem', 
                        padding: '1rem', 
                        background: netStats.isProfitable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontWeight: '500' }}>SISA UNTUNG (Setelah Bayar Iklan)</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: '800', color: netStats.isProfitable ? '#22c55e' : '#ef4444' }}>
                          {formatCurrency(netStats.netProfit)}
                        </span>
                      </div>
                       {!netStats.isProfitable && (
                        <p style={{ fontSize: '0.9rem', color: '#ef4444', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <AlertCircle size={14} /> 
                          Total rugi per order setelah dipotong biaya iklan: {formatCurrency(Math.abs(netStats.netProfit))}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Visual Break-Even Indicator */}
                <div style={{ marginTop: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    <span>Zone Bahaya (Rugi)</span>
                    <span>BEP: {decision.break_even_roas}x ROAS</span>
                    <span>Zone Aman (Untung)</span>
                  </div>
                  {/* Simplified Visual Bar Logic */}
                  <div style={{ height: '8px', background: 'linear-gradient(90deg, #ef4444 40%, #f59e0b 50%, #22c55e 100%)', borderRadius: '4px', position: 'relative' }}>
                    {adsData.length > 0 && (
                      <div style={{ 
                        position: 'absolute', 
                        left: `${Math.min(100, (Math.max(0, (adsData[0]?.roas || 0) / (decision.break_even_roas * 2)) * 100))}%`, 
                        top: '-6px', 
                        transform: 'translateX(-50%)' 
                      }}>
                        <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', border: '4px solid #6366f1' }} title="Posisi ROAS Iklan Anda" />
                      </div>
                    )}
                  </div>
                   <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: '1rem' }}>
                    {adsData.length > 0 && adsData[0].roas > decision.break_even_roas 
                      ? "Posisi iklan Anda saat ini AMAN (Di atas batas impas)" 
                      : "Posisi iklan Anda BERISIKO (Masih di bawah batas impas)"}
                  </p>
                </div>
              </div>

               {/* Alerts & Recommendations */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={20} color="#f59e0b" />
                  Diagnosa & Saran
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {decision.alerts.map((alert, i) => (
                    <div key={i} style={{ 
                      padding: '1rem', 
                      borderRadius: '12px', 
                      background: alert.level === 'danger' ? 'rgba(239, 68, 68, 0.1)' : alert.level === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                      border: `1px solid ${alert.level === 'danger' ? 'rgba(239, 68, 68, 0.2)' : alert.level === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)'}`,
                      color: alert.level === 'danger' ? '#f87171' : alert.level === 'warning' ? '#fbbf24' : '#818cf8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      {alert.level === 'danger' ? <TrendingUp size={18} style={{ transform: 'rotate(180deg)' }} /> : <Info size={18} />}
                      <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{alert.message}</p>
                    </div>
                  ))}
                  {decision.alerts.length === 0 && <p style={{ color: '#22c55e', textAlign: 'center', padding: '1rem', background: 'rgba(34,197,94,0.05)', borderRadius: '12px' }}>Semua indikator sehat. Tidak ada isu kritis yang terdeteksi.</p>}
                </div>
                
                <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>SARAN UTAMA:</p>
                  <p style={{ fontWeight: '600', color: decisionUI.color }}>
                    {decision.grade === 'NOT_VIABLE' || decision.grade === 'RISKY' 
                      ? "🛑 Hentikan iklan sementara atau segera naikkan harga jual produk." 
                      : decision.grade === 'VIABLE' 
                        ? "✅ Pertahankan performa, pantau jika ada kenaikan biaya iklan." 
                        : "🚀 Mulai naikkan budget iklan perlahan untuk profit maksimal."}
                  </p>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                   <button className="btn btn-primary" onClick={() => setShowReverseModal(true)} style={{ justifyContent: 'center' }}>
                    <ArrowRightLeft size={16} /> Simulasi Harga
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowAddAdModal(true)} style={{ justifyContent: 'center' }}>
                    <Plus size={16} /> Update Data
                  </button>
                </div>
              </div>
            </div>

            {/* Ad Campaign Table */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} color="#6366f1" />
                Rincian Performa Iklan
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Kampanye</th>
                      <th>Biaya Iklan</th>
                      <th>Hasil (GMV)</th>
                      <th>Order</th>
                      <th>ROAS (Efektivitas)</th>
                      <th>Performa vs BEP</th>
                      <th>TACoS (Kesehatan)</th>
                      <th>Biaya/Order (CPA)</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adsData.map(ad => {
                       const trend = getCampaignTrend(ad.roas, decision.break_even_roas);
                       return (
                        <tr key={ad.id}>
                          <td style={{ fontWeight: '500' }}>{ad.campaign || 'Tanpa Nama'}</td>
                          <td title={ad.spend}>{formatCurrency(ad.spend)}</td>
                          <td title={ad.gmv}>{formatCurrency(ad.gmv)}</td>
                          <td>{formatNumber(ad.orders)}</td>
                          <td>
                            <span style={{ fontWeight: '700', fontSize: '1.1rem', color: ad.roas >= decision.break_even_roas ? '#22c55e' : '#ef4444' }}>
                              {formatNumber(ad.roas)}x
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: trend.color }}>
                              {trend.icon} {trend.text}
                            </div>
                          </td>
                          <td style={{ fontWeight: '600', color: (ad.tacos && ad.tacos > 0.2) ? '#ef4444' : (ad.tacos && ad.tacos < 0.1) ? '#22c55e' : '#f59e0b' }}>
                            {ad.tacos ? formatDecimalPercent(ad.tacos) : '-'}
                          </td>
                          <td title={ad.cpa} style={{ color: ad.cpa > decision.max_cpa ? '#ef4444' : 'inherit' }}>
                             {formatCurrency(ad.cpa)}
                             {ad.cpa > decision.max_cpa && <AlertCircle size={12} color="#ef4444" style={{ marginLeft: '4px', verticalAlign: 'middle' }} />}
                          </td>
                          <td>
                            <button onClick={async () => { if(window.confirm("Hapus data?")) { await adsApi.delete(ad.id); handleAnalyze(); } }} className="btn btn-danger" style={{ padding: '0.4rem' }}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {adsData.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Belum ada data iklan untuk produk ini. Tambahkan data untuk mulai analisis.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Reverse Pricing Modal */}
      <AnimatePresence>
        {showReverseModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReverseModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '900px', display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '0', overflow: 'hidden', zIndex: 11000 }}>
              
              <div style={{ padding: '2.5rem' }}>
                <h2 style={{ marginBottom: '0.5rem' }}>Simulasi Harga Balik</h2>
                <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Cari harga jual ideal agar iklan lebih aman (margin lebih tebal).</p>
                
                <form onSubmit={handleReversePricing}>
                  <div className="form-group">
                    <label className="form-label">Tipe Target Profit</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <button type="button" className={`btn ${reverseForm.target_type === 'percent' ? 'btn-primary' : 'btn-secondary'}`} 
                        onClick={() => setReverseForm({...reverseForm, target_type: 'percent'})}>Margin Persentase</button>
                      <button type="button" className={`btn ${reverseForm.target_type === 'fixed' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setReverseForm({...reverseForm, target_type: 'fixed'})}>Nominal Tetap</button>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">{reverseForm.target_type === 'percent' ? 'Target Margin (cth. 0.25 utk 25%)' : 'Target Profit (Rp)'}</label>
                    <input type="number" step="0.01" className="form-control" placeholder={reverseForm.target_type === 'percent' ? "0.2" : "25000"} 
                      value={reverseForm.target_value} onChange={(e) => setReverseForm({...reverseForm, target_value: parseFloat(e.target.value)})} required />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '2rem', justifyContent: 'center' }}>
                    <RefreshCw size={18} /> Hitung Rekomendasi
                  </button>
                </form>
              </div>

              <div style={{ padding: '2.5rem', background: 'rgba(99, 102, 241, 0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {reverseResult ? (
                  <div className="animate-fade-in text-center">
                    <p className="metric-label">REKOMENDASI HARGA JUAL</p>
                    <h2 style={{ fontSize: '2.5rem', color: '#6366f1', marginBottom: '1rem' }}>{formatCurrency(reverseResult.recommended_price)}</h2>
                    
                    {/* Impact Simulation Text */}
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                       Dengan harga ini, margin Anda naik menjadi <b>{formatRawPercent(reverseResult.expected_margin_percent)}</b>. 
                       Batas aman ROAS turun ke <b>{formatNumber(reverseResult.break_even_roas)}x</b>, membuat iklan jauh lebih mudah profit.
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left' }}>
                      <div className="glass-card" style={{ padding: '1rem' }}>
                        <p className="metric-label">PROFIT BARU</p>
                        <p style={{ fontWeight: '700' }} title={reverseResult.expected_profit}>{formatCurrency(reverseResult.expected_profit)}</p>
                      </div>
                      <div className="glass-card" style={{ padding: '1rem' }}>
                        <p className="metric-label">MARGIN BARU</p>
                        <p style={{ fontWeight: '700' }} title={reverseResult.expected_margin_percent}>{formatRawPercent(reverseResult.expected_margin_percent)}</p>
                      </div>
                      <div className="glass-card" style={{ padding: '1rem' }}>
                        <p className="metric-label">BEP ROAS BARU</p>
                        <p style={{ fontWeight: '700' }} title={reverseResult.break_even_roas}>{formatNumber(reverseResult.break_even_roas)}x</p>
                      </div>
                      <div className="glass-card" style={{ padding: '1rem' }}>
                        <p className="metric-label">MAX CPA BARU</p>
                        <p style={{ fontWeight: '700' }} title={reverseResult.max_cpa}>{formatCurrency(reverseResult.max_cpa)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <ArrowRightLeft size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>Masukkan target profit untuk melihat rekomendasi harga jual baru.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Ad Modal */}
      <AnimatePresence>
        {showAddAdModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddAdModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '2rem', zIndex: 10000 }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Tambah Data Performa Iklan</h3>
              <form onSubmit={handleAddAd}>
                <div className="form-group">
                  <label className="form-label">Nama Kampanye (Opsional)</label>
                  <input type="text" className="form-control" value={adForm.campaign} onChange={(e) => setAdForm({...adForm, campaign: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Biaya Iklan (Rp)</label>
                  <input type="number" className="form-control" value={adForm.spend} onChange={(e) => setAdForm({...adForm, spend: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">GMV Iklan (Omzet dari Iklan)</label>
                  <input type="number" className="form-control" value={adForm.gmv} onChange={(e) => setAdForm({...adForm, gmv: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Omzet Toko (Opsional)</span>
                    <small style={{ color: '#6366f1', cursor: 'help' }} title="Digunakan untuk hitung TACoS">Apa ini?</small>
                  </label>
                  <input type="number" className="form-control" placeholder="Iklan + Organik" value={adForm.total_sales} onChange={(e) => setAdForm({...adForm, total_sales: e.target.value})} />
                  <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Isi total omzet produk ini (termasuk yang tidak dari iklan) untuk analisis TACoS.</small>
                </div>
                <div className="form-group">
                  <label className="form-label">Jumlah Order Iklan</label>
                  <input type="number" className="form-control" value={adForm.orders} onChange={(e) => setAdForm({...adForm, orders: e.target.value})} required />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddAdModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Simpan Data</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdsPerformance;
