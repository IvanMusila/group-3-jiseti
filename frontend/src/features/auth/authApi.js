import axios from 'axios';

const api = axios.create({
  baseURL: 'https://jiseti-backend-zt8g.onrender.com/api/v1',
  withCredentials: true // This requires supports_credentials=True on backend
});


export const signup = (payload) => api.post('/auth/register', payload);
export const login = (payload) => api.post('/auth/login', payload);
export const fetchCurrentUser = (token) => api.get('/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
});

export default api;