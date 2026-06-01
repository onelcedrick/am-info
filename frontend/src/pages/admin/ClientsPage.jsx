// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { SkeletonRow, EmptyState } from '../../components/Skeleton';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedClients, setSelectedClients] = useState([]);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/clients/').then(r => setClients(r.data)).finally(() => setLoading(false));
  }, []);

  const toggleSelect = (email) => {
    setSelectedClients(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const selectAll = () => {
    if (selectedClients.length === filtered.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filtered.map(c => c.email));
    }
  };

  const sendBroadcast = async () => {
    if (!subject || !message) {
      toast.error('Sujet et message requis');
      return;
    }
    setSending(true);
    try {
      const clientEmails = selectedClients.length > 0 ? selectedClients : filtered.map(c => c.email);
      await api.post('/admin/clients/broadcast', {
        subject,
        message,
        client_ids: clientEmails
      });
      toast.success(`Emails envoyes a ${clientEmails.length} client(s)`);
      setShowBroadcast(false);
      setSubject('');
      setMessage('');
      setSelectedClients([]);
    } catch (err) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const filtered = clients.filter(c => 
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div><h1 className="text-2xl font-bold mb-4">Clients</h1><SkeletonRow cols={6} /></div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Clients ({clients.length})</h1>
        <button onClick={() => setShowBroadcast(!showBroadcast)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
          {showBroadcast ? 'Fermer' : '📢 Envoyer un email'}
        </button>
      </div>

      {/* Formulaire broadcast */}
      {showBroadcast && (
        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <h2 className="font-bold text-lg mb-4">Envoyer un email aux clients</h2>
          <div className="space-y-4">
            <input placeholder="Sujet de l'email" value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg" />
            <textarea placeholder="Contenu du message..." value={message} onChange={e => setMessage(e.target.value)}
              rows={5} className="w-full px-4 py-2 border rounded-lg" />
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">
                {selectedClients.length > 0 
                  ? `${selectedClients.length} client(s) selectionne(s)` 
                  : `Tous les clients (${filtered.length})`}
              </p>
              <button onClick={sendBroadcast} disabled={sending}
                className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barre recherche */}
      <div className="mb-4">
        <input type="text" placeholder="Rechercher un client..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg" />
      </div>

      {/* Tableau clients */}
      {filtered.length === 0 ? (
        <EmptyState icon="👥" title="Aucun client" description="Les clients inscrits apparaitront ici." />
      ) : (
        <div className="flex-1 bg-white rounded-xl shadow overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-3">
                    <input type="checkbox" checked={selectedClients.length === filtered.length} onChange={selectAll} />
                  </th>
                  <th className="text-left p-3">Nom</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-right p-3">Depenses totales</th>
                  <th className="text-center p-3">Commandes</th>
                  <th className="text-center p-3">Inscrit le</th>
                  <th className="text-center p-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedClients.includes(c.email)}
                        onChange={() => toggleSelect(c.email)} />
                    </td>
                    <td className="p-3 font-medium">{c.full_name}</td>
                    <td className="p-3 text-gray-500">{c.email}</td>
                    <td className="p-3 text-right font-bold text-blue-600">{c.total_spent?.toLocaleString()} Ar</td>
                    <td className="p-3 text-center">{c.total_orders}</td>
                    <td className="p-3 text-center text-gray-400">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {c.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
