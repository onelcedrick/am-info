// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function OrdersManagePage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/admin/orders').then(r => setOrders(r.data));
  }, []);

  const changeStatus = async (id, status) => {
    await api.put(`/admin/orders/${id}/status?status=${status}`);
    api.get('/admin/orders').then(r => setOrders(r.data));
  };

  const statusLabels = {
    pending: 'En attente',
    awaiting_payment: 'Paiement boutique',
    paid: 'Payee',
    preparing: 'Preparation',
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
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Gestion des commandes</h1>
      <div className="flex-1 bg-white rounded-xl shadow overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Date</th>
                <th className="text-right p-3">Montant</th>
                <th className="text-center p-3">Statut</th>
                <th className="text-center p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-gray-500 font-mono text-xs">{order.id?.slice(0, 8)}</td>
                  <td className="p-3">{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="p-3 text-right font-bold">{order.total_amount?.toLocaleString()} Ar</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[order.status] || ''}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <select value={order.status}
                      onChange={(e) => changeStatus(order.id, e.target.value)}
                      className="border rounded px-2 py-1 text-xs">
                      <option value="pending">En attente</option>
                      <option value="awaiting_payment">Paiement boutique</option>
                      <option value="paid">Payee</option>
                      <option value="preparing">Preparation</option>
                      <option value="ready">Prete</option>
                      <option value="delivered">Livree</option>
                      <option value="cancelled">Annulee</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
