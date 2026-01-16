import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  Package,
  Layers,
  ChevronRight,
  Calculator,
  Info
} from 'lucide-react';
import { productsApi, bomApi, materialsApi, hppApi, extraCostsApi } from '../api';
import { formatCurrency, formatNumber } from '../utils/formatters';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBOMModal, setShowBOMModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [productForm, setProductForm] = useState({ id: '', nama: '' });
  const [bomForm, setBomForm] = useState({ material_id: '', qty: '' });
  const [extraCostForm, setExtraCostForm] = useState({ label: '', value: '' });
  const [bomItems, setBomItems] = useState([]);
  const [hppData, setHppData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prods, mats] = await Promise.all([
        productsApi.getAll(),
        materialsApi.getAll()
      ]);
      setProducts(prods.data);
      setMaterials(mats.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProductModal = (product = null) => {
    if (product) {
      setProductForm({ id: product.id, nama: product.nama });
    } else {
      setProductForm({ id: '', nama: '' });
    }
    setShowProductModal(true);
  };

  const handleOpenBOMModal = async (product) => {
    setSelectedProduct(product);
    setLoading(true);
    try {
      const [bomResp, hppResp] = await Promise.all([
        bomApi.getByProduct(product.id),
        hppApi.calculate(product.id)
      ]);
      setBomItems(bomResp.data);
      setHppData(hppResp.data);
      setShowBOMModal(true);
    } catch {
      alert("Gagal memuat data BOM");
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const existing = products.find(p => p.id === productForm.id);
      if (existing) {
        await productsApi.update(productForm.id, productForm);
      } else {
        await productsApi.create(productForm);
      }
      // Wait for fetch to complete to ensure UI is consistent
      await fetchData();
      setShowProductModal(false);
    } catch (error) {
      alert(error.response?.data?.detail || "Operasi gagal");
    }
  };

  const handleBOMSubmit = async (e) => {
    e.preventDefault();
    try {
      await bomApi.create({
        product_id: selectedProduct.id,
        ...bomForm
      });
      // Refresh BOM items and HPP
      const [bomResp, hppResp] = await Promise.all([
        bomApi.getByProduct(selectedProduct.id),
        hppApi.calculate(selectedProduct.id)
      ]);
      setBomItems(bomResp.data);
      setHppData(hppResp.data);
      setBomForm({ material_id: '', qty: '' });
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal menambah item BOM");
    }
  };

  const handleExtraCostSubmit = async (e) => {
    e.preventDefault();
    try {
      await extraCostsApi.create({
        product_id: selectedProduct.id,
        ...extraCostForm
      });
      // Refresh HPP
      const hppResp = await hppApi.calculate(selectedProduct.id);
      setHppData(hppResp.data);
      setExtraCostForm({ label: '', value: '' });
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal menambah biaya ekstra");
    }
  };

  const handleDeleteBOM = async (bomId) => {
    try {
      await bomApi.delete(bomId);
      const [bomResp, hppResp] = await Promise.all([
        bomApi.getByProduct(selectedProduct.id),
        hppApi.calculate(selectedProduct.id)
      ]);
      setBomItems(bomResp.data);
      setHppData(hppResp.data);
    } catch {
      alert("Gagal menghapus");
    }
  };

  const handleDeleteExtraCost = async (costId) => {
    try {
      await extraCostsApi.delete(costId);
      const hppResp = await hppApi.calculate(selectedProduct.id);
      setHppData(hppResp.data);
    } catch {
      alert("Gagal menghapus");
    }
  };

  const filteredProducts = products.filter(p => 
    p.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="animate-fade-in">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Package color="#ec4899" />
              Manajemen Produk
            </h1>
            <p style={{ color: '#94a3b8' }}>Kelola produk utama dan tentukan struktur biaya produksinya.</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenProductModal()}>
            <Plus size={18} /> Tambah Produk
          </button>
        </header>

        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Cari produk berdasarkan nama atau ID..." 
              style={{ paddingLeft: '3rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, min_max(350px, 1fr))', gap: '1.5rem' }}>
          {loading && products.length === 0 ? (
            <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '3rem' }}>Memuat produk...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '3rem' }}>Tidak ada produk ditemukan.</div>
          ) : filteredProducts.map(product => (
            <motion.div key={product.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className="badge badge-info">{product.id}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleOpenProductModal(product)}>
                    <Edit2 size={14} />
                  </button>
                  <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={async () => {
                    if(window.confirm("Hapus produk dan BOM-nya?")) {
                      await productsApi.delete(product.id);
                      fetchData();
                    }
                  }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>{product.nama}</h3>
              {/* Removed incompatible biaya_lain display */}
              
              <div style={{ marginTop: 'auto' }}>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleOpenBOMModal(product)}>
                  <Layers size={16} /> Kelola BOM & HPP
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProductModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '450px', padding: '2rem', zIndex: 10000 }}>
              <h3 style={{ marginBottom: '1.5rem' }}>{productForm.id ? 'Ubah Produk' : 'Tambah Produk Baru'}</h3>
              <form onSubmit={handleProductSubmit}>
                <div className="form-group">
                  <label className="form-label">ID Produk (SKU Unik)</label>
                  <input type="text" className="form-control" placeholder="contoh: KAOS-O-HTM" value={productForm.id} 
                    onChange={(e) => setProductForm({...productForm, id: e.target.value})} disabled={!!products.find(p => p.id === productForm.id) && showProductModal} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Produk</label>
                  <input type="text" className="form-control" placeholder="contoh: Kaos Polos Hitam" value={productForm.nama} 
                    onChange={(e) => setProductForm({...productForm, nama: e.target.value})} required />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowProductModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Save size={18} /> Simpan Produk</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOM Modal */}
      <AnimatePresence>
        {showBOMModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBOMModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', zIndex: 10000 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem' }}>{selectedProduct?.nama}</h3>
                  <p style={{ color: '#94a3b8' }}>Rincian Bill of Materials (BOM) & HPP</p>
                </div>
                <button onClick={() => setShowBOMModal(false)} className="btn btn-secondary" style={{ padding: '0.5rem' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 250px', gap: '2rem' }}>
                <div>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Tambah Bahan Baku</h4>
                  <form onSubmit={handleBOMSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <select className="form-control" style={{ flex: 2 }} value={bomForm.material_id} onChange={(e) => setBomForm({...bomForm, material_id: e.target.value})} required>
                      <option value="">Pilih Bahan</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.nama} ({formatCurrency(m.harga_satuan)}/{m.satuan})</option>
                      ))}
                    </select>
                    <input type="number" step="0.01" className="form-control" style={{ flex: 1 }} placeholder="Qty" value={bomForm.qty} onChange={(e) => setBomForm({...bomForm, qty: e.target.value})} required />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 1rem' }}><Plus size={18} /></button>
                  </form>

                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Daftar BOM Saat Ini</h4>
                  <div className="table-container" style={{ marginBottom: '2rem' }}>
                    <table style={{ fontSize: '0.9rem' }}>
                      <thead>
                        <tr>
                          <th>Material</th>
                          <th>Qty</th>
                          <th>Biaya</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bomItems.map(item => (
                          <tr key={item.id}>
                            <td>{item.material_nama}</td>
                            <td>{formatNumber(item.qty)} {item.material_satuan}</td>
                            <td title={item.biaya_bahan}>{formatCurrency(item.biaya_bahan)}</td>
                            <td>
                              <button onClick={() => handleDeleteBOM(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {bomItems.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>BOM Kosong</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Tambah Biaya Lain</h4>
                  <form onSubmit={handleExtraCostSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <input type="text" className="form-control" style={{ flex: 2 }} placeholder="Biaya (e.g. Packing, Overhead)" value={extraCostForm.label} onChange={(e) => setExtraCostForm({...extraCostForm, label: e.target.value})} required />
                    <input type="number" className="form-control" style={{ flex: 1 }} placeholder="Amount" value={extraCostForm.value} onChange={(e) => setExtraCostForm({...extraCostForm, value: e.target.value})} required />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 1rem' }}><Plus size={18} /></button>
                  </form>

                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Biaya Lain Saat Ini</h4>
                  <div className="table-container">
                    <table style={{ fontSize: '0.9rem' }}>
                      <thead>
                        <tr>
                          <th>Label</th>
                          <th>Biaya</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {hppData?.extra_costs?.map(item => (
                          <tr key={item.id}>
                            <td>{item.label}</td>
                            <td title={item.value}>{formatCurrency(item.value)}</td>
                            <td>
                              <button onClick={() => handleDeleteExtraCost(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {(!hppData?.extra_costs || hppData.extra_costs.length === 0) && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>Tidak ada biaya lain</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', height: 'fit-content', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calculator size={18} color="#6366f1" />
                    Ringkasan HPP
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Total Bahan Baku</span>
                      <span title={hppData?.total_bahan}>{formatCurrency(hppData?.total_bahan)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Biaya Lainnya</span>
                      <span title={hppData?.biaya_lain}>{formatCurrency(hppData?.biaya_lain)}</span>
                    </div>
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.1rem' }}>
                      <span>HPP FINAL</span>
                      <span style={{ color: '#6366f1' }} title={hppData?.hpp}>{formatCurrency(hppData?.hpp)}</span>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '0.5rem' }}>
                    <Info size={16} style={{ flexShrink: 0 }} />
                    <p>HPP ini akan digunakan sebagai dasar perhitungan profit & iklan di semua toko.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Products;
