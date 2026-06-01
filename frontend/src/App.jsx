import AboutPage from "./pages/client/AboutPage";
// -*- coding: utf-8 -*-
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
import TechnicianDashboard from './pages/technician/DashboardPage';
import TicketListPage from './pages/technician/TicketListPage';
import PartRequestsPage from './pages/technician/PartRequestsPage';
import ClientsPage from './pages/admin/ClientsPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{
            duration: 3000,
            style: { background: '#1a73e8', color: '#fff', borderRadius: '12px', padding: '12px 16px', fontSize: '14px' }
          }} />
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
            </Route>
            <Route path="/technician" element={<ProtectedRoute allowedRoles={['technician']}><TechnicianLayout /></ProtectedRoute>}>
              <Route index element={<TechnicianDashboard />} />
              <Route path="tickets" element={<TicketListPage />} />
              <Route path="parts" element={<PartRequestsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
