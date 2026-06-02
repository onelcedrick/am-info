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
    pending: 'En attente', awaiting_payment: 'Paiement en boutique', paid: 'Payee',
    preparing: 'En preparation', ready: 'Prete', delivered: 'Livree', cancelled: 'Annulee'
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
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl p-6 h-24" />)}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState icon="📋" title="Aucune commande" description="Vous n'avez pas encore passe de commande."
        action={<Link to="/products" className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm">Voir les produits</Link>} />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mes Commandes</h1>
      <div className="space-y-3">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400 font-mono">#{order.id.slice(0, 8)}</span>
                <span className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-blue-600">{order.total_amount?.toLocaleString()} Ar</span>
                {(order.status === 'pending' || order.status === 'awaiting_payment') && (
                  <button onClick={() => cancelOrder(order.id)}
                    className="text-xs text-gray-300 hover:text-red-400 transition">✕</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
