// -*- coding: utf-8 -*-
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import ClientLayout from './layouts/ClientLayout';
import AdminLayout from './layouts/AdminLayout';
import TechnicianLayout from './layouts/TechnicianLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import GoogleCallback from './pages/auth/GoogleCallback';
import HomePage from './pages/client/HomePage';
import ProductListPage from './pages/client/ProductListPage';
import ProductDetailPage from './pages/client/ProductDetailPage';
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
import TechnicianDashboard from './pages/technician/DashboardPage';
import TicketListPage from './pages/technician/TicketListPage';
import PartRequestsPage from './pages/technician/PartRequestsPage';

function NavigationGuard() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const protectedPaths = ['/client', '/admin', '/technician'];
    const isProtectedPath = protectedPaths.some(path => location.pathname.startsWith(path));
    if (isProtectedPath && !token && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
    const handlePopState = () => {
      const currentToken = localStorage.getItem('token');
      if (isProtectedPath && !currentToken) {
        window.history.pushState(null, '', '/login');
        navigate('/login', { replace: true });
      }
    };
    if (isProtectedPath) window.history.pushState(null, '', location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.pathname, isAuthenticated, navigate]);

  return null;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <NavigationGuard />
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#1a73e8', color: '#fff', borderRadius: '12px', padding: '12px 16px', fontSize: '14px' } }} />
      <Routes>
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="map" element={<MapPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/client" element={<ProtectedRoute allowedRoles={['client']}><ClientLayout /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="tickets" element={<TicketPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<ProductManagePage />} />
          <Route path="discounts" element={<DiscountPage />} />
          <Route path="orders" element={<OrdersManagePage />} />
          <Route path="invoices" element={<InvoicePage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
        </Route>
        <Route path="/technician" element={<ProtectedRoute allowedRoles={['technician']}><TechnicianLayout /></ProtectedRoute>}>
          <Route index element={<TechnicianDashboard />} />
          <Route path="tickets" element={<TicketListPage />} />
          <Route path="parts" element={<PartRequestsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
