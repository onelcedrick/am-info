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
  const [showMobileChat, setShowMobileChat] = useState(false);
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
      if (r.data.sla) setSelectedTicket(prev => ({ ...prev, sla: r.data.sla }));
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
    try { await api.delete(`/tickets/${selectedTicket.id}/messages/${msgId}`); toast.success('Message supprimé'); loadMessages(); }
    catch (err) { toast.error('Erreur suppression'); }
  };

  const startEdit = (msg) => { setEditingMsgId(msg.id); setEditText(msg.message); };
  const saveEdit = async (msgId) => {
    if (!editText.trim()) return;
    try { await api.put(`/tickets/${selectedTicket.id}/messages/${msgId}`, { message: editText }); toast.success('Modifié'); setEditingMsgId(null); loadMessages(); }
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

  const assignToMe = async (id) => { await api.put(`/technician/tickets/${id}/assign`); toast.success('Assigné'); loadTickets(); };
  const changeStatus = async (id, status) => { await api.put(`/technician/tickets/${id}/status?status=${status}`); toast.success('Statut modifié'); loadTickets(); };

  const getMessageStyle = (m) => {
    const msgId = String(m.sender_id || ''); const myId = String(userId || '');
    if (msgId === myId) return { align: 'justify-end', bg: 'bg-teal-600 text-white rounded-br-md', label: '' };
    if (m.is_from_bot || msgId === 'bot') return { align: 'justify-start', bg: 'bg-blue-50 border border-blue-200 text-gray-800 rounded-bl-md', label: 'Assistant' };
    return { align: 'justify-start', bg: 'bg-white shadow border text-gray-800 rounded-bl-md', label: 'Client' };
  };

  const scrollToBottom = () => { setAutoScroll(true); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  const getSlaColor = (color) => { switch (color) { case 'red': return 'bg-red-500'; case 'orange': return 'bg-orange-500'; case 'yellow': return 'bg-yellow-500'; default: return 'bg-green-500'; } };
  const getSlaBgColor = (color) => { switch (color) { case 'red': return 'bg-red-50 text-red-700 border-red-200'; case 'orange': return 'bg-orange-50 text-orange-700 border-orange-200'; case 'yellow': return 'bg-yellow-50 text-yellow-700 border-yellow-200'; default: return 'bg-green-50 text-green-700 border-green-200'; } };

  const priorityLabels = { low: 'Faible', normal: 'Normal', high: 'Haute', urgent: 'Urgent' };
  const priorityIcons = { low: '🟢', normal: '🔵', high: '🟠', urgent: '🔴' };
  const slaTargets = { low: '24h', normal: '4h', high: '1h', urgent: '15min' };
  const statusLabels = { open: 'Ouvert', assigned: 'Assigné', in_progress: 'En cours', resolved: 'Résolu', closed: 'Fermé' };
  const statusColors = { open: 'bg-yellow-100 text-yellow-800', assigned: 'bg-blue-100 text-blue-800', in_progress: 'bg-purple-100 text-purple-800', resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-800' };

  const selectTicket = (ticket) => { setSelectedTicket(ticket); setAutoScroll(true); setShowMobileChat(true); };
  const backToList = () => { setShowMobileChat(false); };

  if (loading) return <div><h1 className="text-xl font-bold mb-4">Tickets</h1><p className="text-gray-400">Chargement...</p></div>;

  return (
    <div className="h-full flex flex-col">
      {Modal}
      
      <div className="flex-shrink-0 space-y-3 mb-4">
        <h1 className="text-xl md:text-2xl font-bold">Tickets ({tickets.length})</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex gap-2 flex-wrap">
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-[140px] px-3 py-2 border rounded-lg text-sm" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm"><option value="all">Tous</option><option value="open">Ouvert</option><option value="assigned">Assigné</option><option value="in_progress">En cours</option><option value="resolved">Résolu</option><option value="closed">Fermé</option></select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-2 border rounded-lg text-sm"><option value="all">Toutes</option><option value="low">Faible</option><option value="normal">Normal</option><option value="high">Haute</option><option value="urgent">Urgent</option></select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:grid md:grid-cols-2 gap-4 h-full">
          <div className="space-y-2 overflow-y-auto h-full">
            {tickets.length === 0 ? <div className="text-center text-gray-400 py-8">Aucun ticket</div> : tickets.map(t => (
              <div key={t.id} onClick={() => selectTicket(t)} className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer hover:shadow-md transition ${selectedTicket?.id === t.id ? 'ring-2 ring-teal-500 border-teal-500' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-2 flex-1 min-w-0"><span className="text-xs">{priorityIcons[t.priority]}</span><h3 className="font-bold text-sm truncate">{t.subject}</h3></div><span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[t.status]}`}>{statusLabels[t.status]}</span></div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{t.description}</p>
                <div className="flex justify-between items-center"><span className="text-xs text-gray-400">{priorityLabels[t.priority]} · {slaTargets[t.priority]}</span>{t.status === 'open' ? <button onClick={e => { e.stopPropagation(); assignToMe(t.id); }} className="bg-teal-600 text-white px-3 py-1 rounded-full text-xs">Prendre</button> : <select value={t.status} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); changeStatus(t.id, e.target.value); }} className={`px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${statusColors[t.status]}`}><option value="assigned">Assigné</option><option value="in_progress">En cours</option><option value="resolved">Résolu</option><option value="closed">Fermé</option></select>}</div>
              </div>
            ))}
          </div>

          <div className="h-full">
            {selectedTicket ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                <div className="p-4 border-b flex-shrink-0"><div className="flex justify-between items-start mb-2"><h2 className="font-bold text-sm">{selectedTicket.subject}</h2>{typing && <span className="text-xs text-gray-400 animate-pulse">Client écrit...</span>}</div>
                  {selectedTicket.sla && <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${getSlaBgColor(selectedTicket.sla.sla_color)}`}><span>{priorityIcons[selectedTicket.priority]}</span><div className="flex-1"><div className="flex justify-between"><span className="font-semibold">{selectedTicket.sla.priority_label} · {selectedTicket.sla.sla_message}</span><span className="font-bold">{selectedTicket.sla.elapsed_minutes} min</span></div><div className="w-full h-1 bg-white/50 rounded-full mt-1"><div className={`h-full rounded-full ${getSlaColor(selectedTicket.sla.sla_color)}`} style={{ width: `${Math.min(100, selectedTicket.sla.remaining_percent)}%` }} /></div></div></div>}
                </div>
                <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                  {!autoScroll && <div className="sticky top-0 text-center z-10"><button onClick={scrollToBottom} className="bg-teal-600 text-white px-3 py-1 rounded-full text-xs shadow-lg">Nouveaux messages</button></div>}
                  {messages.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Aucun message.</p>}
                  {messages.map((m, i) => {
                    const isMine = String(m.sender_id) === String(userId);
                    const isBot = m.is_from_bot || String(m.sender_id) === 'bot';
                    const style = getMessageStyle(m);
                    const isEditing = editingMsgId === m.id;
                    return (
                      <div key={i} className={`flex ${style.align} group relative`}>
                        <div className={`max-w-[85%] p-2.5 rounded-2xl ${style.bg} relative`}>
                          {style.label && <p className={`text-[10px] font-semibold mb-1 ${isBot ? 'text-blue-600' : 'text-gray-500'}`}>{style.label}</p>}
                          {isEditing ? <div className="flex gap-1"><input value={editText} onChange={e => setEditText(e.target.value)} className="flex-1 px-2 py-1 border rounded text-xs" autoFocus onKeyPress={e => e.key === 'Enter' && saveEdit(m.id)} /><button onClick={() => saveEdit(m.id)} className="text-green-500 font-semibold text-xs">OK</button></div>
                          : <>{m.attachment_url ? <a href={m.attachment_url} target="_blank" rel="noopener noreferrer"><img src={m.attachment_url} alt="" className="rounded-lg mb-1 max-w-full" /></a> : <p className="text-sm">{m.message}</p>}<p className="text-[10px] mt-1 opacity-60">{new Date(m.created_at).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</p></>}
                          {!isBot && !isEditing && <div className="hidden group-hover:flex absolute -top-2 right-2 gap-1">{isMine && <button onClick={(e) => { e.stopPropagation(); startEdit(m); }} className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]" title="Modifier">✎</button>}<button onClick={(e) => { e.stopPropagation(); deleteMessage(m.id); }} className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]" title="Supprimer">✕</button></div>}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                {preview && <div className="px-3 py-2 border-t bg-gray-50 flex items-center gap-2 flex-shrink-0"><img src={preview} alt="" className="h-8 w-8 object-cover rounded" /><button onClick={uploadPhoto} disabled={uploading} className="ml-auto bg-teal-600 text-white px-2 py-1 rounded text-xs">{uploading ? '...' : 'Envoyer'}</button><button onClick={() => { setPreview(null); fileInputRef.current.value = ''; }} className="text-red-400 text-xs">Annuler</button></div>}
                <div className="p-3 border-t flex gap-2 flex-shrink-0 bg-white">
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="tech-file-upload" />
                  <label htmlFor="tech-file-upload" className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full cursor-pointer text-sm flex-shrink-0" title="Envoyer une photo">+</label>
                  <input placeholder="Réponse..." value={text} onChange={e => setText(e.target.value)} onKeyPress={e => e.key === 'Enter' && send()} className="flex-1 px-3 py-2 border rounded-full text-sm" />
                  <button onClick={send} className="bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700 font-semibold text-sm">Envoyer</button>
                </div>
              </div>
            ) : <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex items-center justify-center text-gray-400"><p className="text-sm">Sélectionnez un ticket</p></div>}
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden h-full">
          {!showMobileChat ? (
            <div className="space-y-2 overflow-y-auto h-full pb-4">
              {tickets.length === 0 ? <div className="text-center text-gray-400 py-8">Aucun ticket</div> : tickets.map(t => (
                <div key={t.id} onClick={() => selectTicket(t)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 cursor-pointer">
                  <div className="flex justify-between items-start mb-1"><div className="flex items-center gap-1 flex-1 min-w-0"><span className="text-xs">{priorityIcons[t.priority]}</span><h3 className="font-bold text-sm truncate">{t.subject}</h3></div><span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[t.status]}`}>{statusLabels[t.status]}</span></div>
                  <p className="text-xs text-gray-500 mb-1 line-clamp-1">{t.description}</p>
                  <div className="flex justify-between items-center"><span className="text-[10px] text-gray-400">{slaTargets[t.priority]}</span>{t.status === 'open' ? <button onClick={e => { e.stopPropagation(); assignToMe(t.id); }} className="bg-teal-600 text-white px-2 py-0.5 rounded-full text-[10px]">Prendre</button> : <span className="text-[10px] text-gray-500">{statusLabels[t.status]}</span>}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {selectedTicket && (
                <>
                  <div className="flex items-center gap-2 p-3 border-b bg-white flex-shrink-0"><button onClick={backToList} className="text-teal-600 text-sm font-semibold">← Retour</button><span className="text-sm font-medium truncate">{selectedTicket.subject}</span></div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                    {messages.map((m, i) => {
                      const isMine = String(m.sender_id) === String(userId);
                      const style = getMessageStyle(m);
                      return <div key={i} className={`flex ${style.align}`}><div className={`max-w-[85%] p-2.5 rounded-2xl ${style.bg}`}>{m.attachment_url ? <a href={m.attachment_url} target="_blank" rel="noopener noreferrer"><img src={m.attachment_url} alt="" className="rounded-lg mb-1 max-w-full" /></a> : <p className="text-sm">{m.message}</p>}<p className="text-[10px] mt-1 opacity-60">{new Date(m.created_at).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</p></div>;
                    })}
                  </div>
                  <div className="p-2 border-t flex gap-2 bg-white flex-shrink-0">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="tech-file-upload-mobile" />
                    <label htmlFor="tech-file-upload-mobile" className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full cursor-pointer text-sm flex-shrink-0" title="Photo">+</label>
                    <input placeholder="Réponse..." value={text} onChange={e => setText(e.target.value)} className="flex-1 px-3 py-2 border rounded-full text-sm" />
                    <button onClick={send} className="bg-teal-600 text-white px-4 py-2 rounded-full font-semibold text-sm">Envoyer</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
