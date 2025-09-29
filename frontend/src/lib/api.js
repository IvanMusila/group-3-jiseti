import axios from 'axios';

// Direct backend URL
const baseURL = 'https://jiseti-backend-zt8g.onrender.com/api/v1';

const api = axios.create({ 
  baseURL,
  withCredentials: false,
});

// Request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token attached to request:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No access token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error('🔐 401 Unauthorized - Token may be invalid or expired');
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;