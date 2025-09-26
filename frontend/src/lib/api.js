import axios from 'axios';

function readImportMetaEnv() {
  try {
    // eslint-disable-next-line no-new-func
    return new Function('return import.meta.env')();
  } catch (error) {
    return undefined;
  }
}

const viteEnv = readImportMetaEnv() || {};
const baseURL = viteEnv.VITE_API_URL || (typeof process !== 'undefined' ? process.env?.VITE_API_URL : '') || '';

const api = axios.create({ baseURL });

// Attach token from Member 2's auth work (or any local storage token)
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('accessToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;
