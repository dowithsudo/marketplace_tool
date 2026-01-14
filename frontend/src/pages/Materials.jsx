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
  Database
} from 'lucide-react';
import { materialsApi } from '../api';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
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
      const response = await materialsApi.getAll();
      setMaterials(response.data);
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
      alert(error.response?.data?.detail || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      try {
        await materialsApi.delete(id);
        fetchMaterials();
      } catch (error) {
        alert(error.response?.data?.detail || "Delete failed");
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
              Materials Repository
            </h1>
            <p style={{ color: '#94a3b8' }}>Global bahan baku yang digunakan di semua Bill of Materials (BOM).</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Material
          </button>
        </header>

        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search materials by name or ID..." 
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>Loading materials...</td></tr>
              ) : filteredMaterials.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>No materials found.</td></tr>
              ) : filteredMaterials.map(material => (
                <tr key={material.id}>
                  <td style={{ fontWeight: '600', color: '#6366f1' }}>{material.id}</td>
                  <td style={{ fontWeight: '500' }}>{material.nama}</td>
                  <td>Rp {material.harga_total.toLocaleString()}</td>
                  <td>{material.jumlah_unit}</td>
                  <td><span className="badge badge-info">{material.satuan}</span></td>
                  <td style={{ fontWeight: '600' }}>Rp {material.harga_satuan.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => handleOpenModal(material)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn btn-danger" style={{ padding: '0.5rem' }} onClick={() => handleDelete(material.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                <h3>{editingId ? 'Edit Material' : 'Add New Material'}</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Material ID (Unique Name)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. kain_katun"
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
                    placeholder="e.g. Kain Katun Rayon"
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
                    placeholder="e.g. gram, cm, pcs"
                    value={formData.satuan}
                    onChange={(e) => setFormData({...formData, satuan: e.target.value})}
                    required
                  />
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <Save size={18} /> {editingId ? 'Update' : 'Save'}
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
