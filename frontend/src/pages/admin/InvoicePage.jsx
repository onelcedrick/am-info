// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { IconFileText, IconDownload, IconCheck } from '../../components/Icons';

export default function InvoicePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/admin/orders')
      .then(r => {
        const filtered = (r.data || []).filter(order => order.status !== 'cancelled');
        setOrders(filtered);
      })
      .catch(err => console.error('Erreur chargement commandes:', err));
  }, []);

  const generateInvoice = async (orderId) => {
    setLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const res = await api.post(`/admin/invoices/${orderId}`);
      // Ouvre le PDF dans un nouvel onglet directement
      if (res.data.pdf_url) {
        window.open(res.data.pdf_url, '_blank');
        setMessage('Facture generee et ouverte dans un nouvel onglet');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      alert('Erreur lors de la generation de la facture');
    } finally {
      setLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const statusLabels = {
    pending: 'En attente', awaiting_payment: 'Paiement boutique', paid: 'Payee',
    preparing: 'Preparation', ready: 'Prete', delivered: 'Livree'
  };
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800', awaiting_payment: 'bg-orange-100 text-orange-800',
    paid: 'bg-green-100 text-green-800', preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-teal-100 text-teal-800', delivered: 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl md:text-2xl font-bold mb-4">Factures</h1>

      {message && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <IconCheck size={16} />
          {message}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Desktop */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-600 text-xs uppercase">Commande</th>
                <th className="text-left p-3 font-semibold text-gray-600 text-xs uppercase">Client</th>
                <th className="text-left p-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                <th className="text-center p-3 font-semibold text-gray-600 text-xs uppercase">Statut</th>
                <th className="text-right p-3 font-semibold text-gray-600 text-xs uppercase">Montant</th>
                <th className="text-center p-3 font-semibold text-gray-600 text-xs uppercase">Facture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="p-3 font-mono text-xs text-blue-600 font-semibold">#{order.id?.slice(0, 8)}</td>
                  <td className="p-3 text-sm">{order.user_name || 'Client'}</td>
                  <td className="p-3 text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-sm">{order.total_amount?.toLocaleString()} Ar</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => generateInvoice(order.id)}
                      disabled={loading[order.id]}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1 mx-auto">
                      <IconFileText size={12} />
                      {loading[order.id] ? '...' : 'Generer'}
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucune commande eligible</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-mono text-xs text-blue-600 font-semibold">#{order.id?.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">{order.user_name || 'Client'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
                <span className="font-bold text-blue-600">{order.total_amount?.toLocaleString()} Ar</span>
              </div>
              <button
                onClick={() => generateInvoice(order.id)}
                disabled={loading[order.id]}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-1">
                <IconFileText size={12} />
                {loading[order.id] ? 'Generation...' : 'Generer facture PDF'}
              </button>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-8 text-gray-400">Aucune commande eligible</div>
          )}
        </div>
      </div>
    </div>
  );
}