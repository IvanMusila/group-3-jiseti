import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true // if you later use httpOnly refresh cookies
});

export const signup = (payload) => api.post('/auth/register', payload);
export const login = (payload) => api.post('/auth/login', payload);
export const fetchCurrentUser = (token) => api.get('/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
});

export default api;
