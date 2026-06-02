// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { loadData(); }, [filterStatus]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/payments/transactions' + (filterStatus ? `?status=${filterStatus}` : '')).then(r => setTransactions(r.data || [])),
      api.get('/admin/payments/stats').then(r => setStats(r.data))
    ]).finally(() => setLoading(false));
  };

  const verifyTransaction = async (orderId) => {
    try {
      await api.post(`/admin/payments/verify/${orderId}`);
      toast.success('Transaction verifiee et confirmee');
      loadData();
    } catch (err) { toast.error('Erreur verification'); }
  };

  const changeStatus = async (orderId, status) => {
    await api.put(`/admin/orders/${orderId}/status?status=${status}`);
    toast.success('Statut mis a jour');
    loadData();
  };

  const statusLabels = { awaiting_payment: 'En attente', paid: 'Confirme', preparing: 'En prepa', ready: 'Prete', delivered: 'Livree' };
  const statusColors = { awaiting_payment: 'bg-orange-100 text-orange-800', paid: 'bg-green-100 text-green-800', preparing: 'bg-purple-100 text-purple-800', ready: 'bg-teal-100 text-teal-800', delivered: 'bg-blue-100 text-blue-800' };

  if (loading) return <div className="text-center py-10 text-gray-400">Chargement...</div>;

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">Transactions Mobile Money</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-gray-500 text-xs mb-1">Total transactions</p>
            <p className="text-3xl font-bold">{stats.total_transactions}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow p-4 border border-green-200">
            <p className="text-green-600 text-xs mb-1">Confirmees</p>
            <p className="text-3xl font-bold text-green-700">{stats.total_paid}</p>
            <p className="text-xs text-green-500">{stats.total_revenue?.toLocaleString()} Ar</p>
          </div>
          <div className="bg-orange-50 rounded-xl shadow p-4 border border-orange-200">
            <p className="text-orange-600 text-xs mb-1">En attente</p>
            <p className="text-3xl font-bold text-orange-700">{stats.total_pending}</p>
            <p className="text-xs text-orange-500">{stats.total_pending_amount?.toLocaleString()} Ar</p>
          </div>
          <div className="bg-blue-50 rounded-xl shadow p-4 border border-blue-200">
            <p className="text-blue-600 text-xs mb-1">Revenu total</p>
            <p className="text-2xl font-bold text-blue-700">{stats.total_revenue?.toLocaleString()} Ar</p>
          </div>
        </div>
      )}

      {/* Filtre */}
      <div className="flex gap-4 mb-4 items-center">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 border rounded-lg text-sm">
          <option value="">Toutes les transactions</option>
          <option value="awaiting_payment">En attente</option>
          <option value="paid">Confirmees</option>
          <option value="preparing">En preparation</option>
          <option value="ready">Pretes</option>
          <option value="delivered">Livrees</option>
        </select>
        <span className="text-sm text-gray-400">{transactions.length} transaction(s)</span>
      </div>

      {/* Tableau */}
      <div className="flex-1 bg-white rounded-xl shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left p-3">Ref Transaction</th>
              <th className="text-left p-3">Ref Commande</th>
              <th className="text-left p-3">Client</th>
              <th className="text-left p-3">Contact</th>
              <th className="text-right p-3">Montant</th>
              <th className="text-center p-3">Statut</th>
              <th className="text-center p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.order_id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-mono text-xs text-blue-600 font-semibold">{t.transaction_ref}</td>
                <td className="p-3 font-mono text-xs text-gray-500">{t.order_ref}</td>
                <td className="p-3 font-medium">{t.client_name}</td>
                <td className="p-3 text-xs text-gray-500">
                  <p>{t.client_email}</p>
                  <p className="text-gray-400">{t.phone}</p>
                </td>
                <td className="p-3 text-right font-bold">{t.amount?.toLocaleString()} Ar</td>
                <td className="p-3 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[t.status]}`}>
                    {statusLabels[t.status]}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-1">
                    {t.status === 'awaiting_payment' && (
                      <button onClick={() => verifyTransaction(t.order_id)}
                        className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700">
                        Confirmer
                      </button>
                    )}
                    <select value={t.status} onChange={e => changeStatus(t.order_id, e.target.value)}
                      className="border rounded px-2 py-1 text-xs">
                      <option value="awaiting_payment">En attente</option>
                      <option value="paid">Confirme</option>
                      <option value="preparing">En prepa</option>
                      <option value="ready">Prete</option>
                      <option value="delivered">Livree</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr><td colSpan={7} className="p-12 text-center text-gray-400">Aucune transaction mobile money</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
