import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem as CartItemType } from '../types';
import { useCartContext } from '../context/CartContext';

interface CartItemProps {
  item: CartItemType;
}

export const CartItem = ({ item }: CartItemProps) => {
  const { removeFromCart, updateQuantity } = useCartContext();
  const { product, quantity } = item;

  const handleRemove = () => {
    removeFromCart(product.id);
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < product.stock) {
      updateQuantity(product.id, quantity + 1);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center py-4 border-b border-gray-100 gap-4 last:border-0">
      {/* Product Image */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-lg font-heading font-semibold text-gray-800 truncate">{product.name}</h4>
        <p className="text-sm text-gray-500 mb-2">₹{product.price} / {product.unit}</p>
        
        <button 
          onClick={handleRemove}
          className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
        >
          <Trash2 size={14} /> Remove
        </button>
      </div>

      {/* Quantity & Price */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 mt-2 sm:mt-0">
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden h-9 w-28">
          <button 
            onClick={handleDecrease}
            disabled={quantity <= 1}
            className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <Minus size={14} />
          </button>
          <div className="flex-1 h-full flex items-center justify-center font-medium text-sm text-gray-800 bg-gray-50">
            {quantity}
          </div>
          <button 
            onClick={handleIncrease}
            disabled={quantity >= product.stock}
            className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        
        <div className="text-lg font-bold text-[#2D6A4F]">
          ₹{product.price * quantity}
        </div>
      </div>
    </div>
  );
};
