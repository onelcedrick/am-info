// -*- coding: utf-8 -*-
import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { IconDashboard, IconLogout, IconSun, IconMoon, IconUser, IconTicket, IconPhoto } from '../components/Icons';

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

export default function TechnicianLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`
        ${collapsed ? 'w-16' : 'w-60'} bg-teal-800 text-white flex flex-col flex-shrink-0 transition-all duration-300
        fixed md:relative z-50 h-full
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 flex items-center justify-between border-b border-teal-700">
          {!collapsed && <h2 className="text-lg font-bold truncate">Technicien</h2>}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden md:block text-teal-300 hover:text-white transition">
            <IconChevronLeft size={18} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-teal-300">✕</button>
        </div>

        <nav className="flex flex-col flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {[
            { to: '/technician', icon: <IconDashboard size={20} />, label: 'Dashboard' },
            { to: '/technician/tickets', icon: <IconTicket size={20} />, label: 'Tickets' },
            { to: '/technician/parts', icon: <IconPhoto size={20} />, label: 'Demandes pièces' },
          ].map(item => (
            <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
              className={`py-2.5 px-3 rounded-lg hover:bg-teal-700 transition text-sm flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : ''}>
              {item.icon}
              {!collapsed && item.label}
            </Link>
          ))}
          
          {/* Séparateur */}
          <div className="border-t border-teal-700 my-2" />
          
          {/* Profil */}
          <Link to="/technician/profile" onClick={() => setMobileOpen(false)}
            className={`py-2.5 px-3 rounded-lg hover:bg-teal-700 transition text-sm flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Profil' : ''}>
            <IconUser size={20} />
            {!collapsed && 'Profil'}
          </Link>
        </nav>

        {/* Footer avec avatar */}
        <div className="p-3 border-t border-teal-700">
          <Link to="/technician/profile" className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} mb-3`}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2 border-teal-600" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center flex-shrink-0">
                <IconUser size={16} />
              </div>
            )}
            {!collapsed && <p className="text-xs text-teal-300 truncate">{user?.full_name}</p>}
          </Link>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full bg-red-600/20 text-red-400 py-2 rounded-lg hover:bg-red-600/30 transition text-xs flex items-center justify-center gap-2">
            <IconLogout size={14} />
            {!collapsed && 'Déconnexion'}
          </button>
          {!collapsed && (
            <button onClick={toggle} className="w-full mt-2 text-teal-300 hover:text-white transition text-xs flex items-center justify-center gap-1">
              {dark ? <IconSun size={14} /> : <IconMoon size={14} />}
              Mode {dark ? 'clair' : 'sombre'}
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-100 flex flex-col">
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b">
          <button onClick={() => setMobileOpen(true)} className="text-gray-600"><IconMenu size={24} /></button>
          <h2 className="font-bold text-sm">AM Info Tech</h2>
          <div className="flex items-center gap-2">
            <Link to="/technician/profile" className="text-gray-600">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <IconUser size={20} />
              )}
            </Link>
            <button onClick={toggle} className="text-gray-600">{dark ? <IconSun size={20} /> : <IconMoon size={20} />}</button>
          </div>
        </div>
        <div className="flex-1 p-4 md:p-6 overflow-auto"><Outlet /></div>
      </main>
    </div>
  );
}
