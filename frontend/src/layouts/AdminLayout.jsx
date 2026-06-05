// -*- coding: utf-8 -*-
import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { IconDashboard, IconPackage, IconLogout, IconSun, IconMoon, IconOrders, IconUser, IconLogs, IconPlus } from '../components/Icons';

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

const IconMenu = ({ size = 20 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const IconChevronLeft = ({ size = 20 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = collapsed ? 'w-16' : 'w-60';

  const navItems = [
    { to: '/admin', icon: <IconDashboard size={20} />, label: 'Dashboard' },
    { to: '/admin/products', icon: <IconPackage size={20} />, label: 'Produits' },
    { to: '/admin/discounts', icon: <IconDiscount size={20} />, label: 'Promotions' },
    { to: '/admin/orders', icon: <IconOrders size={20} />, label: 'Commandes' },
    { to: '/admin/transactions', icon: <IconTransaction size={20} />, label: 'Transactions' },
    { to: '/admin/clients', icon: <IconUser size={20} />, label: 'Clients' },
    { to: '/admin/users', icon: <IconPlus size={20} />, label: 'Utilisateurs' },
    { to: '/admin/invoices', icon: <IconInvoice size={20} />, label: 'Factures' },
    { to: '/admin/logs', icon: <IconLogs size={20} />, label: 'Logs' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`
        ${sidebarWidth} bg-gray-900 text-white flex flex-col flex-shrink-0 transition-all duration-300
        fixed md:relative z-50 h-full
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          {!collapsed && <h2 className="text-lg font-bold tracking-tight truncate">Administration</h2>}
          <div className="flex items-center gap-1">
            <button onClick={() => setCollapsed(!collapsed)} className="hidden md:block text-gray-400 hover:text-white transition p-1" title={collapsed ? 'Déplier' : 'Replier'}>
              <IconChevronLeft size={18} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={() => setMobileOpen(false)} className="md:hidden text-gray-400 hover:text-white transition p-1">✕</button>
          </div>
        </div>

        <nav className="flex flex-col flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
              className={`py-2.5 px-3 rounded-lg hover:bg-gray-800 transition text-sm flex items-center gap-3 text-gray-300 hover:text-white ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : ''}>
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer avec lien profil */}
        <div className="p-3 border-t border-gray-800">
          <Link to="/admin/profile" className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} mb-3 hover:opacity-80 transition`}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0"><IconUser size={16} /></div>
            )}
            {!collapsed && <p className="text-xs text-gray-400 truncate">{user?.full_name}</p>}
          </Link>
          <button onClick={() => { logout(); navigate('/login'); }} 
            className={`w-full bg-red-600/20 text-red-400 py-2 rounded-lg hover:bg-red-600/30 transition text-xs flex items-center justify-center gap-2 border border-red-600/30 ${collapsed ? 'px-2' : 'px-3'}`}
            title="Déconnexion">
            <IconLogout size={14} />
            {!collapsed && 'Déconnexion'}
          </button>
          {!collapsed && (
            <button onClick={toggle} className="w-full mt-2 text-gray-400 hover:text-white transition text-xs flex items-center justify-center gap-1">
              {dark ? <IconSun size={14} /> : <IconMoon size={14} />}
              Mode {dark ? 'clair' : 'sombre'}
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-100 flex flex-col">
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b">
          <button onClick={() => setMobileOpen(true)} className="text-gray-600 hover:text-gray-800"><IconMenu size={24} /></button>
          <h2 className="font-bold text-sm">AM Info Admin</h2>
          <button onClick={toggle} className="text-gray-600">{dark ? <IconSun size={20} /> : <IconMoon size={20} />}</button>
        </div>
        <div className="flex-1 p-4 md:p-6 overflow-auto"><Outlet /></div>
      </main>
    </div>
  );
}
