import axios from 'axios';

// Get base URL from environment or default to local backend
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create the core Axios instance
export const api = axios.create({
  baseURL,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch CSRF token on startup
api.get('/auth/csrf').catch(() => console.warn('Failed to fetch CSRF token'));

// Request Interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kisanmart_accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor for handling 401 Unauthorized (Token Refresh)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401, not a retry, and not already calling refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh'
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('kisanmart_refreshToken');
        const response = await api.post('/auth/refresh', { refreshToken });
        
        if (response.data.accessToken) {
          localStorage.setItem('kisanmart_accessToken', response.data.accessToken);
        }
        if (response.data.refreshToken) {
          localStorage.setItem('kisanmart_refreshToken', response.data.refreshToken);
        }
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('kisanmart_accessToken');
        localStorage.removeItem('kisanmart_refreshToken');
        window.dispatchEvent(new Event('kisanmart:logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
