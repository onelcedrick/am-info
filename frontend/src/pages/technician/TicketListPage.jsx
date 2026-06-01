// -*- coding: utf-8 -*-
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const token = localStorage.getItem('token');
const userId = (() => {
  if (!token) return null;
  try { return JSON.parse(atob(token.split('.')[1])).sub; }
  catch { return null; }
})();

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export default function TicketListPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const loadTickets = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filterStatus !== 'all') params.append('status', filterStatus);
    if (filterPriority !== 'all') params.append('priority', filterPriority);
    api.get(`/technician/tickets${params.toString() ? '?' + params.toString() : ''}`)
      .then(r => setTickets(r.data || []))
      .finally(() => setLoading(false));
  };

  const loadMessages = () => {
    if (!selectedTicket) return;
    api.get(`/tickets/${selectedTicket.id}`).then(r => setMessages(r.data.messages || []));
  };

  useEffect(() => { loadTickets(); }, []);
  useEffect(() => { const d = setTimeout(() => loadTickets(), 300); return () => clearTimeout(d); }, [search, filterStatus, filterPriority]);
  useEffect(() => { loadMessages(); }, [selectedTicket]);
  useEffect(() => { if (autoScroll) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300); }, [messages, autoScroll]);
  useEffect(() => { if (!selectedTicket) return; const i = setInterval(() => loadMessages(), 2000); return () => clearInterval(i); }, [selectedTicket]);

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'typing') setTyping(data.is_typing);
        if (data.type === 'new_message') loadMessages();
      } catch (e) {}
    };
    return () => ws.close();
  }, [token]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  };

  const send = async () => {
    if (!text.trim() || !selectedTicket) return;
    await api.post(`/tickets/${selectedTicket.id}/messages`, { message: text });
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'message', ticket_id: selectedTicket.id }));
    }
    setText(''); setAutoScroll(true); loadMessages();
  };

  const assignToMe = async (id) => {
    await api.put(`/technician/tickets/${id}/assign`);
    toast.success('Ticket assigne');
    loadTickets();
  };

  const changeStatus = async (id, status) => {
    await api.put(`/technician/tickets/${id}/status?status=${status}`);
    toast.success('Statut mis a jour');
    loadTickets();
  };

  const getMessageStyle = (m) => {
    if (String(m.sender_id) === String(userId)) return { align: 'justify-end', bg: 'bg-teal-600 text-white', label: '' };
    if (m.is_from_bot) return { align: 'justify-start', bg: 'bg-blue-50 border border-blue-200', label: 'Assistant' };
    return { align: 'justify-start', bg: 'bg-white border shadow-sm', label: 'Client' };
  };

  const priorityLabels = { low: 'Faible', normal: 'Normal', high: 'Haute', urgent: 'Urgent' };
  const priorityColors = { low: 'bg-gray-100', normal: 'bg-blue-100', high: 'bg-orange-100', urgent: 'bg-red-100' };
  const statusLabels = { open: 'Ouvert', assigned: 'Assigne', in_progress: 'En cours', resolved: 'Resolu', closed: 'Ferme' };
  const statusColors = { open: 'bg-yellow-100 text-yellow-800', assigned: 'bg-blue-100 text-blue-800', in_progress: 'bg-purple-100 text-purple-800', resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-800' };

  if (loading) return <div><h1 className="text-2xl font-bold mb-4">Tickets</h1><p className="text-gray-400">Chargement...</p></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Tickets ({tickets.length})</h1>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow p-4 mb-4 flex gap-3 flex-wrap">
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg text-sm" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">Tous</option><option value="open">Ouvert</option><option value="assigned">Assigne</option><option value="in_progress">En cours</option><option value="resolved">Resolu</option><option value="closed">Ferme</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">Toutes</option><option value="low">Faible</option><option value="normal">Normal</option><option value="high">Haute</option><option value="urgent">Urgent</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Liste tickets */}
        <div className="space-y-2 max-h-[650px] overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="text-center text-gray-400 py-8">Aucun ticket</div>
          ) : (
            tickets.map(t => (
              <div key={t.id} onClick={() => { setSelectedTicket(t); setAutoScroll(true); }}
                className={`bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-md transition ${selectedTicket?.id === t.id ? 'ring-2 ring-teal-500' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold flex-1 truncate">{t.subject}</h3>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[t.status]}`}>{statusLabels[t.status]}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{t.description}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[t.priority]}`}>{priorityLabels[t.priority]}</span>
                    <span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex gap-2">
                    {t.status === 'open' ? (
                      <button onClick={e => { e.stopPropagation(); assignToMe(t.id); }}
                        className="bg-teal-600 text-white px-3 py-1 rounded-full text-xs hover:bg-teal-700">Prendre</button>
                    ) : (
                      <select value={t.status} onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); changeStatus(t.id, e.target.value); }}
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border-0 cursor-pointer ${statusColors[t.status]}`}>
                        <option value="assigned">Assigne</option>
                        <option value="in_progress">En cours</option>
                        <option value="resolved">Resolu</option>
                        <option value="closed">Ferme</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat */}
        <div>
          {selectedTicket ? (
            <div className="bg-white rounded-xl shadow flex flex-col h-[650px]">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="font-bold">{selectedTicket.subject}</h2>
                  {typing && <span className="text-xs text-gray-400 animate-pulse">Client ecrit...</span>}
                </div>
              </div>
              <div ref={messagesContainerRef} onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {!autoScroll && (
                  <div className="sticky top-0 text-center z-10">
                    <button onClick={() => { setAutoScroll(true); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                      className="bg-teal-600 text-white px-4 py-1 rounded-full text-xs shadow-lg hover:bg-teal-700 animate-bounce">
                      Nouveaux messages
                    </button>
                  </div>
                )}
                {messages.length === 0 && (
                  <p className="text-center text-gray-400 py-8">Aucun message. Le client attend votre reponse.</p>
                )}
                {messages.map((m, i) => {
                  const style = getMessageStyle(m);
                  return (
                    <div key={i} className={`flex ${style.align}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl ${style.bg}`}>
                        {style.label && <p className="text-xs font-semibold mb-1 text-gray-500">{style.label}</p>}
                        {m.attachment_url ? (
                          <a href={m.attachment_url} target="_blank"><img src={m.attachment_url} alt="" className="rounded-lg mb-2 max-w-full cursor-pointer hover:opacity-80" /></a>
                        ) : <p className="text-sm">{m.message}</p>}
                        <p className="text-xs mt-1 text-gray-400">{new Date(m.created_at).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t flex gap-2">
                <input placeholder="Reponse..." value={text} onChange={e => setText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && send()}
                  className="flex-1 px-4 py-2 border rounded-full text-sm" />
                <button onClick={send} className="bg-teal-600 text-white px-6 py-2 rounded-full hover:bg-teal-700 font-semibold">Envoyer</button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow h-[650px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-4xl mb-3">💬</p>
                <p>Selectionnez un ticket pour chatter</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
