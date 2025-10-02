import axios from 'axios';

const fallbackURL = 'https://jiseti-backend-zt8g.onrender.com/api/v1';
const windowOrigin =
  typeof window !== 'undefined' && window.location ? window.location.origin : 'http://127.0.0.1:5173';

const rawEnvUrl =
  (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) ||
  (typeof window !== 'undefined' && window.__APP_CONFIG__?.apiUrl) ||
  '';

const configuredUrl = rawEnvUrl.trim() || fallbackURL;

let baseURL = configuredUrl;
try {
  baseURL = new URL(configuredUrl, windowOrigin).toString();
} catch (error) {
  console.warn('⚠️ Failed to parse VITE_API_URL, falling back to default.', error);
  baseURL = fallbackURL;
}

const apiOrigin = (() => {
  try {
    const url = new URL(baseURL);
    return `${url.protocol}//${url.host}`;
  } catch (error) {
    console.warn('⚠️ Failed to derive API origin, defaulting to window.location.origin.', error);
    return windowOrigin;
  }
})();

const api = axios.create({
  baseURL,
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('accessToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token attached to request:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No access token found in localStorage');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('🔐 401 Unauthorized - Token may be invalid or expired');
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('accessToken');
        window.localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export const API_BASE_URL = baseURL;
export const API_ORIGIN = apiOrigin;
