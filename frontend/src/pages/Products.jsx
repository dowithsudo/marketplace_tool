import React, { useState, useEffect } from 'react';
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
import { productsApi, bomApi, materialsApi, hppApi } from '../api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBOMModal, setShowBOMModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [productForm, setProductForm] = useState({ id: '', nama: '', biaya_lain: 0 });
  const [bomForm, setBomForm] = useState({ material_id: '', qty: '' });
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
      setProductForm({ id: product.id, nama: product.nama, biaya_lain: product.biaya_lain });
    } else {
      setProductForm({ id: '', nama: '', biaya_lain: 0 });
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
    } catch (error) {
      alert("Failed to load BOM data");
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
      fetchData();
      setShowProductModal(false);
    } catch (error) {
      alert(error.response?.data?.detail || "Operation failed");
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
      alert(error.response?.data?.detail || "Failed to add BOM item");
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
    } catch (error) {
      alert("Delete failed");
    }
  };

  const filteredProducts = products.filter(p => 
    p.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Package color="#ec4899" />
            Products Mastery
          </h1>
          <p style={{ color: '#94a3b8' }}>Kelola produk utama dan tentukan struktur biaya produksinya.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenProductModal()}>
          <Plus size={18} /> Add Product
        </button>
      </header>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search products by name or ID..." 
            style={{ paddingLeft: '3rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, min_max(350px, 1fr))', gap: '1.5rem' }}>
        {loading && products.length === 0 ? (
          <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '3rem' }}>Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '3rem' }}>No products found.</div>
        ) : filteredProducts.map(product => (
          <motion.div key={product.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="badge badge-info">{product.id}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleOpenProductModal(product)}>
                  <Edit2 size={14} />
                </button>
                <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={async () => {
                  if(window.confirm("Delete product and its BOM?")) {
                    await productsApi.delete(product.id);
                    fetchData();
                  }
                }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>{product.nama}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Biaya Produksi Lain: Rp {product.biaya_lain.toLocaleString()}
            </p>
            
            <div style={{ marginTop: 'auto' }}>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleOpenBOMModal(product)}>
                <Layers size={16} /> Manage BOM & HPP
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProductModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '450px', padding: '2rem', zIndex: 1001 }}>
              <h3 style={{ marginBottom: '1.5rem' }}>{productForm.id ? 'Edit Product' : 'Add New Product'}</h3>
              <form onSubmit={handleProductSubmit}>
                <div className="form-group">
                  <label className="form-label">Product ID (Unique SKU)</label>
                  <input type="text" className="form-control" placeholder="e.g. TSHIRT-O-BLK" value={productForm.id} 
                    onChange={(e) => setProductForm({...productForm, id: e.target.value})} disabled={!!products.find(p => p.id === productForm.id) && showProductModal} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Produk</label>
                  <input type="text" className="form-control" placeholder="e.g. Kaos Polos Hitam" value={productForm.nama} 
                    onChange={(e) => setProductForm({...productForm, nama: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Biaya Lain (Produksi/Tailor/Lainnya)</label>
                  <input type="number" className="form-control" placeholder="5000" value={productForm.biaya_lain} 
                    onChange={(e) => setProductForm({...productForm, biaya_lain: parseInt(e.target.value)})} required />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowProductModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Save size={18} /> Save Product</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOM Modal */}
      <AnimatePresence>
        {showBOMModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBOMModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', zIndex: 1001 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem' }}>{selectedProduct?.nama}</h3>
                  <p style={{ color: '#94a3b8' }}>Bill of Materials (BOM) & HPP Breakdown</p>
                </div>
                <button onClick={() => setShowBOMModal(false)} className="btn btn-secondary" style={{ padding: '0.5rem' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'min_max(300px, 1fr) 250px', gap: '2rem' }}>
                <div>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Add Ingredient</h4>
                  <form onSubmit={handleBOMSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <select className="form-control" style={{ flex: 2 }} value={bomForm.material_id} onChange={(e) => setBomForm({...bomForm, material_id: e.target.value})} required>
                      <option value="">Select Material</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.nama} (Rp {m.harga_satuan}/{m.satuan})</option>
                      ))}
                    </select>
                    <input type="number" step="0.01" className="form-control" style={{ flex: 1 }} placeholder="Qty" value={bomForm.qty} onChange={(e) => setBomForm({...bomForm, qty: e.target.value})} required />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 1rem' }}><Plus size={18} /></button>
                  </form>

                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Current BOM Items</h4>
                  <div className="table-container">
                    <table style={{ fontSize: '0.9rem' }}>
                      <thead>
                        <tr>
                          <th>Material</th>
                          <th>Qty</th>
                          <th>Cost</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bomItems.map(item => (
                          <tr key={item.id}>
                            <td>{item.material_nama}</td>
                            <td>{item.qty} {item.material_satuan}</td>
                            <td>Rp {item.biaya_bahan?.toLocaleString()}</td>
                            <td>
                              <button onClick={() => handleDeleteBOM(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {bomItems.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>Empty BOM</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calculator size={18} color="#6366f1" />
                    HPP Summary
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Total Materials</span>
                      <span>Rp {hppData?.total_bahan?.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Other Costs</span>
                      <span>Rp {hppData?.biaya_lain?.toLocaleString()}</span>
                    </div>
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.1rem' }}>
                      <span>FINAL HPP</span>
                      <span style={{ color: '#6366f1' }}>Rp {hppData?.hpp?.toLocaleString()}</span>
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
    </div>
  );
};

export default Products;
