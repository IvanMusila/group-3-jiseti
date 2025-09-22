import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || ''
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('accessToken'); // Member 2 stores this
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;