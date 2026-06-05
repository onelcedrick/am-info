// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './useAuth';

export default function useCartCount() {
  const [count, setCount] = useState(0);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) { setCount(0); return; }
    
    // Charger immédiatement
    api.get('/cart').then(r => setCount(r.data.count || 0)).catch(() => {});
    
    // Rafraîchir toutes les 5 secondes
    const interval = setInterval(() => {
      api.get('/cart').then(r => setCount(r.data.count || 0)).catch(() => {});
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return count;
}
