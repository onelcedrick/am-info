// -*- coding: utf-8 -*-
import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import useCartCount from '../hooks/useCartCount';
import { IconCart, IconUser, IconLogout, IconSun, IconMoon, IconPackage, IconOrders, IconTicket, IconMap, IconClose } from '../components/Icons';

const IconMenu = ({ size = 20 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const IconHome = ({ size = 20 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export default function ClientLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = useCartCount();

  const closeMenu = () => setMenuOpen(false);

  const publicLinks = [
    { to: '/products', icon: <IconPackage size={20} />, label: 'Produits' },
    { to: '/map', icon: <IconMap size={20} />, label: 'Boutique' },
  ];

  const authLinks = [
    { to: '/client/cart', icon: <IconCart size={20} />, label: 'Panier', badge: cartCount },
    { to: '/client/orders', icon: <IconOrders size={20} />, label: 'Commandes' },
    { to: '/client/tickets', icon: <IconTicket size={20} />, label: 'Maintenance' },
    { to: '/client/profile', icon: <IconUser size={20} />, label: 'Profil' },
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white shadow-lg flex-shrink-0 z-30">
        <div className="px-4 md:px-6">
          <div className="flex justify-between items-center h-14">
            <Link to="/" className="text-lg md:text-xl font-bold tracking-tight flex items-center gap-2">
              <IconPackage size={22} /> AM Info
            </Link>
            
            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-4 text-sm">
              {publicLinks.map(l => (
                <Link key={l.to} to={l.to} className="hover:text-blue-200 transition flex items-center gap-1">
                  {l.icon} {l.label}
                </Link>
              ))}
              {isAuthenticated && authLinks.map(l => (
                <Link key={l.to} to={l.to} className="hover:text-blue-200 transition flex items-center gap-1 relative">
                  {l.icon}
                  {l.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                      {l.badge > 9 ? '9+' : l.badge}
                    </span>
                  )}
                  {l.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <span className="text-blue-200">|</span>
                  <Link to="/client/profile" className="flex items-center gap-2 hover:text-blue-200 transition">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-white/50" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"><IconUser size={14} /></div>
                    )}
                    <span className="text-xs">{user?.full_name}</span>
                  </Link>
                  <button onClick={() => { logout(); navigate('/'); }} className="hover:text-red-200 transition" title="Déconnexion">
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

            {/* Mobile : icônes + burger */}
            <div className="flex md:hidden items-center gap-1">
              {isAuthenticated && (
                <Link to="/client/cart" className="text-white p-2 relative">
                  <IconCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              )}
              <button onClick={toggle} className="text-white p-2">
                {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
              </button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-white p-2">
                <IconMenu size={22} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay mobile */}
      {menuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMenu} />}

      {/* Sidebar mobile */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 md:hidden ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white">
          <div className="flex items-center gap-2"><IconPackage size={20} /><span className="font-bold">AM Info</span></div>
          <button onClick={closeMenu} className="p-1"><IconClose size={22} /></button>
        </div>

        {isAuthenticated && (
          <div className="p-4 border-b bg-gray-50">
            <Link to="/client/profile" onClick={closeMenu} className="flex items-center gap-3">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-blue-200" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><IconUser size={24} /></div>
              )}
              <div><p className="font-bold text-gray-800">{user?.full_name}</p><p className="text-xs text-gray-500">{user?.email}</p></div>
            </Link>
          </div>
        )}

        <nav className="p-4 space-y-1">
          <Link to="/" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition"><IconHome size={20} /> Accueil</Link>
          {publicLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition">{l.icon} {l.label}</Link>
          ))}
          {isAuthenticated ? (
            <>
              <hr className="my-2" />
              {authLinks.map(l => (
                <Link key={l.to} to={l.to} onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition relative">
                  {l.icon}
                  {l.badge > 0 && (
                    <span className="absolute left-8 top-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {l.badge > 9 ? '9+' : l.badge}
                    </span>
                  )}
                  {l.label}
                </Link>
              ))}
              <hr className="my-2" />
              <button onClick={() => { logout(); navigate('/'); closeMenu(); }} className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition w-full"><IconLogout size={20} /> Déconnexion</button>
            </>
          ) : (
            <Link to="/login" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-blue-600 text-white justify-center mt-4 font-semibold"><IconUser size={20} /> Se connecter</Link>
          )}
        </nav>
      </div>

      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6 h-full"><Outlet /></div>
      </main>

      <footer className="bg-gray-800 text-white text-center py-2 text-xs flex-shrink-0">&copy; 2026 AM Info</footer>
    </div>
  );
}
