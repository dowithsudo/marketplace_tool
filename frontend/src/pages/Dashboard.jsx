import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Store, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calculator,
  ArrowRight,
  Info,
  X,
  Zap,
  DollarSign
} from 'lucide-react';
import { materialsApi, productsApi, storesApi, importsApi } from '../api';
import { formatCurrency, formatNumber, formatRawPercent, formatDecimalPercent } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  CartesianGrid 
} from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ materials: 0, products: 0, stores: 0 });
  const [performance, setPerformance] = useState([]);
  const [health, setHealth] = useState({ status: 'loading', riskCount: 0, goodCount: 0 });
  const [loading, setLoading] = useState(true);
  
  // Quick Calc State
  const [showCalc, setShowCalc] = useState(false);
  const [calcMode, setCalcMode] = useState('profit'); // 'profit' or 'ads'
  const [calcForm, setCalcForm] = useState({ price: '', hpp: '', admin_fee_percent: 5, shipping: 0, ad_cost: 0 });
  const [adsCalcForm, setAdsCalcForm] = useState({ spend: '', gmv: '', margin_percent: 30 });
  const [calcResult, setCalcResult] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Parallel lighter fetch
      const [mRes, pRes, sRes, perfRes] = await Promise.all([
        materialsApi.getAll(),
        productsApi.getAll(),
        storesApi.getAll(),
        importsApi.getPerformance({ 
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
        })
      ]);

      setStats({
        materials: mRes.data.length,
        products: pRes.data.length,
        stores: sRes.data.length
      });

      setPerformance(perfRes.data);

      // Simple explicit rule-based check on loaded data
      let risks = 0;
      let good = 0;
      const issues = [];

      // Check Store Setup
      if (sRes.data.length === 0) {
        issues.push({ type: 'danger', msg: "Belum ada toko yang terhubung", link: '/marketplaces' });
        risks++;
      } else {
        good++;
      }

      // Check for performance data
      if (perfRes.data.length === 0) {
        issues.push({ type: 'info', msg: "Belum ada data penjualan. Impor laporan Shopee untuk melihat analisis.", link: '/sales-import' });
      }

      // Check Products Setup (Approximation)
      if (pRes.data.length === 0) {
        issues.push({ type: 'warning', msg: "Belum ada produk yang didaftarkan", link: '/products' });
        risks++;
      } else {
        good++;
      }
      
      // Basic Health Logic
      setHealth({
        status: risks > 0 ? 'needs_attention' : 'healthy',
        riskCount: risks,
        analysis: issues,
        goodCount: good
      });

    } catch (error) {
      console.error("Dashboard data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = performance.reduce((acc, curr) => acc + curr.revenue, 0); // Net
  const totalGross = performance.reduce((acc, curr) => acc + (curr.gross_revenue || curr.revenue), 0);
  const totalOrders = performance.reduce((acc, curr) => acc + curr.orders, 0);
  const avgConv = performance.length > 0 
    ? performance.reduce((acc, curr) => acc + curr.conversion_rate, 0) / performance.length 
    : 0;
  
  const cancelRate = totalGross > 0 ? (1 - (totalRevenue / totalGross)) : 0;

  const calculateQuickProfit = () => {
    const price = parseFloat(calcForm.price) || 0;
    const hpp = parseFloat(calcForm.hpp) || 0;
    const fees = price * (parseFloat(calcForm.admin_fee_percent) / 100);
    const shipping = parseFloat(calcForm.shipping) || 0;
    const ads = parseFloat(calcForm.ad_cost) || 0;

    const totalCost = hpp + fees + shipping + ads;
    const profit = price - totalCost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    
    // Safety Threshold (Simple Rule)
    const status = profit > 0 
      ? (margin > 15 ? 'AMAN' : 'WASPADA') 
      : 'RUGI';

    setCalcResult({ profit, margin, status, totalCost, mode: 'profit' });
  };

  const calculateAdsEffectiveness = () => {
    const spend = parseFloat(adsCalcForm.spend) || 0;
    const gmv = parseFloat(adsCalcForm.gmv) || 0;
    const margin = parseFloat(adsCalcForm.margin_percent) / 100;
    
    if (spend <= 0 || gmv <= 0) return;

    const roas = gmv / spend;
    const grossProfit = gmv * margin;
    const netProfit = grossProfit - spend;
    const roi = (netProfit / spend) * 100;

    const status = netProfit > 0 ? (roi > 50 ? 'SANGAT BAGUS' : 'UNTUNG') : 'RUGI';

    setCalcResult({ 
      roas, 
      netProfit, 
      roi, 
      status, 
      grossProfit,
      mode: 'ads'
    });
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem' }}>
            <Zap color="#f59e0b" fill="#f59e0b" /> Pusat Kontrol Bisnis
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
            Pantau kesehatan bisnis, cek tugas penting, dan hitung simulasi profit.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowCalc(true); setCalcMode('profit'); setCalcResult(null); }} style={{ padding: '0.75rem 1.5rem', gap: '0.5rem' }}>
          <Calculator size={20} />
          Simulasi & Kalkulator
        </button>
      </header>
      
      {/* Performance Overview (New) */}
      {performance.length > 0 && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
            <div>
              <p className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={14} color="#22c55e" /> NET REVENUE (30 HARI)
              </p>
              <p style={{ fontSize: '2rem', fontWeight: '800', color: '#fff' }}>{formatCurrency(totalRevenue)}</p>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                Gross: {formatCurrency(totalGross)}
              </p>
            </div>
            <div>
              <p className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={14} color="#ef4444" /> CANCEL RATE
              </p>
              <p style={{ fontSize: '2rem', fontWeight: '800', color: cancelRate > 0.1 ? '#ef4444' : '#fff' }}>
                {formatDecimalPercent(cancelRate)}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                Selisih: {formatCurrency(totalGross - totalRevenue)}
              </p>
            </div>
            <div>
              <p className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={14} color="#3b82f6" /> TOTAL PESANAN
              </p>
              <p style={{ fontSize: '2rem', fontWeight: '800', color: '#fff' }}>{totalOrders}</p>
            </div>
            <div>
              <p className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={14} color="#ec4899" /> AVG CONVERSION
              </p>
              <p style={{ fontSize: '2rem', fontWeight: '800', color: avgConv > 0.05 ? '#22c55e' : '#f59e0b' }}>
                {formatDecimalPercent(avgConv)}
              </p>
            </div>
          </div>

          <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performance}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                  }}
                />
                <YAxis hide />
                <ChartTooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value) : value, 
                    name === 'revenue' ? 'Omzet' : 'Pesanan'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Net Revenue"
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="gross_revenue" 
                  name="Gross Revenue"
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        
        {/* Left Column: Health & Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Business Health Summary */}
          <div className="glass-card" style={{ padding: '2rem', borderLeft: `6px solid ${health.status === 'healthy' ? '#22c55e' : '#f59e0b'}` }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {health.status === 'healthy' ? <CheckCircle2 color="#22c55e" /> : <AlertTriangle color="#f59e0b" />}
              Status Kesehatan Bisnis
            </h3>
            
            {loading ? <p>Menganalisis data...</p> : (
              <div>
                <p style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '1rem' }}>
                  {health.status === 'healthy' 
                    ? "Semua sistem berjalan normal."
                    : "Ada beberapa hal yang perlu perhatian Anda agar bisnis tetap untung."}
                </p>
                 {health.status === 'healthy' && (
                  <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Tidak ada isu kritis yang terdeteksi saat ini.</p>
                )}

                <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                   <div>
                     <p className="metric-label">TOTAL PRODUK</p>
                     <p style={{ fontSize: '1.5rem', fontWeight: "700" }}>{formatNumber(stats.products)}</p>
                   </div>
                   <div>
                     <p className="metric-label">TOKO AKTIF</p>
                     <p style={{ fontSize: '1.5rem', fontWeight: "700" }}>{formatNumber(stats.stores)}</p>
                   </div>
                   <div>
                     <p className="metric-label">BAHAN BAKU</p>
                     <p style={{ fontSize: '1.5rem', fontWeight: "700" }}>{formatNumber(stats.materials)}</p>
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Items / "Tugas Penting" */}
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.9rem', letterSpacing: '0.05em' }}>DAFTAR TUGAS PENTING</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              {(!loading && health.analysis && health.analysis.map((issue, idx) => (
                <div key={idx} onClick={() => navigate(issue.link)}
                  style={{ 
                  padding: '1.25rem', 
                  background: 'rgba(23, 23, 23, 0.6)', 
                  border: `1px solid ${issue.type === 'danger' ? '#ef4444' : '#f59e0b'}`,
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {issue.type === 'danger' ? <X color="#ef4444" /> : <AlertTriangle color="#f59e0b" />}
                    <div>
                         <p style={{ fontWeight: '600', fontSize: '1.05rem' }}>{issue.msg}</p>
                         <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Klik untuk menyelesaikan masalah ini</p>
                    </div>
                  </div>
                  <ArrowRight size={20} color="#64748b" />
                </div>
              )))}

              {/* Default persistent tasks if everything is clear */}
              {(!loading && (!health.analysis || health.analysis.length === 0)) && (
                <div style={{ padding: '1.5rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <CheckCircle2 />
                   <p style={{ fontWeight: '500' }}>Kerja bagus! Tidak ada tugas mendesak saat ini.</p>
                </div>
              )}

              {/* Static helpful shortcuts disguised as tasks */}
               <div onClick={() => navigate('/marketplaces')}
                  className="hover-card"
                  style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <DollarSign color="#6366f1" />
                    <div>
                         <p style={{ fontWeight: '600' }}>Cek Profitabilitas Marketplace</p>
                         <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Pastikan harga jual Anda sudah menutup semua biaya admin & layanan.</p>
                    </div>
                  </div>
                  <ArrowRight size={20} color="#64748b" />
                </div>
                
                <div onClick={() => { setShowCalc(true); setCalcMode('ads'); setCalcResult(null); }}
                  className="hover-card"
                  style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <TrendingUp color="#ec4899" />
                    <div>
                         <p style={{ fontWeight: '600' }}>Hitung Efektivitas Iklan (Manual)</p>
                         <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Cek apakah iklan Anda untung tanpa perlu database.</p>
                    </div>
                  </div>
                  <Calculator size={20} color="#64748b" />
                </div>

            </div>
          </div>
        </div>

        {/* Right Column: Quick Stats & Calculator Prompt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
           {/* Quick Navigation Cards */}
           <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
             <div onClick={() => navigate('/products')} className="glass-card hover-card" style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <div>
                 <p className="metric-label">KELOLA PRODUK</p>
                 <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Atur HPP, BOM, dan Stok</p>
               </div>
               <Package color="#ec4899" size={28} />
             </div>
             
             <div onClick={() => navigate('/marketplaces')} className="glass-card hover-card" style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <div>
                 <p className="metric-label">KELOLA TOKO</p>
                 <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Hubungkan Marketplace</p>
               </div>
               <Store color="#22c55e" size={28} />
             </div>
             
             <div onClick={() => navigate('/materials')} className="glass-card hover-card" style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <div>
                 <p className="metric-label">DATABASE BAHAN</p>
                 <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Update harga beli bahan baku</p>
               </div>
               <ShoppingBag color="#6366f1" size={28} />
             </div>
           </div>

           {/* Pro Tip Card */}
           <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))', borderRadius: '16px', border: '1px solid rgba(99,102,241,0.2)' }}>
             <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8', marginBottom: '0.5rem' }}>
               <Info size={18} /> Tips Bisnis
             </h4>
             <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#cbd5e1' }}>
               Jangan lupa untuk selalu update harga bahan baku setiap minggu agar perhitungan HPP dan profit Anda selalu akurat.
             </p>
           </div>
        </div>
      </div>

      {/* Quick Profit Calculator Modal (Client Side Only) */}
      <AnimatePresence>
        {showCalc && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
               onClick={() => setShowCalc(false)}
               style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }} 
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="glass-card" 
               style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '0', overflow: 'hidden', zIndex: 10000 }}
            >
              <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calculator color="#22c55e" /> Alat Hitung Cepat
                </h3>
                <button onClick={() => setShowCalc(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              {/* Calculator Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button style={{ flex: 1, padding: '1rem', background: calcMode === 'profit' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: calcMode === 'profit' ? 'white' : '#94a3b8', cursor: 'pointer', fontWeight: '500' }}
                  onClick={() => { setCalcMode('profit'); setCalcResult(null); }}>
                  Simulasi Margin Produk
                </button>
                <button style={{ flex: 1, padding: '1rem', background: calcMode === 'ads' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: calcMode === 'ads' ? 'white' : '#94a3b8', cursor: 'pointer', fontWeight: '500' }}
                   onClick={() => { setCalcMode('ads'); setCalcResult(null); }}>
                  Simulasi Iklan (ROAS)
                </button>
              </div>
              
              <div style={{ padding: '1.5rem' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                  <Info size={16} style={{ flexShrink: 0 }} />
                   Data ini hanya simulasi coret-coretan. Tidak akan disimpan ke database Anda.
                </div>

                {calcMode === 'profit' ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Harga Jual (Rp)</label>
                        <input type="number" className="form-control" placeholder="0" 
                          value={calcForm.price} onChange={e => setCalcForm({...calcForm, price: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Modal / HPP (Rp)</label>
                        <input type="number" className="form-control" placeholder="0" 
                          value={calcForm.hpp} onChange={e => setCalcForm({...calcForm, hpp: e.target.value})} />
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Fee MP (%)</label>
                        <input type="number" step="0.1" className="form-control" placeholder="5" 
                          value={calcForm.admin_fee_percent} onChange={e => setCalcForm({...calcForm, admin_fee_percent: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Iklan/Order</label>
                        <input type="number" className="form-control" placeholder="0" 
                          value={calcForm.ad_cost} onChange={e => setCalcForm({...calcForm, ad_cost: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Ongkir/Lain</label>
                        <input type="number" className="form-control" placeholder="0" 
                          value={calcForm.shipping} onChange={e => setCalcForm({...calcForm, shipping: e.target.value})} />
                      </div>
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem' }} onClick={calculateQuickProfit}>
                      Hitung Hasil Profit
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Total Pengeluaran Iklan</label>
                        <input type="number" className="form-control" placeholder="0" 
                          value={adsCalcForm.spend} onChange={e => setAdsCalcForm({...adsCalcForm, spend: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Total Omzet Iklan (GMV)</label>
                        <input type="number" className="form-control" placeholder="0" 
                          value={adsCalcForm.gmv} onChange={e => setAdsCalcForm({...adsCalcForm, gmv: e.target.value})} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label">Estimasi Margin Produk (%)</label>
                      <input type="number" step="1" className="form-control" placeholder="30" 
                        value={adsCalcForm.margin_percent} onChange={e => setAdsCalcForm({...adsCalcForm, margin_percent: e.target.value})} />
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Berapa % keuntungan kotor dari harga produk Anda.</p>
                    </div>
                    
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem' }} onClick={calculateAdsEffectiveness}>
                      Hitung Kinerja Iklan
                    </button>
                  </>
                )}

                {calcResult && (
                  <div className="animate-fade-in" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {calcResult.mode === 'ads' ? (
                       <>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                           <span style={{ color: '#94a3b8' }}>ROAS (Efektivitas)</span>
                           <span style={{ fontWeight: '600' }}>{formatNumber(calcResult.roas)}x</span>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                           <span style={{ color: '#94a3b8' }}>Gross Profit Produk</span>
                           <span>{formatCurrency(calcResult.grossProfit)}</span>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                           <span style={{ fontWeight: '500' }}>UNTUNG BERSIH IKLAN</span>
                           <div style={{ textAlign: 'right' }}>
                             <h2 style={{ 
                               fontSize: '1.5rem', 
                               color: calcResult.status === 'RUGI' ? '#ef4444' : calcResult.status.includes('BAGUS') ? '#22c55e' : '#f59e0b',
                               margin: 0
                             }}>
                               {formatCurrency(calcResult.netProfit)}
                             </h2>
                             <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                               ROI: {formatNumber(calcResult.roi)}% • Status: <b>{calcResult.status}</b>
                             </p>
                           </div>
                         </div>
                       </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#94a3b8' }}>Total Biaya & Potongan</span>
                          <span>{formatCurrency(calcResult.totalCost)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <span style={{ fontWeight: '500' }}>ESTIMASI BERSIH</span>
                          <div style={{ textAlign: 'right' }}>
                            <h2 style={{ 
                              fontSize: '1.5rem', 
                              color: calcResult.status === 'RUGI' ? '#ef4444' : calcResult.status === 'AMAN' ? '#22c55e' : '#f59e0b',
                              margin: 0
                            }}>
                              {formatCurrency(calcResult.profit)}
                            </h2>
                            <p style={{ fontSize: '0.85rem', color: calcResult.status === 'RUGI' ? '#ef4444' : '#94a3b8' }}>
                              Margin: {formatRawPercent(calcResult.margin)} • Status: <b>{calcResult.status}</b>
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
