// -*- coding: utf-8 -*-
import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import VideoCall from '../../components/VideoCall';

const token = localStorage.getItem('token');
const userId = (() => {
  if (!token) return null;
  try { return JSON.parse(atob(token.split('.')[1])).sub; }
  catch { return null; }
})();

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export default function TicketListPage() {
  const [tickets, setTickets] = useState([]);
  const [ticketId, setTicketId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const ticket = tickets.find(t => t.id === ticketId);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadTickets = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filterStatus !== 'all') params.append('status', filterStatus);
    if (filterPriority !== 'all') params.append('priority', filterPriority);
    api.get(`/technician/tickets${params.toString() ? '?' + params.toString() : ''}`).then(r => setTickets(r.data));
  };
  const loadMessages = () => ticketId && api.get(`/tickets/${ticketId}`).then(r => setMessages(r.data.messages || []));

  useEffect(() => { loadTickets(); }, []);
  useEffect(() => { loadMessages(); }, [ticketId]);
  useEffect(() => { const d = setTimeout(() => loadTickets(), 300); return () => clearTimeout(d); }, [search, filterStatus, filterPriority]);
  useEffect(() => { if (autoScroll) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300); }, [messages, autoScroll]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  };

  useEffect(() => { if (!ticketId) return; const i = setInterval(() => loadMessages(), 2000); return () => clearInterval(i); }, [ticketId]);

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Appel entrant
      if (data.action === 'call_start' || data.type === 'incoming_call') {
        setIncomingCall(data);
        setShowCall(true);
      }
      if (data.action === 'call_end' || data.action === 'call_reject') {
        setIncomingCall(null);
        setShowCall(false);
      }
      
      if (data.type === 'typing' && data.ticket_id === ticketId) setTyping(data.is_typing);
      if (data.type === 'new_message' && data.ticket_id === ticketId) loadMessages();
    };
    return () => ws.close();
  }, [token, ticketId]);

  const send = async () => {
    if (!text.trim() || !ticketId) return;
    await api.post(`/tickets/${ticketId}/messages`, { message: text });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'message', ticket_id: ticketId }));
    }
    setText(''); setAutoScroll(true); loadMessages();
  };

  const handleTyping = (e) => setText(e.target.value);
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };
  const uploadPhoto = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file || !ticketId) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/tickets/${ticketId}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'message', ticket_id: ticketId }));
      }
      setPreview(null); fileInputRef.current.value = ''; setAutoScroll(true); loadMessages();
    } catch (err) { alert('Erreur'); }
    finally { setUploading(false); }
  };
  const assignToMe = async (id) => { await api.put(`/technician/tickets/${id}/assign`); loadTickets(); };
  const changeStatus = async (id, status) => { await api.put(`/technician/tickets/${id}/status?status=${status}`); loadTickets(); };

  const getMessageStyle = (m) => {
    const msgId = String(m.sender_id || '');
    const myId = String(userId || '');
    if (msgId === myId) return { align: 'justify-end', bg: 'bg-teal-600 text-white rounded-br-md', label: '' };
    if (m.is_from_bot || msgId === 'bot') return { align: 'justify-start', bg: 'bg-blue-50 border border-blue-200 text-gray-800 rounded-bl-md', label: 'Assistant' };
    return { align: 'justify-start', bg: 'bg-white shadow border text-gray-800 rounded-bl-md', label: 'Client' };
  };

  const scrollToBottom = () => { setAutoScroll(true); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  const priorityLabels = { low: 'Faible', normal: 'Normal', high: 'Haute', urgent: 'Urgent' };
  const statusLabels = { open: 'Ouvert', assigned: 'Assigne', in_progress: 'En cours', resolved: 'Resolu', closed: 'Ferme' };
  const statusColors = { open: 'bg-yellow-100 text-yellow-800', assigned: 'bg-blue-100 text-blue-800', in_progress: 'bg-purple-100 text-purple-800', resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-800' };

  return (
    <div>
      {/* Notification appel entrant */}
      {incomingCall && (
        <div className="fixed top-4 right-4 bg-green-500 text-white rounded-2xl shadow-2xl p-6 z-50 animate-bounce">
          <div className="flex items-center gap-4">
            <span className="text-4xl">+</span>
            <div>
              <p className="font-bold text-lg">Appel entrant</p>
              <p className="text-green-100 text-sm">Le client vous appelle</p>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">Tickets</h1>
      <div className="bg-white rounded-xl shadow p-4 mb-4 flex gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">Tous</option><option value="open">Ouvert</option><option value="assigned">Assigne</option><option value="in_progress">En cours</option><option value="resolved">Resolu</option><option value="closed">Ferme</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">Toutes</option><option value="low">Faible</option><option value="normal">Normal</option><option value="high">Haute</option><option value="urgent">Urgent</option>
        </select>
        <span className="text-sm text-gray-400 flex items-center">{tickets.length} resultat(s)</span>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2 max-h-[550px] overflow-y-auto">
          {tickets.map(t => (
            <div key={t.id} onClick={() => { setTicketId(t.id); setAutoScroll(true); }}
              className={`bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-md transition ${ticketId === t.id ? 'ring-2 ring-teal-500' : ''}`}>
              <div className="flex justify-between items-start">
                <h3 className="font-bold truncate flex-1">{t.subject}</h3>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[t.status]}`}>{statusLabels[t.status]}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">{t.description}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">{priorityLabels[t.priority]}</span>
                {t.status === 'open' && (
                  <button onClick={e => { e.stopPropagation(); assignToMe(t.id); }} className="bg-teal-600 text-white px-3 py-1 rounded-full text-xs hover:bg-teal-700">Prendre</button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-2">
          {ticket ? (
            <div className="bg-white rounded-xl shadow flex flex-col h-[550px]">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg flex items-center gap-2">{ticket.subject}{typing && <span className="text-xs text-gray-400 animate-pulse">Client ecrit...</span>}</h2>
                  <p className="text-xs text-gray-500 mt-1">{ticket.description}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <button onClick={() => setShowCall(true)} className="bg-green-600 text-white px-3 py-1 rounded-full text-xs hover:bg-green-700">Appel</button>
                  <select value={ticket.status} onChange={e => changeStatus(ticket.id, e.target.value)} className="border rounded-lg px-3 py-1 text-sm">
                    <option value="open">Ouvert</option><option value="assigned">Assigne</option><option value="in_progress">En cours</option><option value="resolved">Resolu</option><option value="closed">Ferme</option>
                  </select>
                </div>
              </div>
              <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {!autoScroll && <div className="sticky top-0 text-center z-10"><button onClick={scrollToBottom} className="bg-teal-600 text-white px-4 py-1 rounded-full text-xs shadow-lg hover:bg-teal-700 animate-bounce">Nouveaux messages</button></div>}
                {messages.map((m, i) => {
                  const style = getMessageStyle(m);
                  return (
                    <div key={i} className={`flex ${style.align}`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl ${style.bg}`}>
                        {style.label && <p className={`text-xs font-semibold mb-1 ${m.is_from_bot ? 'text-blue-600' : 'text-gray-500'}`}>{style.label}</p>}
                        {m.attachment_url ? (<a href={m.attachment_url} target="_blank" rel="noopener noreferrer"><img src={m.attachment_url} alt="Piece" className="rounded-lg mb-2 max-w-full cursor-pointer hover:opacity-80" /></a>) : (<p className="text-sm whitespace-pre-wrap">{m.message}</p>)}
                        <p className={`text-xs mt-1 ${String(m.sender_id) === String(userId) ? 'text-teal-200' : 'text-gray-400'}`}>{new Date(m.created_at).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit', timeZone: 'Indian/Antananarivo'})}</p>
                      </div>
                    </div>
                  );
                })}
                {typing && <div className="flex justify-start"><div className="bg-white shadow border px-4 py-2 rounded-full"><span className="text-gray-400 text-sm">Client ecrit...</span></div></div>}
                {preview && (
                  <div className="flex justify-end"><div className="bg-white shadow border rounded-2xl p-3 max-w-[75%]"><img src={preview} alt="Apercu" className="rounded-lg mb-2 max-w-full max-h-48" /><div className="flex gap-2"><button onClick={uploadPhoto} disabled={uploading} className="bg-green-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">{uploading ? 'Envoi...' : 'Envoyer'}</button><button onClick={() => { setPreview(null); fileInputRef.current.value = ''; }} className="bg-gray-300 px-4 py-1 rounded-lg text-sm">Annuler</button></div></div></div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="tech-file-upload" />
                  <label htmlFor="tech-file-upload" className="bg-gray-100 hover:bg-gray-200 px-3 py-3 rounded-full cursor-pointer transition text-sm" title="Photo">+</label>
                  <input placeholder="Reponse..." value={text} onChange={handleTyping} onKeyPress={e => e.key === 'Enter' && send()} className="flex-1 px-4 py-2 border rounded-full text-sm" />
                  <button onClick={send} className="bg-teal-600 text-white px-6 py-2 rounded-full hover:bg-teal-700 transition text-sm font-semibold">Envoyer</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow h-[550px] flex items-center justify-center text-gray-400 text-lg"><div className="text-center"><p className="text-6xl mb-4">+</p><p>Selectionnez un ticket</p></div></div>
          )}
        </div>
      </div>
      {showCall && ticket && (
        <VideoCall ws={wsRef.current} ticketId={ticketId} recipientId={ticket.client_id} userId={userId} userName={user?.full_name} onClose={() => { setShowCall(false); setIncomingCall(null); }} />
      )}
    </div>
  );
}
