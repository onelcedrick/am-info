// -*- coding: utf-8 -*-
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Sauvegarder le token
      localStorage.setItem('token', token);
      
      // Recuperer les infos utilisateur
      api.get('/auth/me')
        .then(res => {
          login(res.data, token);
          if (res.data.role === 'admin') navigate('/admin');
          else if (res.data.role === 'technician') navigate('/technician');
          else navigate('/client');
        })
        .catch(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">Connexion Google en cours...</p>
      </div>
    </div>
  );
}
