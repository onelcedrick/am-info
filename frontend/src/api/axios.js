import axios from 'axios';

// Forcer HTTPS
let baseURL = import.meta.env.VITE_API_URL || 'https://localhost:8000';
if (baseURL.startsWith('http://')) {
  baseURL = baseURL.replace('http://', 'https://');
}

const api = axios.create({
  baseURL: baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, code } = error;
    if (code === 'ERR_NETWORK' || code === 'ECONNREFUSED') {
      console.error('Serveur inaccessible');
    }
    if (response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
