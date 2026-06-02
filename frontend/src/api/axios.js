import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Intercepteur requete : attacher le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Intercepteur reponse : gestion des erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, code, message } = error;
    
    // Erreur reseau
    if (code === 'ERR_NETWORK' || code === 'ECONNREFUSED') {
      toast.error('Serveur inaccessible. Verifiez votre connexion.');
      return Promise.reject(error);
    }
    
    // Timeout
    if (code === 'ECONNABORTED') {
      toast.error('La requete a pris trop de temps. Reessayez.');
      return Promise.reject(error);
    }
    
    // Erreur HTTP
    if (response) {
      const { status, data } = response;
      const msg = data?.detail || data?.message || 'Une erreur est survenue';
      
      switch (status) {
        case 400:
          toast.error(msg);
          break;
        case 401:
          // Token expire
          localStorage.removeItem('token');
          if (window.location.pathname !== '/login') {
            toast.error('Session expiree. Veuillez vous reconnecter.');
            setTimeout(() => window.location.href = '/login', 1500);
          }
          break;
        case 403:
          toast.error('Acces refuse. Vous n\'avez pas les droits necessaires.');
          break;
        case 404:
          toast.error('Ressource introuvable.');
          break;
        case 422:
          const details = data?.details?.join(', ') || msg;
          toast.error(details);
          break;
        case 429:
          toast.error('Trop de requetes. Veuillez patienter.');
          break;
        case 500:
          toast.error('Erreur serveur. Veuillez reessayer plus tard.');
          break;
        default:
          toast.error(msg);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
