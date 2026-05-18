import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, MapPin, Heart, Minus, Plus } from 'lucide-react';
import type { Product } from '../types';
import { useCartContext } from '../context/CartContext';
import { useToast } from './ToastProvider';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart, cartItems, updateQuantity } = useCartContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  // Check if product is already in cart
  const cartItem = cartItems.find(item => item.product.id === product.id);
  const qtyInCart = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    showToast(`${product.name} added to cart`, 'success');
  };

  const handleQtyChange = (e: React.MouseEvent, increment: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      if (qtyInCart + increment === 0) {
        // will be removed by context logic or we can set to 0
        updateQuantity(product.id, 0);
      } else {
        updateQuantity(product.id, qtyInCart + increment);
      }
    }
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const stockStatus = () => {
    if (product.stock === 0) return { label: 'Out of Stock', color: 'var(--color-red)' };
    if (product.stock <= 5) return { label: `Low Stock (${product.stock} left)`, color: 'var(--color-primary)' };
    return { label: 'In Stock', color: 'var(--color-green)' };
  };

  const status = stockStatus();

  return (
    <div 
      onClick={() => navigate(`/product/${product.id}`)}
      className="product-card flex flex-col h-full cursor-pointer group"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-[var(--radius-md)] bg-[var(--color-surface)]">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="product-card-img w-full h-full object-cover"
          loading="lazy"
        />
        {/* Top-left Fresh badge */}
        <div className="absolute top-3 left-3 bg-[var(--color-green-light)] text-[var(--color-green)] px-2.5 py-1 rounded-[var(--radius-pill)] text-[11px] font-bold uppercase tracking-wider">
          Fresh
        </div>
        {/* Top-right Favorite */}
        <button 
          onClick={toggleFavorite}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm hover:text-[var(--color-red)] transition-colors"
        >
          <Heart size={16} fill={isFavorite ? "var(--color-red)" : "transparent"} stroke={isFavorite ? "var(--color-red)" : "currentColor"} />
        </button>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-display font-bold text-[16px] text-[var(--color-text-primary)] leading-snug line-clamp-2 mb-1">
          {product.name}
        </h3>
        <div className="text-[12px] text-[var(--color-text-muted)] flex items-center gap-1 mb-3">
          <MapPin size={12} />
          by {product.farmerName}
        </div>
        
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-[20px] font-bold text-[var(--color-primary)]">₹{product.price}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[12px]">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
            <span style={{ color: status.color }} className="font-medium">{status.label}</span>
          </div>
          
          {qtyInCart > 0 ? (
            <div className="flex items-center justify-between border-2 border-[var(--color-primary)] rounded-lg h-10 px-1 mt-1" onClick={e => e.preventDefault()}>
              <button onClick={(e) => handleQtyChange(e, -1)} className="w-8 h-8 flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] rounded-md">
                <Minus size={16} />
              </button>
              <span className="font-bold text-[var(--color-text-primary)] w-8 text-center">{qtyInCart}</span>
              <button 
                onClick={(e) => handleQtyChange(e, 1)} 
                disabled={qtyInCart >= product.stock}
                className="w-8 h-8 flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] rounded-md disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`w-full h-10 rounded-lg flex items-center justify-center gap-2 font-medium transition-all mt-1 ${
                product.stock === 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]'
              }`}
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
