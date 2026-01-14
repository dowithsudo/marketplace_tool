import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  X, 
  Save,
  ShoppingBag,
  Store,
  DollarSign,
  Settings2,
  ListFilter,
  ChevronRight,
  Calculator,
  Percent,
  Tag
} from 'lucide-react';
import { 
  marketplacesApi, 
  storesApi, 
  marketplaceCostTypesApi, 
  storeMarketplaceCostsApi,
  productsApi,
  storeProductsApi,
  pricingApi,
  discountsApi
} from '../api';

const Marketplaces = () => {
  const [marketplaces, setMarketplaces] = useState([]);
  const [stores, setStores] = useState([]);
  const [costTypes, setCostTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  
  const [selectedStore, setSelectedStore] = useState(null);
  
  // Forms state
  const [storeForm, setStoreForm] = useState({ id: '', marketplace_id: '', name: '' });
  const [costForm, setCostForm] = useState({ cost_type_id: '', value: '' });
  const [pricingForm, setPricingForm] = useState({ product_id: '', harga_jual: '' });
  
  // Active store products and analysis
  const [storeProducts, setStoreProducts] = useState([]);
  const [pricingAnalysis, setPricingAnalysis] = useState(null);

  useEffect(() => {
    fetchBaseData();
  }, []);

  const fetchBaseData = async () => {
    try {
      const [mkts, ctypes, prods] = await Promise.all([
        marketplacesApi.getAll(),
        marketplaceCostTypesApi.getAll(),
        productsApi.getAll()
      ]);
      setMarketplaces(mkts.data);
      setCostTypes(ctypes.data);
      setProducts(prods.data);
      
      const storesResp = await storesApi.getAll();
      setStores(storesResp.data);
    } catch (error) {
      console.error("Failed to load marketplace data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStoreCosts = async (store) => {
    setSelectedStore(store);
    setLoading(true);
    try {
      const costs = await storeMarketplaceCostsApi.getAll(store.id);
      const sps = await storeProductsApi.getAll({ store_id: store.id });
      setSelectedStore({ ...store, costs: costs.data });
      setStoreProducts(sps.data);
      setShowCostModal(true);
    } catch (error) {
      alert("Failed to load store details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCost = async (e) => {
    e.preventDefault();
    try {
      await storeMarketplaceCostsApi.create({
        store_id: selectedStore.id,
        ...costForm
      });
      const costs = await storeMarketplaceCostsApi.getAll(selectedStore.id);
      setSelectedStore({ ...selectedStore, costs: costs.data });
      setCostForm({ cost_type_id: '', value: '' });
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to add cost");
    }
  };

  const handleAddStoreProduct = async (e) => {
    e.preventDefault();
    try {
      await storeProductsApi.create({
        store_id: selectedStore.id,
        ...pricingForm
      });
      const sps = await storeProductsApi.getAll({ store_id: selectedStore.id });
      setStoreProducts(sps.data);
      setPricingForm({ product_id: '', harga_jual: '' });
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to add product pricing");
    }
  };

  const handleCalculatePricing = async (spId) => {
    try {
      const resp = await pricingApi.calculate(spId);
      setPricingAnalysis(resp.data);
      setShowPricingModal(true);
    } catch (error) {
      alert("Pricing calculation failed");
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShoppingBag color="#6366f1" />
            Marketplaces & Stores
          </h1>
          <p style={{ color: '#94a3b8' }}>Konfigurasi biaya per toko dan kalkulasi pricing forward.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={async () => {
            const name = prompt("Enter Marketplace Name (e.g. Shopee):");
            if(name) {
              await marketplacesApi.create({ id: name.toLowerCase(), name });
              fetchBaseData();
            }
          }}>
            <ShoppingBag size={18} /> Add Mktplace
          </button>
          <button className="btn btn-primary" onClick={() => setShowStoreModal(true)}>
            <Plus size={18} /> Add Store
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, min_max(300px, 1fr))', gap: '1.5rem' }}>
        {stores.map(store => (
          <motion.div key={store.id} className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="badge badge-info">{store.marketplace_name}</span>
              <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={async () => {
                if(window.confirm("Delete store?")) {
                  await storesApi.delete(store.id);
                  fetchBaseData();
                }
              }}><Trash2 size={14} /></button>
            </div>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Store size={20} color="#6366f1" />
              {store.name}
            </h3>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleOpenStoreCosts(store)}>
              <Settings2 size={16} /> Manage Pricing & Costs
              <ChevronRight size={16} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Store Management Modal (Costs & Products) */}
      <AnimatePresence>
        {showCostModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCostModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto', padding: '2.5rem', zIndex: 1001 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem' }}>{selectedStore?.name}</h2>
                  <p style={{ color: '#94a3b8' }}>{selectedStore?.marketplace_name} Store Configuration</p>
                </div>
                <button onClick={() => setShowCostModal(false)} className="btn btn-secondary" style={{ padding: '0.5rem' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'min_max(400px, 1fr) 350px', gap: '2.5rem' }}>
                {/* Left side: Product Pricing */}
                <div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Tag size={18} color="#ec4899" />
                      Store Product Pricing
                    </h4>
                    <form onSubmit={handleAddStoreProduct} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <select className="form-control" style={{ flex: 1.5 }} value={pricingForm.product_id} 
                        onChange={(e) => setPricingForm({...pricingForm, product_id: e.target.value})} required>
                        <option value="">Select Product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                      </select>
                      <input type="number" className="form-control" style={{ flex: 1 }} placeholder="Selling Price" 
                        value={pricingForm.harga_jual} onChange={(e) => setPricingForm({...pricingForm, harga_jual: e.target.value})} required />
                      <button type="submit" className="btn btn-primary"><Plus size={18} /></button>
                    </form>

                    <div className="table-container">
                      <table style={{ fontSize: '0.9rem' }}>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Hrg Jual</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {storeProducts.map(sp => (
                            <tr key={sp.id}>
                              <td style={{ fontWeight: '500' }}>{sp.product_name}</td>
                              <td style={{ fontWeight: '600' }}>Rp {sp.harga_jual.toLocaleString()}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button onClick={() => handleCalculatePricing(sp.id)} className="btn btn-secondary" style={{ padding: '0.4rem', fontSize: '0.75rem', gap: '0.25rem' }}>
                                    <Calculator size={14} /> Calc
                                  </button>
                                  <button onClick={async () => {
                                    if(window.confirm("Remove pricing?")) {
                                      await storeProductsApi.delete(sp.id);
                                      const sps = await storeProductsApi.getAll({ store_id: selectedStore.id });
                                      setStoreProducts(sps.data);
                                    }
                                  }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right side: Marketplace Costs */}
                <div>
                  <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Percent size={18} color="#6366f1" />
                      Dynamic Fee Structure
                    </h4>
                    <form onSubmit={handleAddCost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                      <select className="form-control" value={costForm.cost_type_id} 
                        onChange={(e) => setCostForm({...costForm, cost_type_id: e.target.value})} required>
                        <option value="">Select Fee Type</option>
                        {costTypes.map(ct => (
                          <option key={ct.id} value={ct.id}>{ct.name} ({ct.calc_type})</option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="number" step="0.0001" className="form-control" placeholder="Value (e.g. 0.05 for 5%)" 
                          value={costForm.value} onChange={(e) => setCostForm({...costForm, value: e.target.value})} required />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.2rem' }}><Plus size={20} /></button>
                      </div>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedStore?.costs?.map(cost => (
                        <div key={cost.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px' }}>
                          <div>
                            <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{cost.cost_type_name}</p>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {cost.calc_type === 'percent' ? `${(cost.value * 100).toFixed(1)}%` : `Rp ${cost.value.toLocaleString()}`}
                              {cost.calc_type === 'percent' && ` of ${cost.apply_to === 'price' ? 'Base' : 'After Disc'}`}
                            </p>
                          </div>
                          <button onClick={async () => {
                            await storeMarketplaceCostsApi.delete(cost.id);
                            const costs = await storeMarketplaceCostsApi.getAll(selectedStore.id);
                            setSelectedStore({ ...selectedStore, costs: costs.data });
                          }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pricing Analysis Modal */}
      <AnimatePresence>
        {showPricingModal && pricingAnalysis && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPricingModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '2.5rem', zIndex: 1101, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: '#6366f1', fontSize: '2rem', marginBottom: '0.5rem' }}>Pricing Analysis</h2>
                <p style={{ color: '#94a3b8' }}>{pricingAnalysis.product_name} at {pricingAnalysis.store_name}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                  <span>Selling Price</span>
                  <span style={{ fontWeight: '600' }}>Rp {pricingAnalysis.harga_jual.toLocaleString()}</span>
                </div>
                
                <div style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cost Breakdown</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.95rem' }}>HPP (Production)</span>
                      <span> - Rp {pricingAnalysis.hpp.toLocaleString()}</span>
                    </div>
                    {pricingAnalysis.biaya_marketplace_breakdown.map(cost => (
                      <div key={cost.cost_type_id} style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                        <span style={{ fontSize: '0.95rem' }}>{cost.cost_type_name}</span>
                        <span> - Rp {cost.calculated_cost.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1rem', padding: '1.5rem', background: pricingAnalysis.profit_per_order >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '16px', textAlign: 'center' }}>
                  <h4 style={{ color: pricingAnalysis.profit_per_order >= 0 ? '#22c55e' : '#ef4444', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Estimated Profit</h4>
                  <p style={{ fontSize: '2.25rem', fontWeight: '800', color: pricingAnalysis.profit_per_order >= 0 ? '#22c55e' : '#ef4444' }}>
                    Rp {pricingAnalysis.profit_per_order.toLocaleString()}
                  </p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: '600' }}>
                    {pricingAnalysis.margin_percent.toFixed(2)}% Margin
                  </p>
                </div>
              </div>

              <button className="btn btn-secondary" style={{ width: '100%', marginTop: '2rem', justifyContent: 'center' }} onClick={() => setShowPricingModal(false)}>Close Analysis</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Store Addition Modal */}
      <AnimatePresence>
        {showStoreModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStoreModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '2rem', zIndex: 1001 }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Add New Store</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await storesApi.create(storeForm);
                  fetchBaseData();
                  setShowStoreModal(false);
                  setStoreForm({ id: '', marketplace_id: '', name: '' });
                } catch (error) { alert("Failed to add store"); }
              }}>
                <div className="form-group">
                  <label className="form-label">Store ID</label>
                  <input type="text" className="form-control" placeholder="e.g. shopee-store-1" value={storeForm.id} onChange={(e) => setStoreForm({...storeForm, id: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Marketplace</label>
                  <select className="form-control" value={storeForm.marketplace_id} onChange={(e) => setStoreForm({...storeForm, marketplace_id: e.target.value})} required>
                    <option value="">Select Marketplace</option>
                    {marketplaces.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input type="text" className="form-control" placeholder="e.g. Hikmah Mandiri" value={storeForm.name} onChange={(e) => setStoreForm({...storeForm, name: e.target.value})} required />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowStoreModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Save size={18} /> Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Marketplaces;
