import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Leaf, Menu, X, Package, User, LogOut } from 'lucide-react';
import { useCartContext } from '../context/CartContext';
import { AppContext } from '../context/AppContext';

export const Navbar = () => {
  const { itemCount } = useCartContext();
  const { state } = useContext(AppContext);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  
  const token = localStorage.getItem('kisanmart_token');
  const userStr = localStorage.getItem('kisanmart_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAuthenticated = !!token;

  const handleLogout = () => {
    localStorage.removeItem('kisanmart_token');
    localStorage.removeItem('kisanmart_user');
    window.location.href = '/welcome';
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path 
      ? 'text-[var(--color-primary)] font-medium after:scale-x-100' 
      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] after:scale-x-0';
  };

  const navLinkClass = (path: string) => `
    relative text-[15px] pb-1
    after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 
    after:bg-[var(--color-primary)] after:origin-left after:transition-transform after:duration-300
    ${isActive(path)}
  `;

  return (
    <>
      {showAnnouncement && (
        <div className="bg-[var(--color-amber-light)] text-[var(--color-text-secondary)] text-xs sm:text-sm py-2 px-4 flex justify-center items-center relative z-50">
          <p>🌱 Farm fresh daily — Free delivery above ₹499</p>
          <button 
            onClick={() => setShowAnnouncement(false)} 
            className="absolute right-4 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      <nav className={`sticky top-0 z-40 w-full transition-all duration-300 border-b border-[var(--color-border)] ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-[var(--shadow-card)]' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-[72px] items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <Leaf size={18} className="text-[var(--color-primary)] group-hover:scale-110 transition-transform" />
              <span className="font-display font-bold text-[22px] text-[var(--color-primary)]">KisanMart</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className={navLinkClass('/')}>Home</Link>
              <Link to="/products" className={navLinkClass('/products')}>Products</Link>
              <Link to="/farmers" className={navLinkClass('/farmers')}>Meet Farmers</Link>
              <Link to="/admin" className={navLinkClass('/admin')}>Admin</Link>

              {isAuthenticated ? (
                <>
                  <Link to="/my-orders" className={`flex items-center gap-1.5 ${navLinkClass('/my-orders')}`}>
                    <Package size={18} /> My Orders
                  </Link>
                  <div className="relative ml-2 pl-4 border-l border-gray-200">
                    <button 
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className="w-10 h-10 rounded-full bg-green-100 text-[var(--color-primary)] flex items-center justify-center font-bold text-lg border-2 border-green-200 shadow-sm hover:bg-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]" 
                      title={user?.name || 'User'}
                    >
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </button>

                    {profileMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)}></div>
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                          <div className="px-4 py-3 border-b border-gray-100 mb-1">
                            <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'User'}</p>
                            <p className="text-xs font-medium text-gray-500 truncate mt-0.5">{user?.email || ''}</p>
                          </div>
                          <button 
                            onClick={() => { setProfileMenuOpen(false); handleLogout(); }} 
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-semibold"
                          >
                            <LogOut size={16} /> Sign out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="border-2 border-[var(--color-primary)] text-[var(--color-primary)] px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-[var(--color-primary)] hover:text-white transition-colors">Log in</Link>
                  <Link to="/signup" className="bg-[var(--color-primary)] border-2 border-[var(--color-primary)] text-white px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-[var(--color-primary-dark)] hover:border-[var(--color-primary-dark)] transition-colors">Sign up</Link>
                </>
              )}

              <Link to="/cart" className="relative text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors flex items-center ml-4">
                <ShoppingCart size={22} />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-[var(--color-primary)] text-white text-[11px] font-bold px-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-[var(--radius-pill)] border-2 border-white">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-5">
              <Link to="/cart" className="relative text-[var(--color-text-secondary)]">
                <ShoppingCart size={22} />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-[var(--color-primary)] text-white text-[11px] font-bold px-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-[var(--radius-pill)] border-2 border-white">
                    {itemCount}
                  </span>
                )}
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] focus:outline-none"
              >
                {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        <div 
          className={`md:hidden bg-white border-b border-[var(--color-border)] overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-[17px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">Home</Link>
            <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="text-[17px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">Products</Link>
            <Link to="/farmers" onClick={() => setMobileMenuOpen(false)} className="text-[17px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">Meet Farmers</Link>
            {isAuthenticated ? (
              <div className="flex flex-col space-y-4 mt-2 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3 px-2 mb-1">
                  <div className="w-11 h-11 rounded-full bg-green-100 text-[var(--color-primary)] flex items-center justify-center font-bold text-xl border border-green-200 shadow-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-gray-900 leading-tight">{user?.name || 'User'}</span>
                    <span className="text-xs font-medium text-gray-500">{user?.email || ''}</span>
                  </div>
                </div>
                <Link to="/my-orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-[17px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] px-2">
                  <Package size={20} /> My Orders
                </Link>
                <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="flex items-center gap-2 text-[17px] font-medium text-[var(--color-text-secondary)] hover:text-red-500 text-left px-2">
                  <LogOut size={20} /> Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-3 mt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 text-[17px] font-semibold text-[var(--color-primary)] border-2 border-[var(--color-primary)] rounded-xl py-2 hover:bg-[var(--color-primary)] hover:text-white transition-colors">
                  <User size={20} /> Log in
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 text-[17px] font-semibold text-white bg-[var(--color-primary)] border-2 border-[var(--color-primary)] rounded-xl py-2 hover:bg-[var(--color-primary-dark)] hover:border-[var(--color-primary-dark)] transition-colors">
                  <User size={20} /> Sign up
                </Link>
              </div>
            )}
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-[17px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">Admin</Link>
          </div>
        </div>
      </nav>
    </>
  );
};
