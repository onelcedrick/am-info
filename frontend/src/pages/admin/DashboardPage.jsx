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

  if (!stats) return <div className="text-center py-10 text-gray-400">Chargement...</div>;

  const orderStatusLabels = {
    pending: 'En attente', awaiting_payment: 'Paiement', paid: 'Payée',
    preparing: 'Prépa', ready: 'Prête', delivered: 'Livrée', cancelled: 'Annulée'
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  const orderChartData = {
    labels: Object.keys(stats.orders_by_status).map(s => orderStatusLabels[s] || s),
    datasets: [{
      data: Object.values(stats.orders_by_status),
      backgroundColor: ['#facc15', '#3b82f6', '#22c55e', '#a855f7', '#14b8a6', '#16a34a', '#ef4444'],
      borderRadius: 6,
    }]
  };

  const dailyChartData = {
    labels: stats.daily_orders.map(d => d.date),
    datasets: [{
      data: stats.daily_orders.map(d => d.count),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
    }]
  };

  const categoryChartData = {
    labels: stats.top_categories.map(c => c.name),
    datasets: [{
      data: stats.top_categories.map(c => c.count),
      backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'],
      borderWidth: 0,
    }]
  };

  const ticketChartData = {
    labels: ['Ouverts', 'Assignés', 'En cours', 'Résolus', 'Fermés'],
    datasets: [{
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
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
      
      {/* Cartes stats - 2 colonnes mobile, 4 desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-400 text-xs mb-1">Chiffre d'affaires</p>
          <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.total_revenue.toLocaleString()} Ar</p>
          <p className="text-[10px] text-gray-400 mt-1">30j: {stats.revenue_30d.toLocaleString()} Ar</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-400 text-xs mb-1">Commandes</p>
          <p className="text-xl md:text-2xl font-bold text-green-600">{stats.total_orders}</p>
          <p className="text-[10px] text-gray-400 mt-1">{stats.orders_by_status.delivered || 0} livrées</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-400 text-xs mb-1">Clients</p>
          <p className="text-xl md:text-2xl font-bold text-purple-600">{stats.total_clients}</p>
          <p className="text-[10px] text-gray-400 mt-1">{stats.total_products} produits</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-400 text-xs mb-1">Tickets</p>
          <p className="text-xl md:text-2xl font-bold text-orange-600">{stats.total_tickets}</p>
          <p className="text-[10px] text-gray-400 mt-1">{stats.tickets_by_status.open || 0} ouverts</p>
        </div>
      </div>

      {/* Alertes stock */}
      {(stats.low_stock > 0 || stats.out_of_stock > 0) && (
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {stats.out_of_stock > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 font-bold text-lg">{stats.out_of_stock}</p>
              <p className="text-red-500 text-xs">En rupture de stock</p>
            </div>
          )}
          {stats.low_stock > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p className="text-yellow-600 font-bold text-lg">{stats.low_stock}</p>
              <p className="text-yellow-500 text-xs">Stock faible</p>
            </div>
          )}
        </div>
      )}

      {/* Graphiques - 1 colonne mobile, 2 desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Commandes 7 jours */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-sm mb-3">Commandes (7 jours)</h3>
          <div className="h-48 md:h-56">
            <Line data={dailyChartData} options={chartOptions} />
          </div>
        </div>

        {/* Commandes par statut */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-sm mb-3">Commandes par statut</h3>
          <div className="h-48 md:h-56">
            <Bar data={orderChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Donuts - 2 colonnes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-sm mb-3">Top catégories</h3>
          <div className="h-48 md:h-56 flex items-center justify-center">
            <div className="w-40 md:w-48">
              <Doughnut 
                data={categoryChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: true,
                  plugins: { 
                    legend: { 
                      position: 'bottom',
                      labels: { boxWidth: 10, padding: 10, font: { size: 10 } }
                    } 
                  } 
                }} 
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-sm mb-3">Tickets par statut</h3>
          <div className="h-48 md:h-56 flex items-center justify-center">
            <div className="w-40 md:w-48">
              <Doughnut 
                data={ticketChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: true,
                  plugins: { 
                    legend: { 
                      position: 'bottom',
                      labels: { boxWidth: 10, padding: 10, font: { size: 10 } }
                    } 
                  } 
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
