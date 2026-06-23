// -*- coding: utf-8 -*-
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then(res => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    checkAuth();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };

    window.addEventListener('popstate', checkAuth);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('popstate', checkAuth);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAuth]);

  // Redirection si non authentifié sur route protégée
  useEffect(() => {
    const protectedPaths = ['/client', '/admin', '/technician'];
    const isProtectedPath = protectedPaths.some(path => location.pathname.startsWith(path));

    if (!loading && isProtectedPath && !user) {
      navigate('/login', { replace: true });
    }
  }, [location.pathname, user, loading, navigate]);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = useCallback(() => {
    // 1. Nettoyer le localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('dev_role');

    // 2. Mettre à jour l'état
    setUser(null);

    // 3. Rediriger vers l'accueil avec React Router
    navigate('/', { replace: true });

    // 4. Forcer le rechargement après un court délai pour s'assurer que tout est réinitialisé
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, [navigate]);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return context;
};