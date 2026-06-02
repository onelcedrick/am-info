// -*- coding: utf-8 -*-
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { IconDashboard, IconPackage, IconLogout, IconSun, IconMoon, IconOrders, IconUser, IconLogs } from '../components/Icons';

const IconDiscount = ({ size = 16 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const IconTransaction = ({ size = 16 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const IconInvoice = ({ size = 16 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="w-60 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-5 flex justify-between items-center border-b border-gray-800">
          <h2 className="text-lg font-bold tracking-tight">Administration</h2>
          <button onClick={toggle} className="text-gray-400 hover:text-white transition">{dark ? <IconSun size={18} /> : <IconMoon size={18} />}</button>
        </div>
        <nav className="flex flex-col flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <Link to="/admin" className="py-2.5 px-3 rounded-lg hover:bg-gray-800 transition text-sm flex items-center gap-3 text-gray-300 hover:text-white">
            <IconDashboard size={18} /> Dashboard
          </Link>
          <Link to="/admin/products" className="py-2.5 px-3 rounded-lg hover:bg-gray-800 transition text-sm flex items-center gap-3 text-gray-300 hover:text-white">
            <IconPackage size={18} /> Produits
          </Link>
          <Link to="/admin/discounts" className="py-2.5 px-3 rounded-lg hover:bg-gray-800 transition text-sm flex items-center gap-3 text-gray-300 hover:text-white">
            <IconDiscount size={18} /> Promotions
          </Link>
          <Link to="/admin/orders" className="py-2.5 px-3 rounded-lg hover:bg-gray-800 transition text-sm flex items-center gap-3 text-gray-300 hover:text-white">
            <IconOrders size={18} /> Commandes
          </Link>
          <Link to="/admin/transactions" className="py-2.5 px-3 rounded-lg hover:bg-gray-800 transition text-sm flex items-center gap-3 text-gray-300 hover:text-white">
            <IconTransaction size={18} /> Transactions
          </Link>
          <Link to="/admin/clients" className="py-2.5 px-3 rounded-lg hover:bg-gray-800 transition text-sm flex items-center gap-3 text-gray-300 hover:text-white">
            <IconUser size={18} /> Clients
          </Link>
          <Link to="/admin/invoices" className="py-2.5 px-3 rounded-lg hover:bg-gray-800 transition text-sm flex items-center gap-3 text-gray-300 hover:text-white">
            <IconInvoice size={18} /> Factures
          </Link>
          <Link to="/admin/logs" className="py-2.5 px-3 rounded-lg hover:bg-gray-800 transition text-sm flex items-center gap-3 text-gray-300 hover:text-white">
            <IconLogs size={18} /> Logs
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" /> :
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"><IconUser size={16} /></div>}
            <p className="text-xs text-gray-400">{user?.full_name}</p>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full bg-red-600/20 text-red-400 py-2 rounded-lg hover:bg-red-600/30 transition text-xs flex items-center justify-center gap-2 border border-red-600/30">
            <IconLogout size={14} /> Deconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-100 p-6"><Outlet /></main>
    </div>
  );
}
