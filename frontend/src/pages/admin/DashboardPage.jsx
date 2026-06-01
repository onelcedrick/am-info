// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats/').then(r => setStats(r.data)).catch(console.error);
    const interval = setInterval(() => {
      api.get('/admin/stats/').then(r => setStats(r.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div className="text-center py-10 text-gray-400">Chargement des statistiques...</div>;

  const orderStatusLabels = {
    pending: 'En attente', awaiting_payment: 'Paiement', paid: 'Payee',
    preparing: 'Preparation', ready: 'Prete', delivered: 'Livree', cancelled: 'Annulee'
  };

  const orderChartData = {
    labels: Object.keys(stats.orders_by_status).map(s => orderStatusLabels[s] || s),
    datasets: [{
      label: 'Commandes',
      data: Object.values(stats.orders_by_status),
      backgroundColor: ['#facc15', '#3b82f6', '#22c55e', '#a855f7', '#14b8a6', '#16a34a', '#ef4444'],
      borderRadius: 8,
    }]
  };

  const dailyChartData = {
    labels: stats.daily_orders.map(d => d.date),
    datasets: [{
      label: 'Commandes par jour',
      data: stats.daily_orders.map(d => d.count),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#3b82f6',
    }]
  };

  const categoryChartData = {
    labels: stats.top_categories.map(c => c.name),
    datasets: [{
      label: 'Produits par categorie',
      data: stats.top_categories.map(c => c.count),
      backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'],
      borderWidth: 0,
    }]
  };

  const ticketChartData = {
    labels: ['Ouverts', 'Assignes', 'En cours', 'Resolus', 'Fermes'],
    datasets: [{
      label: 'Tickets',
      data: [
        stats.tickets_by_status.open || 0,
        stats.tickets_by_status.assigned || 0,
        stats.tickets_by_status.in_progress || 0,
        stats.tickets_by_status.resolved || 0,
        stats.tickets_by_status.closed || 0,
      ],
      backgroundColor: ['#f59e0b', '#3b82f6', '#a855f7', '#22c55e', '#6b7280'],
      borderWidth: 0,
    }]
  };

  return (
    <div className="h-full overflow-auto pb-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Cartes stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500 text-xs mb-1">Chiffre d'affaires</p>
          <p className="text-3xl font-bold text-blue-600">{stats.total_revenue.toLocaleString()} Ar</p>
          <p className="text-xs text-gray-400 mt-1">30j: {stats.revenue_30d.toLocaleString()} Ar</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500 text-xs mb-1">Commandes</p>
          <p className="text-3xl font-bold text-green-600">{stats.total_orders}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.orders_by_status.delivered || 0} livrees</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500 text-xs mb-1">Clients</p>
          <p className="text-3xl font-bold text-purple-600">{stats.total_clients}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.total_products} produits</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500 text-xs mb-1">Tickets</p>
          <p className="text-3xl font-bold text-orange-600">{stats.total_tickets}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.tickets_by_status.open || 0} ouverts</p>
        </div>
      </div>

      {/* Stock alerts */}
      {(stats.low_stock > 0 || stats.out_of_stock > 0) && (
        <div className="flex gap-4 mb-8">
          {stats.out_of_stock > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex-1">
              <p className="text-red-600 font-bold">{stats.out_of_stock}</p>
              <p className="text-red-500 text-sm">Produits en rupture de stock</p>
            </div>
          )}
          {stats.low_stock > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex-1">
              <p className="text-yellow-600 font-bold">{stats.low_stock}</p>
              <p className="text-yellow-500 text-sm">Produits avec stock faible</p>
            </div>
          )}
        </div>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold text-lg mb-4">Commandes (7 derniers jours)</h3>
          <Line data={dailyChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold text-lg mb-4">Commandes par statut</h3>
          <Bar data={orderChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold text-lg mb-4">Top categories</h3>
          <div className="w-64 mx-auto">
            <Doughnut data={categoryChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold text-lg mb-4">Tickets par statut</h3>
          <div className="w-64 mx-auto">
            <Doughnut data={ticketChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
      </div>
    </div>
  );
}
