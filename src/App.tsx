import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminProducts = lazy(() => import('./pages/AdminProducts'));

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
    <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-[#1a1a1a] text-white/70 py-6 text-center mt-auto">
        <p>&copy; {new Date().getFullYear()} KisanMart. All rights reserved.</p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <ProductProvider>
      <CartProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<Products />} />
                <Route path="product/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="order-confirmation/:orderId" element={<OrderConfirmation />} />
                <Route path="my-orders" element={<MyOrders />} />
                <Route path="admin" element={<Admin />} />
                <Route path="admin/orders" element={<AdminOrders />} />
                <Route path="admin/products" element={<AdminProducts />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </CartProvider>
    </ProductProvider>
  );
}

export default App;
