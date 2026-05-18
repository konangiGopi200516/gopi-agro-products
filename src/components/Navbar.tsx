import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Leaf, Menu, X, Package } from 'lucide-react';
import { useCartContext } from '../context/CartContext';
import { AppContext } from '../context/AppContext';

export const Navbar = () => {
  const { itemCount } = useCartContext();
  const { state } = useContext(AppContext);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);

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
              <Link to="/admin" className={navLinkClass('/admin')}>Admin</Link>

              {state.currentUser && (
                <Link to="/my-orders" className={`flex items-center gap-1.5 ${navLinkClass('/my-orders')}`}>
                  <Package size={18} /> My Orders
                </Link>
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
            {state.currentUser && (
              <Link to="/my-orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-[17px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
                <Package size={20} /> My Orders
              </Link>
            )}
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-[17px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">Admin</Link>
          </div>
        </div>
      </nav>
    </>
  );
};
