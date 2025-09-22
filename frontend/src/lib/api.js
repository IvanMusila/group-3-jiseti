import axios from 'axios';

// Call real backend when VITE_API_URL is set and VITE_USE_MSW !== 'true'
const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL });

// Attach token from Member 2's auth work (or any local storage token)
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('accessToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;