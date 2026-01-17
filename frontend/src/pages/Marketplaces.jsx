import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  X, 
  Save,
  ShoppingBag,
  Store,
  Settings2,
  ChevronRight,
  Calculator,
  Percent,
  Tag,
  Edit2,
  Undo2
} from 'lucide-react';
import { 
  marketplacesApi, 
  storesApi, 
  marketplaceCostTypesApi, 
  storeProductMarketplaceCostsApi,
  productsApi,
  storeProductsApi,
  pricingApi
} from '../api';
import { formatCurrency, formatRawPercent, formatDecimalPercent } from '../utils/formatters';

const Marketplaces = () => {
  const [marketplaces, setMarketplaces] = useState([]);
  const [stores, setStores] = useState([]);
  const [costTypes, setCostTypes] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Modals state
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [showCostTypeModal, setShowCostTypeModal] = useState(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedStoreProduct, setSelectedStoreProduct] = useState(null);
  const [spCosts, setSpCosts] = useState([]);
  
  // Forms state
  const [storeForm, setStoreForm] = useState({ id: '', marketplace_id: '', name: '' });
  const [marketplaceForm, setMarketplaceForm] = useState({ id: '', name: '' });
  const [editingMarketplaceId, setEditingMarketplaceId] = useState(null);
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [costTypeForm, setCostTypeForm] = useState({ name: '', calc_type: 'percent' });
  const [costForm, setCostForm] = useState({ cost_type_id: '', value: '' });
  const [pricingForm, setPricingForm] = useState({ product_id: '', harga_jual: '' });
  
  // Active store products and analysis
  const [storeProducts, setStoreProducts] = useState([]);
  const [pricingAnalysis, setPricingAnalysis] = useState(null);
  const [editingSpId, setEditingSpId] = useState(null);
  const [editingCostTypeId, setEditingCostTypeId] = useState(null);
  const [editingCostId, setEditingCostId] = useState(null);

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
    }
  };

  useEffect(() => {
    let ignore = false;
    async function startFetching() {
      try {
        const [mkts, ctypes, prods] = await Promise.all([
          marketplacesApi.getAll(),
          marketplaceCostTypesApi.getAll(),
          productsApi.getAll()
        ]);
        if (!ignore) {
          setMarketplaces(mkts.data);
          setCostTypes(ctypes.data);
          setProducts(prods.data);
        }
        
        const storesResp = await storesApi.getAll();
        if (!ignore) {
          setStores(storesResp.data);
        }
      } catch (error) {
        console.error("Failed to load marketplace data", error);
      }
    }
    startFetching();
    return () => { ignore = true; };
  }, []);

  const handleOpenStoreCosts = async (store) => {
    setSelectedStore(store);
    setSelectedStoreProduct(null);
    setSpCosts([]);
    try {
      const sps = await storeProductsApi.getAll({ store_id: store.id });
      setStoreProducts(sps.data);
      setShowCostModal(true);
    } catch {
      alert("Gagal memuat detail toko");
    }
  };

  const handleSelectStoreProduct = async (sp) => {
    setSelectedStoreProduct(sp);
    try {
      const costs = await storeProductMarketplaceCostsApi.getAll(sp.id);
      setSpCosts(costs.data);
    } catch {
      alert("Gagal memuat biaya produk");
    }
  };

  const handleAddCost = async (e) => {
    e.preventDefault();
    if (!selectedStoreProduct) {
      alert("Mohon pilih produk terlebih dahulu");
      return;
    }
    try {
      if (editingCostId) {
        await storeProductMarketplaceCostsApi.update(editingCostId, {
          ...costForm
        });
      } else {
        await storeProductMarketplaceCostsApi.create({
          store_product_id: selectedStoreProduct.id,
          ...costForm
        });
      }
      const costs = await storeProductMarketplaceCostsApi.getAll(selectedStoreProduct.id);
      setSpCosts(costs.data);
      setCostForm({ cost_type_id: '', value: '' });
      setEditingCostId(null);
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal menyimpan biaya");
    }
  };

  const handleAddStoreProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingSpId) {
        await storeProductsApi.update(editingSpId, {
          store_id: selectedStore.id,
          ...pricingForm
        });
      } else {
        await storeProductsApi.create({
          store_id: selectedStore.id,
          ...pricingForm
        });
      }
      
      const sps = await storeProductsApi.getAll({ store_id: selectedStore.id });
      setStoreProducts(sps.data);
      setPricingForm({ product_id: '', harga_jual: '' });
      setEditingSpId(null);
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal menyimpan harga produk");
    }
  };

  const handleCalculatePricing = async (spId) => {
    try {
      const resp = await pricingApi.calculate(spId);
      setPricingAnalysis(resp.data);
      setShowPricingModal(true);
    } catch {
      alert("Kalkulasi harga gagal");
    }
  };

  const handleMarketplaceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMarketplaceId) {
        await marketplacesApi.update(editingMarketplaceId, { name: marketplaceForm.name });
      } else {
        // Auto-generate ID if empty from name
        const id = marketplaceForm.id || marketplaceForm.name.toLowerCase().replace(/\s+/g, '-');
        await marketplacesApi.create({ id, name: marketplaceForm.name });
      }
      fetchBaseData();
      setShowMarketplaceModal(false);
      setMarketplaceForm({ id: '', name: '' });
      setEditingMarketplaceId(null);
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal menyimpan marketplace");
    }
  };



  const handleCostTypeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCostTypeId) {
        await marketplaceCostTypesApi.update(editingCostTypeId, {
          name: costTypeForm.name,
          calc_type: costTypeForm.calc_type
        });
      } else {
        await marketplaceCostTypesApi.create({
          id: costTypeForm.name.toLowerCase().replace(/\s+/g, '-'),
          name: costTypeForm.name,
          calc_type: costTypeForm.calc_type,
          apply_to: 'price'
        });
      }
      const ctypes = await marketplaceCostTypesApi.getAll();
      setCostTypes(ctypes.data);
      setShowCostTypeModal(false);
      setCostTypeForm({ name: '', calc_type: 'percent' });
      setEditingCostTypeId(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menyimpan tipe biaya");
    }
  };

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { id: '...', name: '...', type: 'marketplace' | 'store' | 'cost' | 'cost_type' }

  const handleRequestDelete = (e, m, type = 'marketplace') => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setItemToDelete({ ...m, type });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'marketplace') {
        await marketplacesApi.delete(itemToDelete.id);
      } else if (itemToDelete.type === 'store') {
        await storesApi.delete(itemToDelete.id);
      } else if (itemToDelete.type === 'cost') {
        await storeProductMarketplaceCostsApi.delete(itemToDelete.id);
        if (selectedStoreProduct) {
           const costs = await storeProductMarketplaceCostsApi.getAll(selectedStoreProduct.id);
           setSpCosts(costs.data);
        }
      } else if (itemToDelete.type === 'cost_type') {
         await marketplaceCostTypesApi.delete(itemToDelete.id);
         const res = await marketplaceCostTypesApi.getAll();
         setCostTypes(res.data);
      }
      
      // Always fetch base data to keep lists synced
      fetchBaseData();
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
       console.error("Delete failed:", error);
       alert(error.response?.data?.detail || `Gagal menghapus data. Mohon pastikan tidak ada data terkait.`);
    }
  };

  return (
    <>
      <div className="animate-fade-in">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <ShoppingBag color="#6366f1" />
              Marketplace & Toko
            </h1>
            <p style={{ color: '#94a3b8' }}>Konfigurasi biaya per toko dan kalkulasi pricing forward.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => {
              setEditingMarketplaceId(null);
              setMarketplaceForm({ id: '', name: '' });
              setShowMarketplaceModal(true);
            }}>
              <ShoppingBag size={18} /> Tambah Marketplace
            </button>
            <button className="btn btn-primary" onClick={() => {
              setEditingStoreId(null);
              setStoreForm({ id: '', marketplace_id: '', name: '' });
              setShowStoreModal(true);
            }}>
              <Plus size={18} /> Tambah Toko
            </button>
          </div>
        </header>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#94a3b8' }}>Daftar Marketplace</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {marketplaces.map(m => (
              <div key={m.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{m.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '0.25rem' }}>ID: {m.id}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', zIndex: 10 }}>
                  <button className="btn btn-secondary" style={{ padding: '0.6rem 0.8rem', cursor: 'pointer', position: 'relative' }} onClick={() => {
                    console.log("Edit clicked");
                    setMarketplaceForm({ id: m.id, name: m.name });
                    setEditingMarketplaceId(m.id);
                    setShowMarketplaceModal(true);
                  }}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn btn-danger" style={{ padding: '0.6rem 0.8rem', cursor: 'pointer', position: 'relative' }} 
                    onClick={(e) => handleRequestDelete(e, m)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#94a3b8' }}>Daftar Toko</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {stores.map(store => (
            <motion.div key={store.id} className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className="badge badge-info">{store.marketplace_name}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => {
                     setStoreForm({ id: store.id, marketplace_id: store.marketplace_id, name: store.name });
                     setEditingStoreId(store.id);
                     setShowStoreModal(true);
                   }}><Edit2 size={14} /></button>
                   <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={(e) => handleRequestDelete(e, store, 'store')}>
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Store size={20} color="#6366f1" />
                {store.name}
              </h3>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleOpenStoreCosts(store)}>
                <Settings2 size={16} /> Kelola Harga & Biaya
                <ChevronRight size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(6px)' }} />
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
               className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '2rem', zIndex: 1000000, border: '1px solid rgba(239, 68, 68, 0.4)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
               
               <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                 <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <Trash2 size={32} color="#ef4444" />
                 </div>
                 <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Hapus {itemToDelete?.type?.replace('_', ' ')}?</h3>
                 <p style={{ color: '#94a3b8' }}>Anda akan menghapus <strong>{itemToDelete?.name}</strong>. Tindakan ini tidak dapat dibatalkan.</p>
               </div>

               <div style={{ display: 'flex', gap: '1rem' }}>
                 <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}>Batal</button>
                 <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmDelete}>Hapus Sekarang</button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Store Management Modal (Costs & Products) */}
      <AnimatePresence>
        {showCostModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCostModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto', padding: '2.5rem', zIndex: 10000 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem' }}>{selectedStore?.name}</h2>
                  <p style={{ color: '#94a3b8' }}>Konfigurasi Toko {selectedStore?.marketplace_name}</p>
                </div>
                <button onClick={() => setShowCostModal(false)} className="btn btn-secondary" style={{ padding: '0.5rem' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '2.5rem' }}>
                {/* Left side: Product Pricing */}
                <div style={{ flex: '1 1 450px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Tag size={18} color="#ec4899" />
                      Harga Jual Produk Toko
                    </h4>
                    <form onSubmit={handleAddStoreProduct} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <select className="form-control" style={{ flex: 1.5 }} value={pricingForm.product_id} 
                        onChange={(e) => setPricingForm({...pricingForm, product_id: e.target.value})} required disabled={!!editingSpId}>
                        <option value="">Pilih Produk</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                      </select>
                      <input type="number" className="form-control" style={{ flex: 1 }} placeholder="Harga Jual" 
                        value={pricingForm.harga_jual} onChange={(e) => setPricingForm({...pricingForm, harga_jual: e.target.value})} required />
                      
                      {editingSpId && (
                        <button type="button" className="btn btn-secondary" onClick={() => {
                          setPricingForm({ product_id: '', harga_jual: '' });
                          setEditingSpId(null);
                        }}><Undo2 size={18} /></button>
                      )}
                      <button type="submit" className="btn btn-primary">
                        {editingSpId ? <Save size={18} /> : <Plus size={18} />}
                      </button>
                    </form>

                    <div className="table-container">
                      <table style={{ fontSize: '0.9rem' }}>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Hrg Jual</th>
                            <th>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {storeProducts.map(sp => (
                            <tr 
                              key={sp.id} 
                              onClick={() => handleSelectStoreProduct(sp)}
                              style={{ 
                                cursor: 'pointer', 
                                background: selectedStoreProduct?.id === sp.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                transition: 'background 0.2s'
                              }}
                            >
                              <td style={{ fontWeight: '500' }}>{sp.product_name}</td>
                              <td style={{ fontWeight: '600' }} title={sp.harga_jual}>{formatCurrency(sp.harga_jual)}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button onClick={(e) => {
                                     e.stopPropagation();
                                     setPricingForm({ product_id: sp.product_id, harga_jual: sp.harga_jual });
                                     setEditingSpId(sp.id);
                                  }} className="btn btn-secondary" style={{ padding: '0.4rem' }}>
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleCalculatePricing(sp.id); }} className="btn btn-secondary" style={{ padding: '0.4rem', fontSize: '0.75rem', gap: '0.25rem' }}>
                                    <Calculator size={14} /> Hitung
                                  </button>
                                  <button onClick={async (e) => {
                                    e.stopPropagation();
                                    if(window.confirm("Hapus harga?")) {
                                      await storeProductsApi.delete(sp.id);
                                      const sps = await storeProductsApi.getAll({ store_id: selectedStore.id });
                                      setStoreProducts(sps.data);
                                      if (selectedStoreProduct?.id === sp.id) {
                                        setSelectedStoreProduct(null);
                                        setSpCosts([]);
                                      }
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
                <div style={{ flex: '1 1 350px' }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Percent size={18} color="#6366f1" />
                        {selectedStoreProduct ? `Biaya: ${selectedStoreProduct.product_name}` : 'Struktur Biaya Dinamis'}
                      </h4>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
                          onClick={() => setShowTypeManager(true)}
                        >
                          Kelola Tipe
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
                          onClick={() => setShowCostTypeModal(true)}
                        >
                          + Baru
                        </button>
                      </div>
                    </div>

                    {!selectedStoreProduct ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                        <Tag size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>Pilih produk di kiri untuk mengelola biaya marketplace.</p>
                      </div>
                    ) : (
                      <>
                        <form onSubmit={handleAddCost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                          <select className="form-control" value={costForm.cost_type_id} 
                            onChange={(e) => setCostForm({...costForm, cost_type_id: e.target.value})} required disabled={!!editingCostId}>
                            <option value="">Pilih Tipe Biaya</option>
                            {costTypes.map(ct => (
                              <option key={ct.id} value={ct.id}>{ct.name} ({ct.calc_type === 'percent' ? '%' : 'Rp'})</option>
                            ))}
                          </select>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input 
                              type="number" 
                              step="0.0001" 
                              className="form-control" 
                              style={{ paddingRight: '3rem' }}
                              placeholder={
                                costTypes.find(ct => ct.id === costForm.cost_type_id)?.calc_type === 'percent' 
                                ? "Contoh: 0.05 (untuk 5%)" 
                                : "Contoh: 5000"
                              } 
                              value={costForm.value} 
                              onChange={(e) => setCostForm({...costForm, value: e.target.value})} 
                              required 
                            />
                            <span style={{ position: 'absolute', right: '1rem', color: '#94a3b8', fontWeight: 'bold' }}>
                              {costTypes.find(ct => ct.id === costForm.cost_type_id)?.calc_type === 'percent' ? '%' : 'Rp'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.8rem' }}>
                              {editingCostId ? <Save size={18} /> : <Plus size={18} />} {editingCostId ? 'Simpan Perubahan' : 'Tambah Biaya'}
                            </button>
                            {editingCostId && (
                              <button type="button" className="btn btn-secondary" onClick={() => {
                                setEditingCostId(null);
                                setCostForm({ cost_type_id: '', value: '' });
                              }}>
                                <Undo2 size={18} />
                              </button>
                            )}
                          </div>
                        </form>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {spCosts.map(cost => (
                            <div key={cost.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px' }}>
                              <div>
                                <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{cost.cost_type_name}</p>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                  {cost.calc_type === 'percent' ? formatDecimalPercent(cost.value) : formatCurrency(cost.value)}
                                  {cost.calc_type === 'percent' && ` of ${cost.apply_to === 'price' ? 'Base' : 'After Disc'}`}
                                </p>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-secondary" style={{ padding: '0.4rem', border: 'none', background: 'transparent' }} onClick={() => {
                                  setCostForm({ cost_type_id: cost.cost_type_id, value: cost.value });
                                  setEditingCostId(cost.id);
                                }}>
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleRequestDelete(null, { id: cost.id, name: cost.cost_type_name }, 'cost' )} 
                                  style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                          {spCosts.length === 0 && (
                            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', padding: '1rem' }}>Belum ada biaya dikonfigurasi.</p>
                          )}
                        </div>
                      </>
                    )}
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
          <div style={{ position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPricingModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '2.5rem', zIndex: 11001, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: '#6366f1', fontSize: '2rem', marginBottom: '0.5rem' }}>Analisis Harga</h2>
                <p style={{ color: '#94a3b8' }}>{pricingAnalysis.product_name} di {pricingAnalysis.store_name}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                  <span>Harga Jual</span>
                  <span style={{ fontWeight: '600' }} title={pricingAnalysis.harga_jual}>{formatCurrency(pricingAnalysis.harga_jual)}</span>
                </div>
                
                <div style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rincian Biaya</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.95rem' }}>HPP (Produksi)</span>
                      <span title={pricingAnalysis.hpp}> - {formatCurrency(pricingAnalysis.hpp)}</span>
                    </div>
                    {pricingAnalysis.biaya_marketplace_breakdown.map(cost => (
                      <div key={cost.cost_type_id} style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                        <span style={{ fontSize: '0.95rem' }}>{cost.cost_type_name}</span>
                        <span title={cost.calculated_cost}> - {formatCurrency(cost.calculated_cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1rem', padding: '1.5rem', background: pricingAnalysis.profit_per_order >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '16px', textAlign: 'center' }}>
                  <h4 style={{ color: pricingAnalysis.profit_per_order >= 0 ? '#22c55e' : '#ef4444', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Estimasi Profit</h4>
                  <p style={{ fontSize: '2.25rem', fontWeight: '800', color: pricingAnalysis.profit_per_order >= 0 ? '#22c55e' : '#ef4444' }}>
                    {formatCurrency(pricingAnalysis.profit_per_order)}
                  </p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: '600' }}>
                    {formatRawPercent(pricingAnalysis.margin_percent)} Margin
                  </p>
                </div>
              </div>

              <button className="btn btn-secondary" style={{ width: '100%', marginTop: '2rem', justifyContent: 'center' }} onClick={() => setShowPricingModal(false)}>Tutup Analisis</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Marketplace Modal */}
      <AnimatePresence>
        {showMarketplaceModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => {
              setShowMarketplaceModal(false);
              setEditingMarketplaceId(null);
              setMarketplaceForm({ id: '', name: '' });
            }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '2rem', zIndex: 10000 }}>
              <h3 style={{ marginBottom: '1.5rem' }}>{editingMarketplaceId ? 'Edit Marketplace' : 'Tambah Marketplace Baru'}</h3>
              <form onSubmit={handleMarketplaceSubmit}>
                <div className="form-group">
                  <label className="form-label">Nama Marketplace</label>
                  <input type="text" className="form-control" placeholder="contoh: Shopee" value={marketplaceForm.name} 
                    onChange={(e) => setMarketplaceForm({...marketplaceForm, name: e.target.value})} required />
                </div>
                 <div className="form-group">
                  <label className="form-label">ID Marketplace (Slug)</label>
                  <input type="text" className="form-control" placeholder="contoh: shopee (opsional)" 
                    value={marketplaceForm.id} 
                    onChange={(e) => setMarketplaceForm({...marketplaceForm, id: e.target.value})} 
                    disabled={!!editingMarketplaceId}
                  />
                  {!editingMarketplaceId && <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Kosongkan untuk generate otomatis dari nama</small>}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
                    setShowMarketplaceModal(false);
                    setEditingMarketplaceId(null);
                    setMarketplaceForm({ id: '', name: '' });
                  }}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Save size={18} /> Simpan</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Store Addition Modal */}
      <AnimatePresence>
        {showStoreModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStoreModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '2rem', zIndex: 10000 }}>
             <h3 style={{ marginBottom: '1.5rem' }}>{editingStoreId ? 'Edit Toko' : 'Tambah Toko Baru'}</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  if (editingStoreId) {
                    await storesApi.update(editingStoreId, {
                       name: storeForm.name,
                       marketplace_id: storeForm.marketplace_id
                    });
                  } else {
                    // Auto-generate ID if empty
                    const idToUse = storeForm.id || `${storeForm.marketplace_id}-${storeForm.name.toLowerCase().replace(/\s+/g, '-')}`;
                    await storesApi.create({ ...storeForm, id: idToUse });
                  }
                  fetchBaseData();
                  setShowStoreModal(false);
                  setStoreForm({ id: '', marketplace_id: '', name: '' });
                  setEditingStoreId(null);
                } catch (error) { 
                  const detail = error.response?.data?.detail;
                  alert(detail ? `Gagal: ${detail}` : "Gagal menyimpan toko."); 
                }
              }}>
                <div className="form-group">
                  <label className="form-label">ID Toko (Harus Unik)</label>
                  <input type="text" className="form-control" placeholder="contoh: shopee-toko-1 (opsional)" 
                    value={storeForm.id} 
                    onChange={(e) => setStoreForm({...storeForm, id: e.target.value})} 
                    disabled={!!editingStoreId}
                  />
                  {!editingStoreId && <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Kosongkan untuk generate otomatis. ID tidak boleh sama dengan toko lain.</small>}
                </div>
                <div className="form-group">
                  <label className="form-label">Marketplace</label>
                  <select className="form-control" value={storeForm.marketplace_id} onChange={(e) => setStoreForm({...storeForm, marketplace_id: e.target.value})} required>
                    <option value="">Pilih Marketplace</option>
                    {marketplaces.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Tampilan</label>
                  <input type="text" className="form-control" placeholder="e.g. Hikmah Mandiri" value={storeForm.name} onChange={(e) => setStoreForm({...storeForm, name: e.target.value})} required />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowStoreModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Save size={18} /> Simpan</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showTypeManager && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTypeManager(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '2rem', zIndex: 11001 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Kelola Tipe Biaya</h3>
                <button onClick={() => setShowTypeManager(false)} className="btn btn-secondary" style={{ padding: '0.4rem' }}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '60vh', overflowY: 'auto' }}>
                {costTypes.map(ct => (
                  <div key={ct.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px' }}>
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{ct.name}</p>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ct.calc_type === 'percent' ? 'Percentage' : 'Fixed/Nominal'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem', border: 'none', background: 'transparent' }} onClick={() => {
                         setCostTypeForm({ name: ct.name, calc_type: ct.calc_type });
                         setEditingCostTypeId(ct.id);
                         setShowTypeManager(false);
                         setShowCostTypeModal(true);
                      }}>
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleRequestDelete(null, { id: ct.id, name: ct.name }, 'cost_type' )}
                        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Cost Type Modal */}
      <AnimatePresence>
        {showCostTypeModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCostTypeModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '2rem', zIndex: 11001 }}>
              <h3 style={{ marginBottom: '1.5rem' }}>{editingCostTypeId ? 'Edit Komponen Biaya' : 'Buat Komponen Biaya Baru'}</h3>
              <form onSubmit={handleCostTypeSubmit}>
                <div className="form-group">
                  <label className="form-label">Nama Komponen</label>
                  <input type="text" className="form-control" placeholder="Contoh: Admin Fee, Packing" 
                    value={costTypeForm.name} 
                    onChange={(e) => setCostTypeForm({...costTypeForm, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipe Perhitungan</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" name="calc_type" checked={costTypeForm.calc_type === 'percent'} 
                        onChange={() => setCostTypeForm({...costTypeForm, calc_type: 'percent'})} />
                      Persentase (%)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" name="calc_type" checked={costTypeForm.calc_type === 'fixed'} 
                        onChange={() => setCostTypeForm({...costTypeForm, calc_type: 'fixed'})} />
                      Nominal Tetap (Rp)
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
                    setShowCostTypeModal(false);
                    setEditingCostTypeId(null);
                    setCostTypeForm({ name: '', calc_type: 'percent' });
                  }}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Save size={18} /> {editingCostTypeId ? 'Simpan Update' : 'Simpan'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Marketplaces;
