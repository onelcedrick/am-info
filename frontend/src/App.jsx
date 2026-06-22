// -*- coding: utf-8 -*-
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import PageLoader from './components/PageLoader';
import PageTransition from './components/PageTransition';
import SEO from './components/SEO';
import CompareBar from './components/CompareBar';
import ClientLayout from './layouts/ClientLayout';
import AdminLayout from './layouts/AdminLayout';
import TechnicianLayout from './layouts/TechnicianLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import GoogleCallback from './pages/auth/GoogleCallback';
import HomePage from './pages/client/HomePage';
import ProductListPage from './pages/client/ProductListPage';
import ProductDetailPage from './pages/client/ProductDetailPage';
import ComparePage from './pages/client/ComparePage';
import CartPage from './pages/client/CartPage';
import OrdersPage from './pages/client/OrdersPage';
import TicketPage from './pages/client/TicketPage';
import MapPage from './pages/client/MapPage';
import ProfilePage from './pages/client/ProfilePage';
import AdminDashboard from './pages/admin/DashboardPage';
import ProductManagePage from './pages/admin/ProductManagePage';
import DiscountPage from './pages/admin/DiscountPage';
import OrdersManagePage from './pages/admin/OrdersManagePage';
import InvoicePage from './pages/admin/InvoicePage';
import ClientsPage from './pages/admin/ClientsPage';
import TransactionsPage from './pages/admin/TransactionsPage';
import LogsPage from './pages/admin/LogsPage';
import TechnicianDashboard from './pages/technician/DashboardPage';
import TicketListPage from './pages/technician/TicketListPage';
import PartRequestsPage from './pages/technician/PartRequestsPage';
import UsersPage from './pages/admin/UsersPage';
import SettingsPage from './pages/admin/SettingsPage';

function NavigationGuard() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('token');
    const protectedPaths = ['/client', '/admin', '/technician'];
    const isProtectedPath = protectedPaths.some(path => location.pathname.startsWith(path));
    if (isProtectedPath && !token && !isAuthenticated) navigate('/login', { replace: true });
  }, [location.pathname, isAuthenticated, navigate]);
  return null;
}

function AppRoutes() {
  const location = useLocation();
  
  return (
    <>
      <PageLoader />
      <NavigationGuard />
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#1a73e8', color: '#fff', borderRadius: '12px', padding: '12px 16px', fontSize: '14px' } }} />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Routes publiques */}
          <Route path="/" element={<ClientLayout />}>
            <Route index element={<PageTransition><SEO /><HomePage /></PageTransition>} />
            <Route path="products" element={<PageTransition><SEO title="Produits" description="Catalogue de materiel informatique" /><ProductListPage /></PageTransition>} />
            <Route path="products/:id" element={<PageTransition><ProductDetailPage /></PageTransition>} />
            <Route path="compare" element={<PageTransition><ComparePage /></PageTransition>} />
            <Route path="map" element={<PageTransition><SEO title="Boutique" description="Notre boutique a Antananarivo" /><MapPage /></PageTransition>} />
          </Route>
          <Route path="/login" element={<PageTransition><SEO title="Connexion" /><LoginPage /></PageTransition>} />
          <Route path="/register" element={<PageTransition><SEO title="Inscription" /><RegisterPage /></PageTransition>} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          
          {/* Client */}
          <Route path="/client" element={<ProtectedRoute allowedRoles={['client']}><ClientLayout /></ProtectedRoute>}>
            <Route index element={<PageTransition><HomePage /></PageTransition>} />
            <Route path="products" element={<PageTransition><ProductListPage /></PageTransition>} />
            <Route path="products/:id" element={<PageTransition><ProductDetailPage /></PageTransition>} />
            <Route path="compare" element={<PageTransition><ComparePage /></PageTransition>} />
            <Route path="cart" element={<PageTransition><SEO title="Panier" /><CartPage /></PageTransition>} />
            <Route path="orders" element={<PageTransition><SEO title="Mes Commandes" /><OrdersPage /></PageTransition>} />
            <Route path="tickets" element={<PageTransition><SEO title="Maintenance" /><TicketPage /></PageTransition>} />
            <Route path="map" element={<PageTransition><MapPage /></PageTransition>} />
            <Route path="profile" element={<PageTransition><SEO title="Mon Profil" /><ProfilePage /></PageTransition>} />
          </Route>
          
          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<PageTransition><AdminDashboard /></PageTransition>} />
            <Route path="products" element={<PageTransition><ProductManagePage /></PageTransition>} />
            <Route path="discounts" element={<PageTransition><DiscountPage /></PageTransition>} />
            <Route path="orders" element={<PageTransition><OrdersManagePage /></PageTransition>} />
            <Route path="invoices" element={<PageTransition><InvoicePage /></PageTransition>} />
            <Route path="clients" element={<PageTransition><ClientsPage /></PageTransition>} />
            <Route path="transactions" element={<PageTransition><TransactionsPage /></PageTransition>} />
            <Route path="logs" element={<PageTransition><LogsPage /></PageTransition>} />
            <Route path="users" element={<PageTransition><UsersPage /></PageTransition>} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          
          {/* Technicien */}
          <Route path="/technician" element={<ProtectedRoute allowedRoles={['technician']}><TechnicianLayout /></ProtectedRoute>}>
            <Route index element={<PageTransition><TechnicianDashboard /></PageTransition>} />
            <Route path="tickets" element={<PageTransition><TicketListPage /></PageTransition>} />
            <Route path="parts" element={<PageTransition><PartRequestsPage /></PageTransition>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
      <CompareBar />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
