export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = async (path: string, options?: RequestInit) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// PRODUCTS
export const getProducts = (params?: string) =>
  api(`/products${params ? "?" + params : ""}`);
export const getProduct = (id: number) => api(`/products/${id}`);
export const createProduct = (data: object) =>
  api("/products", { method: "POST", body: JSON.stringify(data) });
export const updateProduct = (id: number, data: object) =>
  api(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteProduct = (id: number) =>
  api(`/products/${id}`, { method: "DELETE" });

// CATEGORIES
export const getCategories = () => api("/categories");

// ORDERS
export const placeOrder = (data: object) =>
  api("/orders", { method: "POST", body: JSON.stringify(data) });
export const getUserOrders = (uid: string) => api(`/orders/user/${uid}`);
export const getOrderDetail = (orderId: string) => api(`/orders/${orderId}`);
export const getAllOrders = () => api("/orders");
export const updateOrderStatus = (orderId: string, status: string) =>
  api(`/orders/${orderId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

// USERS
export const syncUser = (data: object) =>
  api("/users/sync", { method: "POST", body: JSON.stringify(data) });

// ADMIN
export const adminLogin = (email: string, password: string) =>
  api("/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
export const getAdminStats = () => api("/admin/stats");
