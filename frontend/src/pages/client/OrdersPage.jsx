import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('OrdersPage mounted, fetching...');
    api.get('/orders')
      .then(res => {
        console.log('Orders received:', res.data);
        setOrders(res.data);
      })
      .catch(err => console.error('Orders error:', err))
      .finally(() => setLoading(false));
  }, []);

  const statusLabels = {
    pending: 'En attente',
    awaiting_payment: 'Paiement en boutique',
    paid: 'Payée',
    preparing: 'En préparation',
    ready: 'Prête',
    delivered: 'Livrée',
    cancelled: 'Annulée'
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

  if (loading) {
    return <div className="text-center py-10 text-lg">Chargement des commandes...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">📋 Mes Commandes</h1>
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">
          Aucune commande
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500">#{order.id?.slice(0, 8)}</span>
                  <span className="text-sm text-gray-400 ml-4">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status] || 'bg-gray-100'}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {order.total_amount?.toLocaleString()} Ar
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
