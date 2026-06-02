// -*- coding: utf-8 -*-
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Pendant le chargement, afficher un loader
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Verifier le token a chaque acces
  const token = localStorage.getItem('token');
  if (!token || !isAuthenticated) {
    // Nettoyer completement
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('dev_role');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verifier le role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
