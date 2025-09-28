import axios from 'axios';

// Directly use the backend URL - no complex env reading needed
const baseURL = 'https://jiseti-backend-zt8g.onrender.com/api/v1';

const api = axios.create({ 
  baseURL,
  withCredentials: false,
});

// Attach token from auth
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('accessToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;