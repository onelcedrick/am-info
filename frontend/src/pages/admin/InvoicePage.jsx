// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function InvoicePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState({});
  const [message, setMessage] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    api.get('/admin/orders')
      .then(r => setOrders(r.data))
      .catch(err => console.error('Erreur chargement commandes:', err));
  }, []);

  const generateInvoice = async (orderId) => {
    setLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const res = await api.post(`/admin/invoices/${orderId}`);
      setPdfUrl(res.data.pdf_url);
      setMessage(`Facture generee ! Cliquez sur le lien pour ouvrir.`);
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      console.error('Erreur facture:', err);
      alert('Erreur lors de la generation de la facture');
    } finally {
      setLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const statusLabels = {
    pending: 'En attente', awaiting_payment: 'Paiement boutique', paid: 'Payee',
    preparing: 'Preparation', ready: 'Prete', delivered: 'Livree', cancelled: 'Annulee'
  };

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Factures</h1>

      {message && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">
          {message}
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
              className="ml-2 text-blue-600 underline font-semibold">
              Ouvrir le PDF
            </a>
          )}
        </div>
      )}

      <div className="flex-1 bg-white rounded-xl shadow overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-3">Commande</th>
                <th className="text-left p-3">Date</th>
                <th className="text-center p-3">Statut</th>
                <th className="text-right p-3">Montant</th>
                <th className="text-center p-3">Facture</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">#{order.id?.slice(0, 8)}</td>
                  <td className="p-3">{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="p-3 text-center">{statusLabels[order.status] || order.status}</td>
                  <td className="p-3 text-right font-bold">{order.total_amount?.toLocaleString()} Ar</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => generateInvoice(order.id)}
                      disabled={loading[order.id]}
                      className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50 transition">
                      {loading[order.id] ? 'Generation...' : 'Generer PDF'}
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Aucune commande</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
