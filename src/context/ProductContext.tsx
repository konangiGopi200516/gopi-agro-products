import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import type { Product } from '../types';
import { seedProducts } from '../data/seedProducts';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  filterProducts: (category?: string, searchQuery?: string) => Product[];
}

const ProductContext = createContext<ProductContextType | null>(null);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(seedProducts);
  }, []);

  const addProduct = async (product: Product) => {
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (response.ok) {
        const createdProduct = await response.json();
        setProducts(prev => [createdProduct, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add product to Firebase:', error);
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (response.ok) {
        const updatedProduct = await response.json();
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      }
    } catch (error) {
      console.error('Failed to update product in Firebase:', error);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete product from Firebase:', error);
    }
  };

  const getProductById = (id: string | number) => {
    return products.find(p => String(p.id) === String(id));
  };

  const filterProducts = (category?: string, searchQuery?: string) => {
    let result = [...products];

    if (category && category !== 'All') {
      result = result.filter(p => (typeof p.category === 'string' ? p.category : p.category?.name) === category);
    }

    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(lowerSearch) ||
             p.description.toLowerCase().includes(lowerSearch) ||
             p.farmerName.toLowerCase().includes(lowerSearch)
      );
    }

    return result;
  };

  return (
    <ProductContext.Provider value={{
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      getProductById,
      filterProducts
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProductContext must be used within ProductProvider');
  }
  return context;
};
