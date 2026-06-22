// -*- coding: utf-8 -*-
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import VideoCall from '../../components/VideoCall';
import Rating from '../../components/Rating';
import { IconTrash } from '../../components/Icons';

const token = localStorage.getItem('token');
const userId = (() => {
  if (!token) return null;
  try { return JSON.parse(atob(token.split('.')[1])).sub; }
  catch { return null; }
})();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

function getMessageImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_URL + url;
}

// Heure Madagascar (UTC+3)
function formatMDG(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi'
  });
}
function formatMDGDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Africa/Nairobi'
  });
}

const pLabels = { low: 'Faible', normal: 'Normal', high: 'Haute', urgent: 'Urgent' };
const pColors = { low: 'bg-green-100 text-green-800', normal: 'bg-blue-100 text-blue-800', high: 'bg-orange-100 text-orange-800', urgent: 'bg-red-100 text-red-800' };
const sLabels = { open: 'Ouvert', assigned: 'Assigné', in_progress: 'En cours', resolved: 'Résolu', closed: 'Fermé' };
const sColors = { open: 'bg-yellow-100 text-yellow-800', assigned: 'bg-blue-100 text-blue-800', in_progress: 'bg-purple-100 text-purple-800', resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-800' };

export default function TicketPage() {
  const [tickets, setTickets] = useState([]);
  const [ticketId, setTicketId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [subject, setSubject] = useState('');
  const [desc, setDesc] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [typing, setTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [botThinking, setBotThinking] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const ticket = tickets.find(t => t.id === ticketId);

  const loadTickets = () => api.get('/tickets').then(r => setTickets(r.data));
  const loadMessages = () => ticketId && api.get(`/tickets/${ticketId}`).then(r => setMessages(r.data.messages || []));

  useEffect(() => { loadTickets(); }, []);
  useEffect(() => { loadMessages(); }, [ticketId]);
  useEffect(() => { if (autoScroll) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300); }, [messages, autoScroll]);
  useEffect(() => { if (!ticketId) return; const interval = setInterval(() => loadMessages(), 2000); return () => clearInterval(interval); }, [ticketId]);

  useEffect(() => {
    if (!token) return;
    let ws = null;
    try {
      ws = new WebSocket(`${WS_URL}?token=${token}`);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.action === 'call_start' || data.type === 'incoming_call') { setIncomingCall(data); setShowCall(true); }
          if (data.action === 'call_end' || data.action === 'call_reject') { setIncomingCall(null); setShowCall(false); }
          if (data.type === 'typing' && data.ticket_id === ticketId) setTyping(data.is_typing);
          if (data.type === 'new_message' && data.ticket_id === ticketId) loadMessages();
        } catch (e) {}
      };
    } catch (e) {}
    return () => { if (ws && ws.readyState === WebSocket.OPEN) ws.close(); };
  }, [token, ticketId]);

  const send = async () => {
    if (!text.trim() || !ticketId) return;
    await api.post(`/tickets/${ticketId}/messages`, { message: text });
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ action: 'message', ticket_id: ticketId }));
    setText(''); setAutoScroll(true); loadMessages();
  };

  const askChatbot = async () => {
    if (!text.trim()) return;
    const msgText = text;
    setText(''); setBotThinking(true); setAutoScroll(true);
    try {
      const res = await api.post('/recommendations/chatbot/ask', { message: msgText, ticket_id: ticketId });
      setMessages(prev => [...prev, { message: msgText, sender_id: userId, created_at: new Date().toISOString() }]);
      setTimeout(() => {
        setMessages(prev => [...prev, { message: res.data.response, sender_id: 'bot', is_from_bot: true, created_at: new Date().toISOString() }]);
        setBotThinking(false);
      }, 800);
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ action: 'message', ticket_id: ticketId }));
    } catch (err) { setBotThinking(false); }
  };

  const clearHistory = async () => {
    if (!ticketId) return;
    if (!confirm("Effacer tout l'historique ?")) return;
    try { await api.delete(`/tickets/${ticketId}/messages`); toast.success('Historique effacé'); setMessages([]); loadMessages(); }
    catch (err) { toast.error('Erreur'); }
  };

  const deleteTicket = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Supprimer ce ticket ? Cette action est irréversible.')) return;
    try {
      await api.delete(`/tickets/${id}`);
      toast.success('Ticket supprimé');
      if (ticketId === id) { setTicketId(null); setShowMobileChat(false); }
      loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur suppression');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file || !ticketId) return;
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
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ action: 'message', ticket_id: ticketId }));
      setPreview(null); fileInputRef.current.value = ''; setAutoScroll(true); loadMessages();
      toast.success('Photo envoyée');
    } catch (err) { toast.error('Erreur envoi photo'); }
    finally { setUploading(false); }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    await api.post('/tickets', { subject, description: desc, priority: 'normal' });
    setSubject(''); setDesc(''); setShowForm(false); loadTickets();
  };

  const getMessageStyle = (m) => {
    const msgSender = String(m.sender_id || '');
    const currentUser = String(userId || '');
    if (msgSender === currentUser) return { align: 'justify-end', bg: 'bg-blue-600 text-white rounded-br-md', label: '' };
    if (m.is_from_bot || msgSender === 'bot') return { align: 'justify-start', bg: 'bg-blue-50 border border-blue-200 text-gray-800 rounded-bl-md', label: 'Assistant' };
    return { align: 'justify-start', bg: 'bg-white shadow border text-gray-800 rounded-bl-md', label: 'Technicien' };
  };

  const scrollToBottom = () => { setAutoScroll(true); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  };

  return (
    <div className="h-full flex flex-col">
      {incomingCall && (
        <div className="fixed top-4 right-4 bg-green-500 text-white rounded-2xl shadow-2xl p-4 z-50 animate-bounce">
          <p className="font-bold text-sm">Appel entrant</p>
          <p className="text-green-100 text-xs">Le technicien vous appelle</p>
        </div>
      )}

      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold">Maintenance</h1>
        <div className="flex gap-2">
          <button onClick={() => { if (!ticket?.technician_id) { toast.error('Aucun technicien assigné'); return; } setShowCall(true); }} 
            className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs md:text-sm hover:bg-green-700 transition">Appel</button>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs md:text-sm hover:bg-blue-700 transition">+ Ticket</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={createTicket} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex-shrink-0">
          <input placeholder="Sujet du problème" value={subject} onChange={e => setSubject(e.target.value)} required className="w-full px-4 py-2 border rounded-lg mb-2 text-sm" />
          <textarea placeholder="Décrivez votre problème..." value={desc} onChange={e => setDesc(e.target.value)} required rows={3} className="w-full px-4 py-2 border rounded-lg mb-2 text-sm" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Créer le ticket</button>
        </form>
      )}

      <div className="flex-1 overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:grid md:grid-cols-3 gap-4 h-full">
          <div className="space-y-2 overflow-y-auto h-full">
            {tickets.map(t => (
              <div key={t.id} onClick={() => { setTicketId(t.id); setAutoScroll(true); }}
                className={`bg-white rounded-xl shadow-sm border p-3 cursor-pointer hover:shadow-md transition relative group ${ticketId === t.id ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-sm truncate flex-1 pr-2">{t.subject}</h3>
                  <button onClick={(e) => deleteTicket(t.id, e)} className="text-gray-400 hover:text-red-500 transition p-1" title="Supprimer">
                    <IconTrash size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sColors[t.status] || 'bg-gray-100 text-gray-800'}`}>{sLabels[t.status] || t.status}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pColors[t.priority] || 'bg-gray-100 text-gray-800'}`}>{pLabels[t.priority] || t.priority}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{formatMDGDate(t.created_at)}</p>
              </div>
            ))}
            {tickets.length === 0 && <div className="text-center text-gray-400 py-8 text-sm">Aucun ticket. Créez-en un !</div>}
          </div>
          <div className="col-span-2 h-full">
            {ticket ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                <div className="p-3 border-b flex justify-between items-center flex-shrink-0 bg-white rounded-t-xl">
                  <div>
                    <h2 className="font-bold text-sm md:text-base">{ticket.subject}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sColors[ticket.status] || 'bg-gray-100 text-gray-800'}`}>{sLabels[ticket.status] || ticket.status}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pColors[ticket.priority] || 'bg-gray-100 text-gray-800'}`}>{pLabels[ticket.priority] || ticket.priority}</span>
                    </div>
                  </div>
                  <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-600">Effacer historique</button>
                </div>
                <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                  {messages.length === 0 && !botThinking && (
                    <div className="flex justify-start">
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl rounded-bl-md max-w-[80%]">
                        <p className="text-xs font-semibold text-blue-600 mb-1">Assistant AM Info</p>
                        <p className="text-sm text-gray-700">Bonjour ! Décrivez votre problème, je vais vous aider.</p>
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => {
                    const style = getMessageStyle(m);
                    const imgUrl = getMessageImageUrl(m.attachment_url);
                    return (
                      <div key={i} className={`flex ${style.align}`}>
                        <div className={`max-w-[75%] p-3 rounded-2xl ${style.bg}`}>
                          {style.label && <p className={`text-xs font-semibold mb-1 ${m.is_from_bot ? 'text-blue-600' : 'text-gray-500'}`}>{style.label}</p>}
                          {imgUrl ? <a href={imgUrl} target="_blank" rel="noopener noreferrer"><img src={imgUrl} alt="" className="rounded-lg mb-1 max-w-full" /></a> : <p className="text-sm whitespace-pre-wrap">{m.message}</p>}
                          <p className="text-xs mt-1 opacity-60">{formatMDG(m.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                  {botThinking && (
                    <div className="flex justify-start"><div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl"><p className="text-xs text-blue-600">Assistant réfléchit...</p></div></div>
                  )}
                  {typing && <div className="flex justify-start"><div className="bg-white shadow border px-3 py-1 rounded-full"><span className="text-xs text-gray-400">Technicien écrit...</span></div></div>}
                  {preview && (
                    <div className="flex justify-end"><div className="bg-white shadow border rounded-2xl p-3 max-w-[75%]">
                      <img src={preview} alt="" className="rounded-lg mb-2 max-w-full max-h-40" />
                      <div className="flex gap-1 flex-wrap">
                        <button onClick={uploadPhoto} disabled={uploading} className="bg-green-600 text-white px-2 py-1 rounded text-xs">{uploading ? '...' : '📤 Envoyer'}</button>
                        <button onClick={() => { setPreview(null); fileInputRef.current.value = ''; }} className="bg-gray-300 px-2 py-1 rounded text-xs">Annuler</button>
                      </div>
                    </div></div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                {(ticket.status === 'resolved' || ticket.status === 'closed') && <div className="px-4 py-2 border-t bg-gray-50"><Rating ticketId={ticket.id} ticketStatus={ticket.status} /></div>}
                <div className="p-3 border-t flex gap-2 flex-shrink-0 bg-white">
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full cursor-pointer text-sm flex-shrink-0" title="Photo">+</label>
                  <input placeholder="Message..." value={text} onChange={e => setText(e.target.value)} onKeyPress={e => e.key === 'Enter' && askChatbot()} className="flex-1 px-3 py-2 border rounded-full text-sm" />
                  <button onClick={askChatbot} className="bg-blue-600 text-white px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap">Assistant</button>
                  <button onClick={send} className="bg-gray-700 text-white px-3 py-2 rounded-full text-xs font-semibold">Envoyer</button>
                </div>
              </div>
            ) : <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex items-center justify-center text-gray-400"><p>Sélectionnez un ticket</p></div>}
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden h-full">
          {!showMobileChat ? (
            <div className="space-y-2 overflow-y-auto h-full">
              {tickets.map(t => (
                <div key={t.id} onClick={() => { setTicketId(t.id); setShowMobileChat(true); setAutoScroll(true); }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 cursor-pointer relative">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-sm truncate flex-1 pr-2">{t.subject}</h3>
                    <button onClick={(e) => deleteTicket(t.id, e)} className="text-gray-400 hover:text-red-500 p-1" title="Supprimer">
                      <IconTrash size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sColors[t.status] || 'bg-gray-100 text-gray-800'}`}>{sLabels[t.status] || t.status}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pColors[t.priority] || 'bg-gray-100 text-gray-800'}`}>{pLabels[t.priority] || t.priority}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{formatMDGDate(t.created_at)}</p>
                </div>
              ))}
              {tickets.length === 0 && <div className="text-center text-gray-400 py-8 text-sm">Aucun ticket. Créez-en un !</div>}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {ticket && (
                <>
                  <div className="flex items-center gap-2 p-3 border-b bg-white flex-shrink-0">
                    <button onClick={() => setShowMobileChat(false)} className="text-blue-600 text-sm font-semibold">← Retour</button>
                    <span className="text-sm font-medium truncate">{ticket.subject}</span>
                    <button onClick={clearHistory} className="ml-auto text-xs text-red-400">Effacer</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                    {messages.length === 0 && !botThinking && (
                      <div className="flex justify-start"><div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl rounded-bl-md max-w-[85%]"><p className="text-xs font-semibold text-blue-600">Assistant AM Info</p><p className="text-sm">Bonjour ! Décrivez votre problème.</p></div></div>
                    )}
                    {messages.map((m, i) => {
                      const style = getMessageStyle(m);
                      const imgUrl = getMessageImageUrl(m.attachment_url);
                      return (
                        <div key={i} className={`flex ${style.align}`}>
                          <div className={`max-w-[85%] p-2.5 rounded-2xl ${style.bg}`}>
                            {style.label && <p className={`text-[10px] font-semibold mb-1 ${m.is_from_bot ? 'text-blue-600' : 'text-gray-500'}`}>{style.label}</p>}
                            {imgUrl ? <a href={imgUrl} target="_blank" rel="noopener noreferrer"><img src={imgUrl} alt="" className="rounded-lg mb-1 max-w-full" /></a> : <p className="text-sm whitespace-pre-wrap">{m.message}</p>}
                            <p className="text-[10px] mt-1 opacity-60">{formatMDG(m.created_at)}</p>
                          </div>
                        </div>
                      );
                    })}
                    {botThinking && <div className="flex justify-start"><div className="bg-blue-50 border border-blue-200 p-2 rounded-2xl"><p className="text-[10px] text-blue-600">Assistant réfléchit...</p></div></div>}
                    {typing && <div className="flex justify-start"><div className="bg-white shadow border px-2 py-1 rounded-full"><span className="text-[10px] text-gray-400">Technicien écrit...</span></div></div>}
                    {preview && (
                      <div className="flex justify-end"><div className="bg-white shadow border rounded-2xl p-2 max-w-[85%]">
                        <img src={preview} alt="" className="rounded-lg mb-1 max-w-full max-h-32" />
                        <div className="flex gap-1 flex-wrap">
                          <button onClick={uploadPhoto} disabled={uploading} className="bg-green-600 text-white px-2 py-0.5 rounded text-[10px]">{uploading ? '...' : 'Envoyer'}</button>
                          <button onClick={() => { setPreview(null); fileInputRef.current.value = ''; }} className="bg-gray-300 px-2 py-0.5 rounded text-[10px]">✕</button>
                        </div>
                      </div></div>
                    )}
                  </div>
                  <div className="p-2 border-t flex gap-1 bg-white flex-shrink-0">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="file-upload-mobile" />
                    <label htmlFor="file-upload-mobile" className="bg-gray-100 hover:bg-gray-200 px-2 py-2 rounded-full cursor-pointer text-xs flex-shrink-0">+</label>
                    <input placeholder="Message..." value={text} onChange={e => setText(e.target.value)} className="flex-1 px-3 py-2 border rounded-full text-xs" />
                    <button onClick={askChatbot} className="bg-blue-600 text-white px-2 py-2 rounded-full text-[10px] font-semibold whitespace-nowrap">IA</button>
                    <button onClick={send} className="bg-gray-700 text-white px-2 py-2 rounded-full text-[10px] font-semibold">Envoyer</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {showCall && <VideoCall ticketId={ticketId} onClose={() => setShowCall(false)} />}
    </div>
  );
}