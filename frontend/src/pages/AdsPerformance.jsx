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
  Info
} from 'lucide-react';
import { storesApi, productsApi, adsApi, decisionApi, pricingApi } from '../api';

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
  const [adForm, setAdForm] = useState({ campaign: '', spend: '', gmv: '', orders: '' });
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
      alert("Analysis failed. Make sure product is listed in that store.");
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
      setAdForm({ campaign: '', spend: '', gmv: '', orders: '' });
    } catch { alert("Failed to add ad record"); }
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
    } catch { alert("Reverse pricing failed"); }
  };

  const getGradeColor = (grade) => {
    switch(grade) {
      case 'SCALABLE': return '#6366f1';
      case 'VIABLE': return '#22c55e';
      case 'RISKY': return '#f59e0b';
      case 'NOT_VIABLE': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  return (
    <>
      <div className="animate-fade-in">
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BarChart3 color="#8b5cf6" />
            Ads Analysis & Grading
          </h1>
          <p style={{ color: '#94a3b8' }}>Evaluasi performa iklan dan tentukan kelayakan scale-up produk.</p>
        </header>

        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1.5rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Store</label>
              <select className="form-control" value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)}>
                <option value="">Select a Store</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.marketplace_name})</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Product</label>
              <select className="form-control" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                <option value="">Select a Product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" style={{ padding: '0.8rem 2rem' }} onClick={handleAnalyze} disabled={loading}>
              {loading ? <RefreshCw className="animate-spin" /> : <Zap size={18} />} Analyze Viability
            </button>
          </div>
        </div>

        {decision && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', marginBottom: '2rem' }}>
              {/* Grading Card */}
              <div className="glass-card" style={{ padding: '2rem', borderLeft: `8px solid ${getGradeColor(decision.grade)}` }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <p className="metric-label">STATUS GRADING</p>
                  <h2 style={{ fontSize: '2.5rem', color: getGradeColor(decision.grade) }}>{decision.grade}</h2>
                  <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.5rem' }}>{decision.grade_reason}</p>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                  <div>
                    <p className="metric-label">MARGIN ORGANIK</p>
                    <p style={{ fontWeight: '700', fontSize: '1.25rem' }}>{decision.margin_percent.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="metric-label">PROFIT/ORDER</p>
                    <p style={{ fontWeight: '700', fontSize: '1.25rem', color: decision.profit_per_order >= 0 ? '#22c55e' : '#ef4444' }}>
                      Rp {decision.profit_per_order.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowReverseModal(true)}>
                    <ArrowRightLeft size={16} /> Reverse Price
                  </button>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddAdModal(true)}>
                    <Plus size={16} /> Add Ad Data
                  </button>
                </div>
              </div>

              {/* Alerts & Recommendations */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={20} color="#f59e0b" />
                  Alerts & Warnings
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
                  {decision.alerts.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Semua indikator sehat. Produk siap scale-up.</p>}
                </div>
                
                <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <p className="metric-label">BREAK-EVEN ROAS</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>{decision.break_even_roas}x</p>
                  </div>
                  <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <p className="metric-label">MAX CPA PER ORDER</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>Rp {decision.max_cpa.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ad Campaign Table */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} color="#6366f1" />
                Ad Performance Breakdown
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Spend</th>
                      <th>GMV</th>
                      <th>Orders</th>
                      <th>ROAS</th>
                      <th>CPA</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adsData.map(ad => (
                      <tr key={ad.id}>
                        <td style={{ fontWeight: '500' }}>{ad.campaign || '-'}</td>
                        <td>Rp {ad.spend.toLocaleString()}</td>
                        <td>Rp {ad.gmv.toLocaleString()}</td>
                        <td>{ad.orders}</td>
                        <td>
                          <span style={{ fontWeight: '700', color: ad.roas >= decision.break_even_roas ? '#22c55e' : '#ef4444' }}>
                            {ad.roas}x
                          </span>
                        </td>
                        <td>Rp {ad.cpa.toLocaleString()}</td>
                        <td>
                          <button onClick={async () => { if(window.confirm("Delete record?")) { await adsApi.delete(ad.id); handleAnalyze(); } }} className="btn btn-danger" style={{ padding: '0.4rem' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {adsData.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Belum ada data iklan untuk produk ini.</td></tr>}
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
                <h2 style={{ marginBottom: '0.5rem' }}>Reverse Pricing</h2>
                <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Cari harga jual ideal berdasarkan target profit.</p>
                
                <form onSubmit={handleReversePricing}>
                  <div className="form-group">
                    <label className="form-label">Target Profit Type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <button type="button" className={`btn ${reverseForm.target_type === 'percent' ? 'btn-primary' : 'btn-secondary'}`} 
                        onClick={() => setReverseForm({...reverseForm, target_type: 'percent'})}>Percentage Margin</button>
                      <button type="button" className={`btn ${reverseForm.target_type === 'fixed' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setReverseForm({...reverseForm, target_type: 'fixed'})}>Fixed Amount</button>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">{reverseForm.target_type === 'percent' ? 'Target Margin (e.g. 0.25 for 25%)' : 'Target Profit (Rp)'}</label>
                    <input type="number" step="0.01" className="form-control" placeholder={reverseForm.target_type === 'percent' ? "0.2" : "25000"} 
                      value={reverseForm.target_value} onChange={(e) => setReverseForm({...reverseForm, target_value: parseFloat(e.target.value)})} required />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '2rem', justifyContent: 'center' }}>
                    <RefreshCw size={18} /> Calculate Recommended Price
                  </button>
                </form>
              </div>

              <div style={{ padding: '2.5rem', background: 'rgba(99, 102, 241, 0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {reverseResult ? (
                  <div className="animate-fade-in text-center">
                    <p className="metric-label">RECOMMENDED SELLING PRICE</p>
                    <h2 style={{ fontSize: '2.5rem', color: '#6366f1', marginBottom: '1.5rem' }}>Rp {reverseResult.recommended_price.toLocaleString()}</h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left' }}>
                      <div className="glass-card" style={{ padding: '1rem' }}>
                        <p className="metric-label">TOTAL PROFIT</p>
                        <p style={{ fontWeight: '700' }}>Rp {reverseResult.expected_profit.toLocaleString()}</p>
                      </div>
                      <div className="glass-card" style={{ padding: '1rem' }}>
                        <p className="metric-label">MARGIN %</p>
                        <p style={{ fontWeight: '700' }}>{reverseResult.expected_margin_percent.toFixed(1)}%</p>
                      </div>
                      <div className="glass-card" style={{ padding: '1rem' }}>
                        <p className="metric-label">BEP ROAS</p>
                        <p style={{ fontWeight: '700' }}>{reverseResult.break_even_roas}x</p>
                      </div>
                      <div className="glass-card" style={{ padding: '1rem' }}>
                        <p className="metric-label">MAX CPA</p>
                        <p style={{ fontWeight: '700' }}>Rp {reverseResult.max_cpa.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <ArrowRightLeft size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>Masukkan target profit untuk melihat rekomendasi harga jual.</p>
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
              <h3 style={{ marginBottom: '1.5rem' }}>Add Ad Performance Record</h3>
              <form onSubmit={handleAddAd}>
                <div className="form-group">
                  <label className="form-label">Campaign Name (Optional)</label>
                  <input type="text" className="form-control" value={adForm.campaign} onChange={(e) => setAdForm({...adForm, campaign: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Spend (Rp)</label>
                  <input type="number" className="form-control" value={adForm.spend} onChange={(e) => setAdForm({...adForm, spend: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">GMV (Sales Rp)</label>
                  <input type="number" className="form-control" value={adForm.gmv} onChange={(e) => setAdForm({...adForm, gmv: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Orders Count</label>
                  <input type="number" className="form-control" value={adForm.orders} onChange={(e) => setAdForm({...adForm, orders: e.target.value})} required />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddAdModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Data</button>
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
