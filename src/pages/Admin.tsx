import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, Settings, LogOut, TrendingUp, DollarSign, Users } from 'lucide-react';
import { useProductContext } from '../context/ProductContext';
import { getAllOrders } from '../services/api';
import type { Order } from '../types';

const Admin = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const { products } = useProductContext();
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Simple Password Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('adminAuth') === 'true'
  );
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'Gopi@7842239728') {
      sessionStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      getAllOrders().then(data => setOrders(data)).catch(console.error);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="page-root bg-[var(--color-surface)] min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)] w-full max-w-md animate-fade-up">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[var(--color-primary-light)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--color-primary)]">
              <span className="font-display font-bold text-2xl">K</span>
            </div>
            <h2 className="font-display font-bold text-[24px] text-[var(--color-text-primary)]">Admin Access</h2>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">Please enter your password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter Password" 
                className={`w-full h-12 px-4 rounded-[var(--radius-sm)] border outline-none transition-colors ${
                  loginError ? 'border-[var(--color-red)] focus:ring-1 focus:ring-[var(--color-red)]' : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]'
                }`}
                autoFocus
              />
              {loginError && <p className="text-[var(--color-red)] text-xs mt-1.5 font-medium">Incorrect password. Please try again.</p>}
            </div>
            <button type="submit" className="w-full bg-[var(--color-primary)] text-white h-12 rounded-[var(--radius-sm)] font-bold hover:bg-[var(--color-primary-dark)] transition-colors">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalRevenue = orders.filter(o => o.status === 'Delivered').reduce((sum, o: any) => sum + (Number(o.totalAmount) || Number(o.total) || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;

  const navItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/admin/products', icon: <Package size={20} />, label: 'Products' },
    { path: '/admin/orders', icon: <ClipboardList size={20} />, label: 'Orders' },
    { path: '/admin/farmers', icon: <Users size={20} />, label: 'Farmers' },
    { path: '#', icon: <Settings size={20} />, label: 'Settings' }
  ];

  const isHome = location.pathname === '/admin';

  return (
    <div className="page-root bg-[var(--color-surface)] min-h-screen flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-[240px] bg-white border-r border-[var(--color-border)] md:min-h-screen flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-[var(--color-border)] flex items-center gap-3">
          <span className="font-display font-bold text-[18px] text-[var(--color-primary)]">KisanMart</span>
          <span className="bg-[var(--color-primary)] text-white text-[10px] font-bold px-2 py-0.5 rounded-[var(--radius-pill)] uppercase">Admin</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.label} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-sm)] transition-all font-medium text-[15px] ${
                active ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-l-[3px] border-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] border-l-[3px] border-transparent'
              }`}>
                {item.icon} {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-[var(--color-border)] flex items-center gap-3 mt-auto">
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold">AK</div>
          <div className="flex-1">
            <div className="font-bold text-[14px] text-[var(--color-text-primary)]">Admin User</div>
            <div onClick={handleLogout} className="text-[12px] text-[var(--color-text-muted)] flex items-center gap-1 cursor-pointer hover:text-[var(--color-red)]"><LogOut size={12}/> Logout</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10">
        {children || (
          isHome && (
            <div className="animate-fade-up">
              <h1 className="font-display font-bold text-[28px] text-[var(--color-text-primary)] mb-8">Dashboard</h1>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-sm relative overflow-hidden">
                  <Package className="absolute top-5 right-5 text-[var(--color-primary)] opacity-20" size={40} />
                  <div className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1">Total Products</div>
                  <div className="font-bold text-[28px] text-[var(--color-text-primary)]">{products.length}</div>
                </div>
                <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-sm relative overflow-hidden">
                  <ClipboardList className="absolute top-5 right-5 text-[var(--color-primary)] opacity-20" size={40} />
                  <div className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1">Total Orders</div>
                  <div className="font-bold text-[28px] text-[var(--color-text-primary)]">{orders.length}</div>
                </div>
                <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-sm relative overflow-hidden">
                  <DollarSign className="absolute top-5 right-5 text-[var(--color-green)] opacity-20" size={40} />
                  <div className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1">Revenue</div>
                  <div className="font-bold text-[28px] text-[var(--color-text-primary)]">₹{totalRevenue}</div>
                  <div className="mt-2 text-[11px] font-bold bg-[var(--color-green-light)] text-[var(--color-green)] px-2 py-0.5 rounded-[var(--radius-pill)] inline-block">+12% this week</div>
                </div>
                <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-sm relative overflow-hidden">
                  <TrendingUp className="absolute top-5 right-5 text-[var(--color-red)] opacity-20" size={40} />
                  <div className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1">Pending Orders</div>
                  <div className="font-bold text-[28px] text-[var(--color-text-primary)]">{pendingOrders}</div>
                  {pendingOrders > 0 && <div className="mt-2 text-[11px] font-bold bg-[var(--color-red-light)] text-[var(--color-red)] px-2 py-0.5 rounded-[var(--radius-pill)] inline-block">Requires attention</div>}
                </div>
              </div>

              <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-6 shadow-sm">
                <h2 className="font-display font-bold text-[20px] text-[var(--color-text-primary)] mb-6">Recent Activity</h2>
                <div className="text-[14px] text-[var(--color-text-secondary)] text-center py-10">
                  Select <Link to="/admin/orders" className="text-[var(--color-primary)] hover:underline">Orders</Link> to view detailed activity.
                </div>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default Admin;
