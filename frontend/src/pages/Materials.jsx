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
  Database,
  Copy,
  AlertTriangle,
  Package,
  Info
} from 'lucide-react';
import { materialsApi, productsApi } from '../api';
import { formatCurrency, formatNumber } from '../utils/formatters';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [materialUsage, setMaterialUsage] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    id: '',
    nama: '',
    harga_total: '',
    jumlah_unit: '',
    satuan: ''
  });
  
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const [materialsRes, productsRes] = await Promise.all([
        materialsApi.getAll(),
        productsApi.getAll()
      ]);
      
      setMaterials(materialsRes.data);
      
      // Build material usage map
      const usageMap = {};
      
      console.log('Products data:', productsRes.data); // Debug log
      
      productsRes.data.forEach(product => {
        // Check if product has bom_items (relationship) or bom (array)
        const bomItems = product.bom_items || product.bom || [];
        
        console.log(`Product ${product.nama} BOM:`, bomItems); // Debug log
        
        if (Array.isArray(bomItems) && bomItems.length > 0) {
          bomItems.forEach(bomItem => {
            const materialId = bomItem.material_id;
            
            console.log(`  BOM Item:`, bomItem, `Material ID: ${materialId}`); // Detailed log
            
            if (!materialId) return; // Skip if no material_id
            
            if (!usageMap[materialId]) {
              usageMap[materialId] = {
                products: [],
                avgContribution: 0,
                totalContribution: 0,
                count: 0
              };
            }
            
            usageMap[materialId].products.push({
              name: product.nama,
              contribution: 0
            });
            
            // Calculate contribution if HPP exists
            if (product.hpp && product.hpp > 0 && bomItem.biaya_bahan) {
              const contribution = (bomItem.biaya_bahan / product.hpp) * 100;
              usageMap[materialId].totalContribution += contribution;
              usageMap[materialId].count += 1;
              usageMap[materialId].products[usageMap[materialId].products.length - 1].contribution = contribution;
            }
          });
        }
      });
      
      // Calculate average contribution
      Object.keys(usageMap).forEach(materialId => {
        if (usageMap[materialId].count > 0) {
          usageMap[materialId].avgContribution = usageMap[materialId].totalContribution / usageMap[materialId].count;
        }
      });
      
      console.log('Material usage map:', usageMap); // Debug log
      console.log('Material usage map keys:', Object.keys(usageMap)); // Show all keys
      
      setMaterialUsage(usageMap);
    } catch (error) {
      console.error("Failed to fetch materials", error);
    } finally {
      setLoading(false);
    }
  };


  const handleOpenModal = (material = null) => {
    if (material) {
      setFormData({
        id: material.id,
        nama: material.nama,
        harga_total: material.harga_total,
        jumlah_unit: material.jumlah_unit,
        satuan: material.satuan
      });
      setEditingId(material.id);
    } else {
      setFormData({ id: '', nama: '', harga_total: '', jumlah_unit: '', satuan: '' });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleDuplicate = (material) => {
    setFormData({
      id: '', // Clear ID so user must provide new one
      nama: `${material.nama} (Copy)`,
      harga_total: material.harga_total,
      jumlah_unit: material.jumlah_unit,
      satuan: material.satuan
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await materialsApi.update(editingId, formData);
      } else {
        await materialsApi.create(formData);
      }
      fetchMaterials();
      setShowModal(false);
    } catch (error) {
      alert(error.response?.data?.detail || "Operasi gagal");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus bahan ini?")) {
      try {
        await materialsApi.delete(id);
        fetchMaterials();
      } catch (error) {
        alert(error.response?.data?.detail || "Gagal menghapus");
      }
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="animate-fade-in">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Database color="#6366f1" />
              Gudang Bahan Baku
            </h1>
            <p style={{ color: '#94a3b8' }}>Global bahan baku yang digunakan di semua Bill of Materials (BOM).</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Tambah Bahan
          </button>
        </header>

        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Cari bahan berdasarkan nama atau ID..." 
              style={{ paddingLeft: '3rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container glass-card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Bahan</th>
                <th>Beli (Total)</th>
                <th>Isi/Unit</th>
                <th>Satuan</th>
                <th>Hrg Satuan</th>
                <th>Penggunaan</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>Memuat bahan baku...</td></tr>
              ) : filteredMaterials.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>Tidak ada bahan baku ditemukan.</td></tr>
              ) : filteredMaterials.map(material => {
                const usage = materialUsage[material.id];
                const isHighImpact = usage && usage.avgContribution > 20;
                
                // Debug log for each material
                console.log(`Checking material ${material.id}:`, usage);
                
                return (
                  <tr key={material.id}>
                    <td style={{ fontWeight: '600', color: '#6366f1' }}>{material.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isHighImpact && (
                          <span title="Bahan ini berkontribusi signifikan terhadap HPP produk">
                            <AlertTriangle size={16} color="#f59e0b" />
                          </span>
                        )}
                        <span style={{ fontWeight: '500' }}>{material.nama}</span>
                      </div>
                    </td>
                    <td title={material.harga_total}>{formatCurrency(material.harga_total)}</td>
                    <td title={material.jumlah_unit}>{formatNumber(material.jumlah_unit)}</td>
                    <td><span className="badge badge-info">{material.satuan}</span></td>
                    <td style={{ fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span title={material.harga_satuan}>{formatCurrency(material.harga_satuan)}</span>
                        {usage && usage.avgContribution > 0 && (
                          <span 
                            title={`Rata-rata menyumbang ${usage.avgContribution.toFixed(1)}% dari HPP produk`}
                            style={{ cursor: 'help' }}
                          >
                            <Info size={14} color="#94a3b8" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {usage && usage.products.length > 0 ? (
                        <div 
                          title={`Dipakai di: ${usage.products.map(p => p.name).join(', ')}`}
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(99, 102, 241, 0.1)',
                            borderRadius: '6px',
                            cursor: 'help'
                          }}
                        >
                          <Package size={14} color="#6366f1" />
                          <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: '500' }}>
                            {usage.products.length} produk
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Belum dipakai</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.5rem' }} 
                          onClick={() => handleDuplicate(material)}
                          title="Duplikat bahan ini"
                        >
                          <Copy size={16} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => handleOpenModal(material)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.5rem' }} onClick={() => handleDelete(material.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-card" 
              style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '2rem', zIndex: 10000 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3>{editingId ? 'Ubah Bahan' : 'Tambah Bahan Baru'}</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">ID Bahan (Nama Unik)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="contoh: kain_katun"
                    value={formData.id}
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                    disabled={!!editingId}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="contoh: Kain Katun Rayon"
                    value={formData.nama}
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Harga Beli Total (Rp)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="100000"
                      value={formData.harga_total}
                      onChange={(e) => setFormData({...formData, harga_total: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jumlah Unit (Isi)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="form-control" 
                      placeholder="100"
                      value={formData.jumlah_unit}
                      onChange={(e) => setFormData({...formData, jumlah_unit: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Satuan</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="contoh: gram, cm, pcs"
                    value={formData.satuan}
                    onChange={(e) => setFormData({...formData, satuan: e.target.value})}
                    required
                  />
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <Save size={18} /> {editingId ? 'Perbarui' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Materials;
