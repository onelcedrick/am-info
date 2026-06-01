// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    api.get('/orders/').then(res => setOrders(res.data)).catch(console.error);
  };

  const cancelOrder = async (orderId) => {
    if (!confirm('Voulez-vous vraiment annuler cette commande ?')) return;
    try {
      await api.delete(`/orders/${orderId}`);
      toast.success('Commande annulee avec succes');
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'annulation');
    }
  };

  const statusLabels = {
    pending: 'En attente',
    awaiting_payment: 'Paiement en boutique',
    paid: 'Payee',
    preparing: 'En preparation',
    ready: 'Prete',
    delivered: 'Livree',
    cancelled: 'Annulee'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    awaiting_payment: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-teal-100 text-teal-800',
    delivered: 'bg-green-200 text-green-900',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mes Commandes</h1>
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">Aucune commande</div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-sm text-gray-500">Commande #{order.id.slice(0, 8)}</span>
                  <span className="text-sm text-gray-400 ml-4">{new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status]}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                  {(order.status === 'pending' || order.status === 'awaiting_payment') && (
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold hover:underline">
                      Annuler
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-blue-600">{order.total_amount?.toLocaleString()} Ar</span>
                {order.items && order.items.length > 0 && (
                  <span className="text-sm text-gray-500">{order.items.length} produit(s)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
