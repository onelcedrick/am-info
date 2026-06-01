// -*- coding: utf-8 -*-
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${dark ? 'dark' : ''}`}>
      <aside className="w-60 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-5 flex justify-between items-center">
          <h2 className="text-lg font-bold tracking-tight">Administration</h2>
          <button onClick={toggle} className="text-white hover:text-gray-300 transition text-lg" title={dark ? 'Mode clair' : 'Mode sombre'}>
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
        <nav className="flex flex-col flex-1 px-3 space-y-0.5">
          <Link to="/admin" className="py-2.5 px-3 rounded-lg hover:bg-gray-800 transition text-sm">Dashboard</Link>
          <Link to="/admin/products" className="py-2.5 px-3 rounded-lg hover:bg-gray-800 transition text-sm">Produits</Link>
          <Link to="/admin/discounts" className="py-2.5 px-3 rounded-lg hover:bg-gray-800 transition text-sm">Promotions</Link>
          <Link to="/admin/orders" className="py-2.5 px-3 rounded-lg hover:bg-gray-800 transition text-sm">Commandes</Link>
          <Link to="/admin/invoices" className="py-2.5 px-3 rounded-lg hover:bg-gray-800 transition text-sm">Factures</Link>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs mb-2">{user?.full_name}</p>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-xs">Deconnexion</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-100 p-6"><Outlet /></main>
    </div>
  );
}
