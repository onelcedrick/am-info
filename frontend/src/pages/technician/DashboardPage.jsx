// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    api.get('/technician/tickets').then(r => {
      const tickets = r.data || [];
      setRecentTickets(tickets.slice(0, 5));
      setStats({
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        assigned: tickets.filter(t => t.status === 'assigned').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        closed: tickets.filter(t => t.status === 'closed').length,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const priorityLabels = { low: 'Faible', normal: 'Normal', high: 'Haute', urgent: 'Urgent' };
  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  };
  const statusLabels = { open: 'Ouvert', assigned: 'Assigné', in_progress: 'En cours', resolved: 'Résolu', closed: 'Fermé' };
  const statusColors = {
    open: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Dashboard Technicien</h1>

      {/* Stats - 2/3 colonnes mobile, 5 desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-400 text-xs mb-1">Total tickets</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-700">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-4">
          <p className="text-yellow-600 text-xs mb-1">Ouverts</p>
          <p className="text-2xl md:text-3xl font-bold text-yellow-700">{stats.open}</p>
        </div>
        <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-4">
          <p className="text-blue-600 text-xs mb-1">Assignés</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-700">{stats.assigned}</p>
        </div>
        <div className="bg-purple-50 rounded-xl shadow-sm border border-purple-200 p-4">
          <p className="text-purple-600 text-xs mb-1">En cours</p>
          <p className="text-2xl md:text-3xl font-bold text-purple-700">{stats.inProgress}</p>
        </div>
        <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-4">
          <p className="text-green-600 text-xs mb-1">Résolus</p>
          <p className="text-2xl md:text-3xl font-bold text-green-700">{stats.resolved}</p>
        </div>
      </div>

      {/* Tickets récents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">Tickets récents</h2>
        </div>
        
        {/* Tableau desktop */}
        <div className="hidden md:block overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Sujet</th>
                <th className="text-center p-3">Priorité</th>
                <th className="text-center p-3">Statut</th>
                <th className="text-center p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map(t => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium truncate max-w-[200px]">{t.subject}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColors[t.priority] || ''}`}>
                      {priorityLabels[t.priority] || t.priority}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[t.status] || ''}`}>
                      {statusLabels[t.status] || t.status}
                    </span>
                  </td>
                  <td className="p-3 text-center text-xs text-gray-400">
                    {new Date(t.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Liste mobile */}
        <div className="md:hidden divide-y">
          {recentTickets.length === 0 ? (
            <p className="p-4 text-center text-gray-400 text-sm">Aucun ticket récent</p>
          ) : (
            recentTickets.map(t => (
              <div key={t.id} className="p-4 space-y-2">
                <p className="font-medium text-sm truncate">{t.subject}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColors[t.priority] || ''}`}>
                    {priorityLabels[t.priority] || t.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[t.status] || ''}`}>
                    {statusLabels[t.status] || t.status}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(t.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
