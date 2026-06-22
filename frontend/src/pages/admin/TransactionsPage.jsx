// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { 
  IconPackage, IconCheck, IconClock, IconTruck, IconSearch, IconRefreshCw,
  IconTrendingUp, IconDollarSign, IconAlertCircle, IconCreditCard, IconCheckCircle, IconCheckSquare 
} from '../../components/Icons';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

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

  const statusConfig = {
    awaiting_payment: { 
      label: 'En attente', 
      color: 'bg-orange-100 text-orange-800 border-orange-200', 
      icon: <IconClock size={14} /> 
    },
    paid: { 
      label: 'Confirme', 
      color: 'bg-green-100 text-green-800 border-green-200', 
      icon: <IconCheckCircle size={14} /> 
    },
    preparing: { 
      label: 'En prepa', 
      color: 'bg-purple-100 text-purple-800 border-purple-200', 
      icon: <IconPackage size={14} /> 
    },
    ready: { 
      label: 'Prete', 
      color: 'bg-teal-100 text-teal-800 border-teal-200', 
      icon: <IconCheckSquare size={14} /> 
    },
    delivered: { 
      label: 'Livree', 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      icon: <IconTruck size={14} /> 
    }
  };

  const filtered = transactions.filter(t => 
    search === '' || 
    t.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.transaction_ref?.toLowerCase().includes(search.toLowerCase()) ||
    t.order_ref?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
      <p className="text-sm">Chargement...</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <h1 className="text-xl md:text-2xl font-bold mb-3">Transactions Mobile Money</h1>
        
        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                <IconCreditCard size={16} className="text-blue-600" />
                <p className="text-gray-500 text-[10px] md:text-xs uppercase tracking-wide">Total</p>
              </div>
              <p className="text-xl md:text-3xl font-bold">{stats.total_transactions}</p>
              <p className="text-[10px] text-gray-400 mt-1">transactions</p>
            </div>
            <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                <IconCheckCircle size={16} className="text-green-600" />
                <p className="text-green-600 text-[10px] md:text-xs uppercase tracking-wide">Confirmees</p>
              </div>
              <p className="text-xl md:text-3xl font-bold text-green-700">{stats.total_paid}</p>
              <p className="text-[10px] text-green-500 mt-1">{stats.total_revenue?.toLocaleString()} Ar</p>
            </div>
            <div className="bg-orange-50 rounded-xl shadow-sm border border-orange-200 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                <IconAlertCircle size={16} className="text-orange-600" />
                <p className="text-orange-600 text-[10px] md:text-xs uppercase tracking-wide">En attente</p>
              </div>
              <p className="text-xl md:text-3xl font-bold text-orange-700">{stats.total_pending}</p>
              <p className="text-[10px] text-orange-500 mt-1">{stats.total_pending_amount?.toLocaleString()} Ar</p>
            </div>
            <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                <IconDollarSign size={16} className="text-blue-600" />
                <p className="text-blue-600 text-[10px] md:text-xs uppercase tracking-wide">Revenu</p>
              </div>
              <p className="text-lg md:text-2xl font-bold text-blue-700">{stats.total_revenue?.toLocaleString()} Ar</p>
              <p className="text-[10px] text-blue-500 mt-1">total genere</p>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-2 md:gap-3 md:items-center">
          <div className="relative flex-1">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher client, ref..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} 
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les statuts</option>
              <option value="awaiting_payment">En attente</option>
              <option value="paid">Confirmees</option>
              <option value="preparing">En preparation</option>
              <option value="ready">Pretes</option>
              <option value="delivered">Livrees</option>
            </select>
            <button onClick={loadData} className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm transition" title="Rafraichir">
              <IconRefreshCw size={16} />
            </button>
          </div>
          <span className="text-xs text-gray-400 hidden md:inline">{filtered.length} resultat(s)</span>
        </div>
      </div>

      {/* Liste - Desktop (tableau) / Mobile (cartes) */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-4">
        
        {/* Desktop : Tableau */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-600 text-xs uppercase">Transaction</th>
                  <th className="text-left p-3 font-semibold text-gray-600 text-xs uppercase">Client</th>
                  <th className="text-right p-3 font-semibold text-gray-600 text-xs uppercase">Montant</th>
                  <th className="text-center p-3 font-semibold text-gray-600 text-xs uppercase">Statut</th>
                  <th className="text-center p-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(t => {
                  const cfg = statusConfig[t.status];
                  return (
                    <tr key={t.order_id} className="hover:bg-gray-50 transition">
                      <td className="p-3">
                        <p className="font-mono text-xs text-blue-600 font-semibold">{t.transaction_ref}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Cmd: {t.order_ref}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-sm">{t.client_name}</p>
                        <p className="text-[10px] text-gray-500">{t.client_email}</p>
                      </td>
                      <td className="p-3 text-right font-bold text-sm">{t.amount?.toLocaleString()} Ar</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg?.color || 'bg-gray-100 text-gray-800'}`}>
                          {cfg?.icon} {cfg?.label || t.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1.5">
                          {t.status === 'awaiting_payment' && (
                            <button onClick={() => verifyTransaction(t.order_id)}
                              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition flex items-center gap-1">
                              <IconCheck size={12} /> Confirmer
                            </button>
                          )}
                          <select value={t.status} onChange={e => changeStatus(t.order_id, e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="awaiting_payment">En attente</option>
                            <option value="paid">Confirme</option>
                            <option value="preparing">En prepa</option>
                            <option value="ready">Prete</option>
                            <option value="delivered">Livree</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <IconCreditCard size={32} className="text-gray-300" />
                      <p>Aucune transaction trouvee</p>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile : Cartes */}
        <div className="md:hidden space-y-3">
          {filtered.map(t => {
            const cfg = statusConfig[t.status];
            return (
              <div key={t.order_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-mono text-xs text-blue-600 font-semibold">{t.transaction_ref}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Cmd: {t.order_ref}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg?.color || 'bg-gray-100 text-gray-800'}`}>
                    {cfg?.icon} {cfg?.label || t.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                    {t.client_name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.client_name}</p>
                    <p className="text-[10px] text-gray-500">{t.client_email}</p>
                    <p className="text-[10px] text-gray-400">{t.phone}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-3 pt-2 border-t border-gray-50">
                  <span className="text-xs text-gray-500">Montant</span>
                  <span className="font-bold text-lg text-blue-600">{t.amount?.toLocaleString()} Ar</span>
                </div>

                <div className="flex gap-2">
                  {t.status === 'awaiting_payment' && (
                    <button onClick={() => verifyTransaction(t.order_id)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition flex items-center justify-center gap-1">
                      <IconCheck size={12} /> Confirmer
                    </button>
                  )}
                  <select value={t.status} onChange={e => changeStatus(t.order_id, e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="awaiting_payment">En attente</option>
                    <option value="paid">Confirme</option>
                    <option value="preparing">En prepa</option>
                    <option value="ready">Prete</option>
                    <option value="delivered">Livree</option>
                  </select>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <IconCreditCard size={48} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm">Aucune transaction trouvee</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}