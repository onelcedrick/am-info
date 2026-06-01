// -*- coding: utf-8 -*-
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ClientLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <nav className="bg-blue-600 text-white shadow-lg flex-shrink-0">
        <div className="px-6">
          <div className="flex justify-between items-center h-14">
            <Link to="/" className="text-xl font-bold tracking-tight">
              AM Info
            </Link>
            <div className="flex items-center gap-5 text-sm">
              <Link to="/products" className="hover:text-blue-200 transition">Produits</Link>
              <Link to="/map" className="hover:text-blue-200 transition">Boutique</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/client/cart" className="hover:text-blue-200 transition">Panier</Link>
                  <Link to="/client/orders" className="hover:text-blue-200 transition">Commandes</Link>
                  <Link to="/client/tickets" className="hover:text-blue-200 transition">Maintenance</Link>
                  <span className="text-blue-200">|</span>
                  <span className="text-xs">{user?.full_name}</span>
                  <button onClick={() => { logout(); navigate('/'); }}
                    className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs hover:bg-blue-100 transition">
                    Deconnexion
                  </button>
                </>
              ) : (
                <Link to="/login" className="bg-white text-blue-600 px-4 py-1.5 rounded-full text-sm hover:bg-blue-100 transition">
                  Connexion
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6 h-full">
          <Outlet />
        </div>
      </main>
      <footer className="bg-gray-800 text-white text-center py-2 text-xs flex-shrink-0">
        &copy; 2026 AM Info - Assistance & Maintenance Informatique
      </footer>
    </div>
  );
}
