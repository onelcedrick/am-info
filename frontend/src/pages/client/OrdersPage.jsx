// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { EmptyState } from '../../components/Skeleton';
import PaymentModal from '../../components/PaymentModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Icône SVG inline (pas de dépendance externe)
const DownloadIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentOrder, setPaymentOrder] = useState(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = () => {
    api.get('/orders/')
      .then(res => {
        const data = res.data || [];
        // DEBUG: voir les statuts réels dans la console
        console.log('Orders data:', data);
        data.forEach(o => console.log(`Order ${o.id?.slice(0,8)} status="${o.status}"`));
        setOrders(data);
      })
      .catch(err => {
        console.error('Error loading orders:', err);
        toast.error('Erreur chargement commandes');
      })
      .finally(() => setLoading(false));
  };

  const cancelOrder = async (orderId) => {
    if (!confirm('Annuler cette commande ?')) return;
    try {
      await api.delete(`/orders/${orderId}`);
      toast.success('Commande annulée');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const res = await api.get(`/orders/${orderId}/invoice`);
      const pdfUrl = res.data?.pdf_url;
      let fullUrl = pdfUrl;
      if (pdfUrl && pdfUrl.includes('localhost')) {
        fullUrl = pdfUrl.replace('http://localhost:8000', API_URL);
      }
      if (fullUrl) {
        window.open(fullUrl, '_blank');
      } else {
        toast.error('Facture non disponible');
      }
    } catch (err) {
      console.error('Invoice error:', err);
      toast.error(err.response?.data?.detail || 'Facture non encore générée');
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentOrder(null);
    loadOrders();
  };

  const statusLabels = {
    pending: 'En attente',
    awaiting_payment: 'En attente de paiement',
    paid: 'Payée',
    preparing: 'En préparation',
    ready: 'Prête',
    delivered: 'Livrée',
    cancelled: 'Annulée'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    awaiting_payment: 'bg-orange-100 text-orange-800',
    paid: 'bg-green-100 text-green-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-teal-100 text-teal-800',
    delivered: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  // Version robuste: accepte plusieurs variantes de statut
  const canDownloadInvoice = (status) => {
    const validStatuses = ['paid', 'preparing', 'ready', 'delivered'];
    return validStatuses.includes(status);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl md:text-2xl font-bold mb-6">Mes Commandes</h1>
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="Aucune commande"
        description="Vous n'avez pas encore passé de commande."
        action={
          <Link to="/products" className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm">
            Voir les produits
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Mes Commandes</h1>

      {/* Desktop */}
      <div className="hidden md:block space-y-3">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400 font-mono">#{order.id?.slice(0, 8)}</span>
                <span className="text-xs text-gray-400">
                  {order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  }) : ''}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-blue-600">
                  {order.total_amount?.toLocaleString?.() || order.total_amount} Ar
                </span>

                {/* BOUTON FACTURE - Desktop */}
                {canDownloadInvoice(order.status) && (
                  <button
                    onClick={() => downloadInvoice(order.id)}
                    className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-100 transition flex items-center gap-1.5"
                    title="Télécharger la facture"
                  >
                    <DownloadIcon size={14} />
                    Facture
                  </button>
                )}

                {(order.status === 'pending' || order.status === 'awaiting_payment') && (
                  <>
                    <button
                      onClick={() => setPaymentOrder(order)}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 transition"
                    >
                      Payer
                    </button>
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="text-gray-300 hover:text-red-500 transition text-sm"
                      title="Annuler"
                    >
                      🗑
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs text-gray-400 font-mono">#{order.id?.slice(0, 8)}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short'
                  }) : ''}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                {statusLabels[order.status] || order.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-blue-600">
                {order.total_amount?.toLocaleString?.() || order.total_amount} Ar
              </span>
              <div className="flex items-center gap-2">

                {/* BOUTON FACTURE - Mobile */}
                {canDownloadInvoice(order.status) && (
                  <button
                    onClick={() => downloadInvoice(order.id)}
                    className="bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-100 transition flex items-center gap-1"
                    title="Télécharger la facture"
                  >
                    <DownloadIcon size={14} />
                    Facture
                  </button>
                )}

                {(order.status === 'pending' || order.status === 'awaiting_payment') && (
                  <>
                    <button
                      onClick={() => setPaymentOrder(order)}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold"
                    >
                      Payer
                    </button>
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="w-7 h-7 bg-red-50 text-red-400 rounded-full flex items-center justify-center text-sm"
                    >
                      🗑
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {paymentOrder && (
        <PaymentModal
          orderId={paymentOrder.id}
          orderTotal={paymentOrder.total_amount}
          onClose={() => setPaymentOrder(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}