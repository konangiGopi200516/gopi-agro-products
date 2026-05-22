import React, { createContext, useState, useEffect, ReactNode, useContext, useMemo } from 'react';
import type { Product, CartItem } from '../types';

export const FREE_DELIVERY_THRESHOLD = 499;
export const DELIVERY_FEE = 60;

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  deliveryCharge: number;
  tax: number;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const storedCart = localStorage.getItem('km_cart');
    if (storedCart) {
      try {
        const parsed = JSON.parse(storedCart);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map(item => {
            let qty = Number(item.quantity);
            if (isNaN(qty) || qty <= 0) qty = 1;
            return { ...item, quantity: qty };
          });
          setCartItems(sanitized);
        }
      } catch (e) {
        console.error("Failed to parse cart items:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('km_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, quantity: number = 1) => {
    const rawStock = product.stock;
    const safeStock = typeof rawStock === 'number' && !isNaN(rawStock)
      ? rawStock
      : typeof rawStock === 'string' && !isNaN(Number(rawStock))
      ? Number(rawStock)
      : 99; // safe fallback for products missing stock property

    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingItemIndex >= 0) {
        const existingItem = prev[existingItemIndex];
        const currentQty = isNaN(existingItem.quantity) ? 0 : existingItem.quantity;
        const newQuantity = Math.min(currentQty + quantity, safeStock);
        const newCart = [...prev];
        newCart[existingItemIndex] = { ...existingItem, quantity: newQuantity };
        return newCart;
      }
      const initQuantity = Math.min(quantity, safeStock);
      return [...prev, { product, quantity: initQuantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0 || isNaN(quantity)) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const rawStock = item.product.stock;
          const safeStock = typeof rawStock === 'number' && !isNaN(rawStock)
            ? rawStock
            : typeof rawStock === 'string' && !isNaN(Number(rawStock))
            ? Number(rawStock)
            : 99;
          return { ...item, quantity: Math.min(quantity, safeStock) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const itemCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }, [cartItems]);

  const deliveryCharge = useMemo(() => {
    if (cartItems.length === 0) return 0;
    return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  }, [subtotal, cartItems.length]);

  const tax = useMemo(() => {
    return subtotal * 0.05;
  }, [subtotal]);

  const total = useMemo(() => {
    return subtotal + deliveryCharge + tax;
  }, [subtotal, deliveryCharge, tax]);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      deliveryCharge,
      tax,
      total
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within CartProvider');
  }
  return context;
};
