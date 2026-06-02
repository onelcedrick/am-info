// -*- coding: utf-8 -*-
import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { IconCart, IconUser, IconLogout, IconSun, IconMoon, IconPackage, IconOrders, IconTicket, IconMap } from '../components/Icons';

export default function ClientLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <nav className="bg-blue-600 text-white shadow-lg flex-shrink-0">
        <div className="px-4 md:px-6">
          <div className="flex justify-between items-center h-14">
            <Link to="/" className="text-lg md:text-xl font-bold tracking-tight flex items-center gap-2">
              <IconPackage size={22} /> AM Info
            </Link>
            
            <div className="hidden md:flex items-center gap-4 text-sm">
              <Link to="/products" className="hover:text-blue-200 transition flex items-center gap-1"><IconPackage size={15} /> Produits</Link>
              {/* <Link to="/about" className="hover:text-blue-200 transition">A propos</Link> */}
              <Link to="/map" className="hover:text-blue-200 transition flex items-center gap-1"><IconMap size={15} /> Boutique</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/client/cart" className="hover:text-blue-200 transition flex items-center gap-1"><IconCart size={15} /> Panier</Link>
                  <Link to="/client/orders" className="hover:text-blue-200 transition flex items-center gap-1"><IconOrders size={15} /> Commandes</Link>
                  <Link to="/client/tickets" className="hover:text-blue-200 transition flex items-center gap-1"><IconTicket size={15} /> Maintenance</Link>
                  
                  <span className="text-blue-200">|</span>
                  
                  {/* Photo + Nom */}
                  <Link to="/client/profile" className="flex items-center gap-2 hover:text-blue-200 transition">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-white/50" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                        <IconUser size={14} />
                      </div>
                    )}
                    <span className="text-xs">{user?.full_name}</span>
                  </Link>
                  
                  {/* Deconnexion icon */}
                  <button onClick={() => { logout(); navigate('/'); }} 
                    className="hover:text-red-200 transition" title="Deconnexion">
                    <IconLogout size={17} />
                  </button>
                </>
              ) : (
                <Link to="/login" className="bg-white text-blue-600 px-4 py-1.5 rounded-full text-sm hover:bg-blue-100 transition flex items-center gap-1">
                  <IconUser size={15} /> Connexion
                </Link>
              )}
              <button onClick={toggle} className="text-white hover:text-blue-200 transition text-lg">
                {dark ? <IconSun size={17} /> : <IconMoon size={17} />}
              </button>
            </div>

            {/* Mobile */}
            <div className="flex md:hidden items-center gap-2">
              {isAuthenticated && user?.avatar_url && (
                <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-white/50" />
              )}
              <button onClick={toggle} className="text-white text-lg">{dark ? <IconSun size={17} /> : <IconMoon size={17} />}</button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-white text-2xl">{menuOpen ? '✕' : '☰'}</button>
            </div>
          </div>

          {menuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <Link to="/products" onClick={() => setMenuOpen(false)} className="block py-2">Produits</Link>
              <Link to="/about" onClick={() => setMenuOpen(false)} className="block py-2">A propos</Link>
              <Link to="/map" onClick={() => setMenuOpen(false)} className="block py-2">Boutique</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/client/cart" onClick={() => setMenuOpen(false)} className="block py-2">Panier</Link>
                  <Link to="/client/orders" onClick={() => setMenuOpen(false)} className="block py-2">Commandes</Link>
                  <Link to="/client/tickets" onClick={() => setMenuOpen(false)} className="block py-2">Maintenance</Link>
                  <Link to="/client/profile" onClick={() => setMenuOpen(false)} className="block py-2">Profil</Link>
                  <button onClick={() => { logout(); navigate('/'); setMenuOpen(false); }} className="block py-2 text-red-200">Deconnexion</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2">Connexion</Link>
              )}
            </div>
          )}
        </div>
      </nav>
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6 h-full"><Outlet /></div>
      </main>
      <footer className="bg-gray-800 text-white text-center py-2 text-xs flex-shrink-0">&copy; 2026 AM Info</footer>
    </div>
  );
}
