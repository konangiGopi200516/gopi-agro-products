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
        // Attempt to silently refresh the token via cookie
        await api.post('/auth/refresh');
        
        // If successful, retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear auth state and redirect
        // We trigger a custom event that AuthContext will listen to
        window.dispatchEvent(new Event('kisanmart:logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
