// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { EmptyState } from '../../components/Skeleton';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/')
      .then(res => setOrders(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cancelOrder = async (orderId) => {
    if (!confirm('Annuler cette commande ?')) return;
    try {
      await api.delete(`/orders/${orderId}`);
      toast.success('Commande annulee');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const statusLabels = {
    pending: 'En attente', awaiting_payment: 'Paiement boutique', paid: 'Payee',
    preparing: 'Preparation', ready: 'Prete', delivered: 'Livree', cancelled: 'Annulee'
  };
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800', awaiting_payment: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800', preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-teal-100 text-teal-800', delivered: 'bg-green-200 text-green-900', cancelled: 'bg-red-100 text-red-800'
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Mes Commandes</h1>
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="Aucune commande"
        description="Vous n'avez pas encore passe de commande."
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
      <h1 className="text-2xl font-bold mb-6">Mes Commandes</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="text-sm text-gray-500">#{order.id.slice(0, 8)}</span>
                <span className="text-sm text-gray-400 ml-4">{new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                {(order.status === 'pending' || order.status === 'awaiting_payment') && (
                  <button onClick={() => cancelOrder(order.id)} className="text-red-500 text-sm font-semibold hover:underline">Annuler</button>
                )}
              </div>
            </div>
            <p className="text-lg font-bold text-blue-600">{order.total_amount?.toLocaleString()} Ar</p>
          </div>
        ))}
      </div>
    </div>
  );
}
