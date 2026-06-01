// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/technician/tickets').then(r => {
      const tickets = r.data || [];
      setStats({
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        assigned: tickets.filter(t => t.status === 'assigned').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-5 gap-4 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-xl shadow p-4"><div className="h-4 bg-gray-200 rounded w-1/2 mb-2" /><div className="h-8 bg-gray-200 rounded w-1/3" /></div>)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Technicien</h1>
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow p-4"><p className="text-gray-500 text-xs">Total</p><p className="text-3xl font-bold">{stats.total}</p></div>
        <div className="bg-yellow-50 rounded-xl shadow p-4"><p className="text-yellow-600 text-xs">Ouverts</p><p className="text-3xl font-bold text-yellow-700">{stats.open}</p></div>
        <div className="bg-blue-50 rounded-xl shadow p-4"><p className="text-blue-600 text-xs">Assignes</p><p className="text-3xl font-bold text-blue-700">{stats.assigned}</p></div>
        <div className="bg-purple-50 rounded-xl shadow p-4"><p className="text-purple-600 text-xs">En cours</p><p className="text-3xl font-bold text-purple-700">{stats.inProgress}</p></div>
        <div className="bg-green-50 rounded-xl shadow p-4"><p className="text-green-600 text-xs">Resolus</p><p className="text-3xl font-bold text-green-700">{stats.resolved}</p></div>
      </div>
    </div>
  );
}
