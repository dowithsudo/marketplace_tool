import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { 
  Package, 
  Database, 
  ShoppingBag, 
  BarChart3, 
  Settings,
  LayoutDashboard,
  LogOut,
  FileUp
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Products from './pages/Products';
import Marketplaces from './pages/Marketplaces';
import AdsPerformance from './pages/AdsPerformance';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';

const Navbar = () => {
  const { user, logout } = useAuth();
  
  return (
    <nav>
      <div className="container" style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <NavLink to="/" className="nav-logo">MART TOOL</NavLink>
          {user && (
            <div className="nav-links">
              <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <LayoutDashboard size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Dashboard
              </NavLink>
              <NavLink to="/materials" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <Database size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Bahan Baku
              </NavLink>
              <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <Package size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Produk
              </NavLink>
              <NavLink to="/marketplaces" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <ShoppingBag size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Marketplace
              </NavLink>
              <NavLink to="/ads" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <BarChart3 size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Iklan
              </NavLink>
              <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FileUp size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Laporan
              </NavLink>
            </div>
          )}
        </div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>{user.email}</span>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'btn btn-secondary active' : 'btn btn-secondary'} style={{ padding: '0.5rem' }}>
              <Settings size={18} />
            </NavLink>
            <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={logout}>
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

const AppContent = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <>
      <Navbar />
      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/products" element={<Products />} />
            <Route path="/marketplaces" element={<Marketplaces />} />
            <Route path="/ads" element={<AdsPerformance />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        &copy; 2026 Marketplace Tool &bull; Versi Multi-Pengguna
      </footer>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
