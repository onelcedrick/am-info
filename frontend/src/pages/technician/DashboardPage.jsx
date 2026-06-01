// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0
  });
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    api.get('/technician/tickets').then(r => {
      const tickets = r.data;
      setRecentTickets(tickets.slice(0, 5));
      setStats({
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        assigned: tickets.filter(t => t.status === 'assigned').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        closed: tickets.filter(t => t.status === 'closed').length
      });
    }).catch(() => {});
  };

  const priorityLabels = { low: 'Faible', normal: 'Normal', high: 'Haute', urgent: 'Urgent' };
  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  };
  const statusColors = {
    open: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">Dashboard Technicien</h1>
      
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-xs mb-1">Total tickets</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow p-4 border border-yellow-200">
          <p className="text-yellow-600 text-xs mb-1">Ouverts</p>
          <p className="text-3xl font-bold text-yellow-700">{stats.open || 0}</p>
        </div>
        <div className="bg-blue-50 rounded-xl shadow p-4 border border-blue-200">
          <p className="text-blue-600 text-xs mb-1">Assignes</p>
          <p className="text-3xl font-bold text-blue-700">{stats.assigned || 0}</p>
        </div>
        <div className="bg-purple-50 rounded-xl shadow p-4 border border-purple-200">
          <p className="text-purple-600 text-xs mb-1">En cours</p>
          <p className="text-3xl font-bold text-purple-700">{stats.inProgress || 0}</p>
        </div>
        <div className="bg-green-50 rounded-xl shadow p-4 border border-green-200">
          <p className="text-green-600 text-xs mb-1">Resolus</p>
          <p className="text-3xl font-bold text-green-700">{stats.resolved || 0}</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow overflow-hidden flex flex-col">
        <h2 className="text-lg font-bold p-4 border-b">Tickets recents</h2>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-3">Sujet</th>
                <th className="text-center p-3">Priorite</th>
                <th className="text-center p-3">Statut</th>
                <th className="text-center p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map(t => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{t.subject}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColors[t.priority] || ''}`}>
                      {priorityLabels[t.priority] || t.priority}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[t.status] || ''}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 text-center text-gray-500">
                    {new Date(t.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
              {recentTickets.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Aucun ticket</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
