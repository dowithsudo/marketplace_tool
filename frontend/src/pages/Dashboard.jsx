import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Package,
  ShoppingCart
} from 'lucide-react';
import { materialsApi, productsApi, storesApi } from '../api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    materials: 0,
    products: 0,
    stores: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [mats, prods, stores] = await Promise.all([
          materialsApi.getAll(),
          productsApi.getAll(),
          storesApi.getAll()
        ]);
        setStats({
          materials: mats.data.length,
          products: prods.data.length,
          stores: stores.data.length
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Welcome Back,</h1>
        <p style={{ color: '#94a3b8' }}>Here's what's happening with your marketplace profit analysis.</p>
      </header>

      <div className="metrics-grid">
        <motion.div variants={item} className="glass-card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p className="metric-label">TOTAL MATERIALS</p>
              <h2 className="metric-value">{loading ? '...' : stats.materials}</h2>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: '#6366f1' }}>
              <Package size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p className="metric-label">MASTER PRODUCTS</p>
              <h2 className="metric-value">{loading ? '...' : stats.products}</h2>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '12px', color: '#ec4899' }}>
              <TrendingUp size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p className="metric-label">ACTIVE STORES</p>
              <h2 className="metric-value">{loading ? '...' : stats.stores}</h2>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', color: '#22c55e' }}>
              <ShoppingCart size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '3rem' }}>
        <motion.div variants={item} className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color="#f59e0b" />
            Urgent Tasks
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: '500' }}>Setup Marketplace Costs</p>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Define fee structure for your Shopee Store</p>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>
            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: '500' }}>Review Risky Products</p>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>3 products have margin below 5%</p>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <button className="btn btn-primary" style={{ justifyContent: 'center' }}>
              <Plus size={18} /> Add New Material
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'center' }}>
              <CheckCircle2 size={18} /> New Pricing Simulation
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
