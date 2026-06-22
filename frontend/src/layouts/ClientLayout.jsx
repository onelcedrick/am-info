// -*- coding: utf-8 -*-
import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
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

// Composant Logo dynamique - image + nom toujours visible
function LogoDisplay() {
  const { logoUrl } = useSettings();
  return (
    <div className="flex items-center gap-2">
      {logoUrl ? (
        <img src={logoUrl} alt="AM Info" className="h-8 w-auto object-contain" />
      ) : (
        <div className="bg-blue-600 text-white p-1.5 rounded-lg">
          <IconPackage size={20} />
        </div>
      )}
      <span className="font-bold text-lg text-blue-900">AM Info</span>
    </div>
  );
}

export default function ClientLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = useCartCount();
  const closeMenu = () => setMenuOpen(false);

  const navLinks = [
    { to: '/', icon: <IconHome size={18} />, label: 'Accueil' },
    { to: '/products', icon: <IconPackage size={18} />, label: 'Produits' },
  ];

  const authLinks = [
    { to: '/client/cart', icon: <IconCart size={18} />, label: 'Panier', badge: cartCount },
    { to: '/client/orders', icon: <IconOrders size={18} />, label: 'Commandes' },
    { to: '/client/tickets', icon: <IconTicket size={18} />, label: 'Maintenance' },
    { to: '/map', icon: <IconMap size={18} />, label: 'Boutique' },
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 flex-shrink-0 z-30">
        <div className="px-4 md:px-6">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <LogoDisplay />
            </Link>
            
            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(l => (
                <Link key={l.to} to={l.to} className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition flex items-center gap-1.5">
                  {l.icon} {l.label}
                </Link>
              ))}
              {isAuthenticated && authLinks.map(l => (
                <Link key={l.to} to={l.to} className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition flex items-center gap-1.5 relative">
                  {l.icon}
                  {l.badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center animate-pulse">
                      {l.badge > 9 ? '9+' : l.badge}
                    </span>
                  )}
                  {l.label}
                </Link>
              ))}
              <span className="w-px h-6 bg-gray-200 mx-2" />
              {isAuthenticated ? (
                <>
                  <Link to="/client/profile" className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-blue-100" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <IconUser size={16} />
                      </div>
                    )}
                    <span className="text-sm text-gray-700 font-medium">{user?.full_name}</span>
                  </Link>
                  <button onClick={() => { logout(); navigate('/'); }} className="p-2 text-gray-400 hover:text-red-500 transition" title="Déconnexion">
                    <IconLogout size={18} />
                  </button>
                </>
              ) : (
                <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1.5">
                  <IconUser size={16} /> Connexion
                </Link>
              )}
              <button onClick={toggle} className="p-2 text-gray-400 hover:text-gray-600 transition">
                {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
              </button>
            </div>

            {/* Mobile */}
            <div className="flex md:hidden items-center gap-1">
              {isAuthenticated && (
                <Link to="/client/cart" className="p-2 text-gray-600 relative">
                  <IconCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[17px] h-[17px] rounded-full flex items-center justify-center animate-pulse">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              )}
              <Link to="/client/profile" className="p-1">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-blue-100" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <IconUser size={16} />
                  </div>
                )}
              </Link>
              <button onClick={toggle} className="p-2 text-gray-500">
                {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
              </button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-600">
                <IconMenu size={22} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay mobile */}
      {menuOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={closeMenu} />}

      {/* Sidebar mobile */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 md:hidden ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <LogoDisplay />
          </div>
          <button onClick={closeMenu} className="p-2 text-gray-400 hover:text-gray-600">
            <IconClose size={22} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition">
              <span className="text-gray-400">{l.icon}</span> {l.label}
            </Link>
          ))}
          {isAuthenticated && authLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition relative">
              <span className="text-gray-400">{l.icon}</span>
              {l.badge > 0 && (
                <span className="absolute left-10 top-2 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                  {l.badge > 9 ? '9+' : l.badge}
                </span>
              )}
              {l.label}
            </Link>
          ))}
          <hr className="my-2" />
          {isAuthenticated ? (
            <button onClick={() => { logout(); navigate('/'); closeMenu(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition w-full">
              <IconLogout size={18} /> Déconnexion
            </button>
          ) : (
            <Link to="/login" onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white justify-center font-semibold">
              <IconUser size={18} /> Se connecter
            </Link>
          )}
        </nav>
      </div>

      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6 h-full"><Outlet /></div>
      </main>
    </div>
  );
}