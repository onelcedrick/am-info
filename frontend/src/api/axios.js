import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur : attacher le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur : si 401, essayer de refresh le token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Essayer de rafraichir le token
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          const newToken = res.data.token;
          localStorage.setItem('token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Token vraiment expire, rediriger vers login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
