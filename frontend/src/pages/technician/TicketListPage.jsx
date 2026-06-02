// -*- coding: utf-8 -*-
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import useConfirm from '../../hooks/useConfirm';

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
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState('');
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const { confirm, Modal } = useConfirm();

  const loadTickets = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filterStatus !== 'all') params.append('status', filterStatus);
    if (filterPriority !== 'all') params.append('priority', filterPriority);
    api.get(`/technician/tickets${params.toString() ? '?' + params.toString() : ''}`)
      .then(r => setTickets(r.data || [])).finally(() => setLoading(false));
  };

  const loadMessages = () => {
    if (!selectedTicket) return;
    api.get(`/tickets/${selectedTicket.id}`).then(r => {
      setMessages(r.data.messages || []);
      if (r.data.sla) {
        setSelectedTicket(prev => ({ ...prev, sla: r.data.sla }));
      }
    });
  };

  useEffect(() => { loadTickets(); }, []);
  useEffect(() => { const d = setTimeout(() => loadTickets(), 300); return () => clearTimeout(d); }, [search, filterStatus, filterPriority]);
  useEffect(() => { loadMessages(); }, [selectedTicket?.id]);
  useEffect(() => { if (autoScroll) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300); }, [messages, autoScroll]);
  useEffect(() => { if (!selectedTicket) return; const i = setInterval(() => loadMessages(), 2000); return () => clearInterval(i); }, [selectedTicket?.id]);

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try { const data = JSON.parse(event.data); if (data.type === 'typing') setTyping(data.is_typing); if (data.type === 'new_message') loadMessages(); } catch (e) {}
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
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ action: 'message', ticket_id: selectedTicket.id }));
    setText(''); setAutoScroll(true); loadMessages();
  };

  const deleteMessage = async (msgId) => {
    const ok = await confirm('Supprimer le message', 'Cette action est irreversible.');
    if (!ok) return;
    try { await api.delete(`/tickets/${selectedTicket.id}/messages/${msgId}`); toast.success('Message supprime'); loadMessages(); }
    catch (err) { toast.error('Erreur suppression'); }
  };

  const startEdit = (msg) => { setEditingMsgId(msg.id); setEditText(msg.message); };
  const saveEdit = async (msgId) => {
    if (!editText.trim()) return;
    try { await api.put(`/tickets/${selectedTicket.id}/messages/${msgId}`, { message: editText }); toast.success('Modifie'); setEditingMsgId(null); loadMessages(); }
    catch (err) { toast.error('Erreur modification'); }
  };

  const handleFileSelect = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => setPreview(ev.target.result); reader.readAsDataURL(file); };
  const uploadPhoto = async () => {
    const file = fileInputRef.current?.files[0]; if (!file || !selectedTicket) return;
    setUploading(true); const formData = new FormData(); formData.append('file', file);
    try {
      await api.post(`/tickets/${selectedTicket.id}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ action: 'message', ticket_id: selectedTicket.id }));
      setPreview(null); fileInputRef.current.value = ''; setAutoScroll(true); loadMessages();
    } catch (err) { toast.error('Erreur'); } finally { setUploading(false); }
  };

  const assignToMe = async (id) => { await api.put(`/technician/tickets/${id}/assign`); toast.success('Assigne'); loadTickets(); };
  const changeStatus = async (id, status) => { await api.put(`/technician/tickets/${id}/status?status=${status}`); toast.success('Statut modifie'); loadTickets(); };

  const getMessageStyle = (m) => {
    const msgId = String(m.sender_id || ''); const myId = String(userId || '');
    if (msgId === myId) return { align: 'justify-end', bg: 'bg-teal-600 text-white rounded-br-md', label: '' };
    if (m.is_from_bot || msgId === 'bot') return { align: 'justify-start', bg: 'bg-blue-50 border border-blue-200 text-gray-800 rounded-bl-md', label: 'Assistant' };
    return { align: 'justify-start', bg: 'bg-white shadow border text-gray-800 rounded-bl-md', label: 'Client' };
  };

  const scrollToBottom = () => { setAutoScroll(true); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  const getSlaColor = (color) => {
    switch (color) { case 'red': return 'bg-red-500'; case 'orange': return 'bg-orange-500'; case 'yellow': return 'bg-yellow-500'; default: return 'bg-green-500'; }
  };

  const getSlaBgColor = (color) => {
    switch (color) {
      case 'red': return 'bg-red-50 text-red-700 border-red-200';
      case 'orange': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'yellow': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const priorityLabels = { low: 'Faible', normal: 'Normal', high: 'Haute', urgent: 'Urgent' };
  const priorityIcons = { low: '🟢', normal: '🔵', high: '🟠', urgent: '🔴' };
  const slaTargets = { low: '24h', normal: '4h', high: '1h', urgent: '15min' };
  const statusLabels = { open: 'Ouvert', assigned: 'Assigne', in_progress: 'En cours', resolved: 'Resolu', closed: 'Ferme' };
  const statusColors = { open: 'bg-yellow-100 text-yellow-800', assigned: 'bg-blue-100 text-blue-800', in_progress: 'bg-purple-100 text-purple-800', resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-800' };

  if (loading) return <div><h1 className="text-2xl font-bold mb-4">Tickets</h1><p className="text-gray-400">Chargement...</p></div>;

  return (
    <div>
      {Modal}
      <h1 className="text-2xl font-bold mb-4">Tickets ({tickets.length})</h1>
      <div className="bg-white rounded-xl shadow p-4 mb-4 flex gap-3 flex-wrap">
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg text-sm" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm"><option value="all">Tous</option><option value="open">Ouvert</option><option value="assigned">Assigne</option><option value="in_progress">En cours</option><option value="resolved">Resolu</option><option value="closed">Ferme</option></select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-2 border rounded-lg text-sm"><option value="all">Toutes</option><option value="low">Faible</option><option value="normal">Normal</option><option value="high">Haute</option><option value="urgent">Urgent</option></select>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2 max-h-[650px] overflow-y-auto">
          {tickets.length === 0 ? <div className="text-center text-gray-400 py-8">Aucun ticket</div> :
            tickets.map(t => (
              <div key={t.id} onClick={() => { setSelectedTicket(t); setAutoScroll(true); }} className={`bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-md transition ${selectedTicket?.id === t.id ? 'ring-2 ring-teal-500' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs">{priorityIcons[t.priority] || '🔵'}</span>
                    <h3 className="font-bold truncate">{t.subject}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{slaTargets[t.priority] || '4h'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[t.status]}`}>{statusLabels[t.status]}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{t.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {priorityLabels[t.priority]} · {new Date(t.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  {t.status === 'open' ? (
                    <button onClick={e => { e.stopPropagation(); assignToMe(t.id); }} className="bg-teal-600 text-white px-3 py-1 rounded-full text-xs">Prendre</button>
                  ) : (
                    <select value={t.status} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); changeStatus(t.id, e.target.value); }} className={`px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${statusColors[t.status]}`}><option value="assigned">Assigne</option><option value="in_progress">En cours</option><option value="resolved">Resolu</option><option value="closed">Ferme</option></select>
                  )}
                </div>
              </div>
            ))}
        </div>

        <div>
          {selectedTicket ? (
            <div className="bg-white rounded-xl shadow flex flex-col h-[650px]">
              <div className="p-4 border-b">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-bold">{selectedTicket.subject}</h2>
                  {typing && <span className="text-xs text-gray-400 animate-pulse">Client ecrit...</span>}
                </div>
                
                {selectedTicket.sla && (
                  <div className={`flex items-center gap-3 p-2.5 rounded-lg border ${getSlaBgColor(selectedTicket.sla.sla_color)}`}>
                    <span className="text-lg">{priorityIcons[selectedTicket.priority] || '🔵'}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold">
                          {selectedTicket.sla.priority_label} · {selectedTicket.sla.sla_message}
                        </span>
                        <span className="text-xs font-bold">{selectedTicket.sla.elapsed_minutes} min</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${getSlaColor(selectedTicket.sla.sla_color)}`}
                          style={{ width: `${Math.min(100, selectedTicket.sla.remaining_percent)}%` }} />
                      </div>
                      <div className="flex justify-between text-xs mt-0.5 opacity-70">
                        <span>0 min</span>
                        <span>{selectedTicket.sla.response_time_minutes} min (cible)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {!autoScroll && <div className="sticky top-0 text-center z-10"><button onClick={scrollToBottom} className="bg-teal-600 text-white px-4 py-1 rounded-full text-xs shadow-lg hover:bg-teal-700 animate-bounce">Nouveaux messages</button></div>}
                {messages.length === 0 && <p className="text-center text-gray-400 py-8">Aucun message. Soyez le premier a repondre.</p>}
                {messages.map((m, i) => {
                  const isMine = String(m.sender_id) === String(userId);
                  const isBot = m.is_from_bot || String(m.sender_id) === 'bot';
                  const style = getMessageStyle(m);
                  const isEditing = editingMsgId === m.id;
                  return (
                    <div key={i} className={`flex ${style.align} group relative`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl ${style.bg} relative`}>
                        {style.label && <p className={`text-xs font-semibold mb-1 ${isBot ? 'text-blue-600' : 'text-gray-500'}`}>{style.label}</p>}
                        {isEditing ? (
                          <div className="flex gap-2"><input value={editText} onChange={e => setEditText(e.target.value)} className="flex-1 px-3 py-1 border rounded text-sm text-gray-800" autoFocus onKeyPress={e => e.key === 'Enter' && saveEdit(m.id)} /><button onClick={() => saveEdit(m.id)} className="text-green-500 font-semibold text-sm">OK</button><button onClick={() => setEditingMsgId(null)} className="text-gray-400 text-sm">✕</button></div>
                        ) : (
                          <>{m.attachment_url ? <a href={m.attachment_url} target="_blank" rel="noopener noreferrer"><img src={m.attachment_url} alt="" className="rounded-lg mb-2 max-w-full cursor-pointer hover:opacity-80" /></a> : <p className="text-sm whitespace-pre-wrap">{m.message}</p>}<p className="text-xs mt-1 opacity-60">{new Date(m.created_at).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</p></>
                        )}
                        {!isBot && !isEditing && (
                          <div className="hidden group-hover:flex absolute -top-2 right-2 gap-1">
                            {isMine && <button onClick={(e) => { e.stopPropagation(); startEdit(m); }} className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg hover:bg-blue-600 transition" title="Modifier">✎</button>}
                            <button onClick={(e) => { e.stopPropagation(); deleteMessage(m.id); }} className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg hover:bg-red-600 transition" title="Supprimer">✕</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              {preview && (<div className="px-4 py-2 border-t bg-gray-50 flex items-center gap-3"><img src={preview} alt="" className="h-12 w-12 object-cover rounded" /><button onClick={uploadPhoto} disabled={uploading} className="ml-auto bg-teal-600 text-white px-3 py-1 rounded-lg text-xs">{uploading ? 'Envoi...' : 'Envoyer'}</button><button onClick={() => { setPreview(null); fileInputRef.current.value = ''; }} className="text-red-400 text-xs">Annuler</button></div>)}
              <div className="p-4 border-t flex gap-2">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="tech-file-upload" />
                <label htmlFor="tech-file-upload" className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full cursor-pointer text-sm">+</label>
                <input placeholder="Reponse..." value={text} onChange={e => setText(e.target.value)} onKeyPress={e => e.key === 'Enter' && send()} className="flex-1 px-4 py-2 border rounded-full text-sm" />
                <button onClick={send} className="bg-teal-600 text-white px-6 py-2 rounded-full hover:bg-teal-700 font-semibold text-sm">Envoyer</button>
              </div>
            </div>
          ) : (<div className="bg-white rounded-xl shadow h-[650px] flex items-center justify-center text-gray-400"><div className="text-center"><p className="text-4xl mb-3">+</p><p>Selectionnez un ticket</p></div></div>)}
        </div>
      </div>
    </div>
  );
}
