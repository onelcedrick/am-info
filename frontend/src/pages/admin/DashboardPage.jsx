// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function DashboardPage() {
  const [stats, setStats] = useState({ products: 0, orders: 0, tickets: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    // Charger les produits
    api.get('/admin/products/').then(r => {
      setStats(prev => ({ ...prev, products: r.data.length }));
    }).catch(() => {});

    // Charger les commandes
    api.get('/admin/orders').then(r => {
      const orders = r.data;
      setStats(prev => ({ ...prev, orders: orders.length }));
      setRecentOrders(orders.slice(0, 5));
      const total = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
      setStats(prev => ({ ...prev, revenue: total }));
    }).catch(() => {});

    // Tickets
    api.get('/tickets').then(r => {
      setStats(prev => ({ ...prev, tickets: r.data.length }));
    }).catch(() => {});
  }, []);

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
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-gray-500 text-sm">Produits</span>
          </div>
          <p className="text-3xl font-bold">{stats.products}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-gray-500 text-sm">Commandes</span>
          </div>
          <p className="text-3xl font-bold">{stats.orders}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span className="text-gray-500 text-sm">Tickets</span>
          </div>
          <p className="text-3xl font-bold">{stats.tickets}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-500 text-sm">Revenu</span>
          </div>
          <p className="text-3xl font-bold">{stats.revenue.toLocaleString()} Ar</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow overflow-hidden flex flex-col">
        <h2 className="text-lg font-bold p-4 border-b">Dernieres commandes</h2>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-right p-3">Montant</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-gray-500 font-mono text-xs">{order.id?.slice(0, 8)}</td>
                  <td className="p-3">{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[order.status] || ''}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold">{order.total_amount?.toLocaleString()} Ar</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-400">Aucune commande</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
