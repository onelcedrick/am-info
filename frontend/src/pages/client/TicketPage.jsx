// -*- coding: utf-8 -*-
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import VideoCall from '../../components/VideoCall';
import Rating from '../../components/Rating';

const token = localStorage.getItem('token');
const userId = (() => {
  if (!token) return null;
  try { return JSON.parse(atob(token.split('.')[1])).sub; }
  catch { return null; }
})();

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

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
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const ticket = tickets.find(t => t.id === ticketId);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadTickets = () => api.get('/tickets').then(r => setTickets(r.data));
  const loadMessages = () => ticketId && api.get(`/tickets/${ticketId}`).then(r => setMessages(r.data.messages || []));

  useEffect(() => { loadTickets(); }, []);
  useEffect(() => { loadMessages(); }, [ticketId]);

  useEffect(() => {
    if (autoScroll) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  };

  useEffect(() => {
    if (!ticketId) return;
    const interval = setInterval(() => loadMessages(), 2000);
    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    if (!token) return;
    
    let ws = null;
    
    try {
      ws = new WebSocket(`${WS_URL}?token=${token}`);
      wsRef.current = ws;
      
      ws.onopen = () => console.log('WebSocket client connecte');
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
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
        } catch (e) {}
      };
      
      ws.onerror = (err) => console.error('WebSocket erreur:', err);
      ws.onclose = () => console.log('WebSocket ferme');
      
    } catch (e) {
      console.error('Erreur creation WebSocket:', e);
    }
    
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [token, ticketId]);

  const send = async () => {
    if (!text.trim() || !ticketId) return;
    await api.post(`/tickets/${ticketId}/messages`, { message: text });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'message', ticket_id: ticketId }));
    }
    setText(''); setAutoScroll(true); loadMessages();
  };

  const askChatbot = async () => {
    if (!text.trim()) return;
    const msgText = text;
    setText(''); setBotThinking(true); setAutoScroll(true);
    try {
      const res = await api.post('/chatbot/ask', { message: msgText, ticket_id: ticketId });
      setMessages(prev => [...prev, { message: msgText, sender_id: userId, created_at: new Date().toISOString() }]);
      setTimeout(() => {
        setMessages(prev => [...prev, { message: res.data.response, sender_id: 'bot', is_from_bot: true, created_at: new Date().toISOString() }]);
        setBotThinking(false);
      }, 800);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'message', ticket_id: ticketId }));
      }
    } catch (err) { setBotThinking(false); }
  };

  const clearHistory = async () => {
    if (!ticketId) return;
    if (!confirm('Effacer tout l\'historique de cette conversation ?')) return;
    try {
      await api.delete(`/tickets/${ticketId}/messages`);
      toast.success('Historique efface');
      setMessages([]);
      loadMessages();
    } catch (err) { toast.error('Erreur lors de la suppression'); }
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
    } catch (err) { toast.error('Erreur envoi photo'); }
    finally { setUploading(false); }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    await api.post('/tickets', { subject, description: desc, priority: 'normal' });
    setSubject(''); setDesc(''); setShowForm(false);
    loadTickets();
  };

  const getMessageStyle = (m) => {
    const msgId = String(m.sender_id || '');
    const myId = String(userId || '');
    if (msgId === myId) return { align: 'justify-end', bg: 'bg-blue-600 text-white rounded-br-md', label: '' };
    if (msgId === 'bot' || m.is_from_bot) return { align: 'justify-start', bg: 'bg-blue-50 border border-blue-200 text-gray-800 rounded-bl-md', label: 'Assistant' };
    return { align: 'justify-start', bg: 'bg-white shadow border text-gray-800 rounded-bl-md', label: 'Technicien' };
  };

  const scrollToBottom = () => {
    setAutoScroll(true);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {incomingCall && (
        <div className="fixed top-4 right-4 bg-green-500 text-white rounded-2xl shadow-2xl p-6 z-50 animate-bounce">
          <div className="flex items-center gap-4">
            <span className="text-4xl">+</span>
            <div>
              <p className="font-bold text-lg">Appel entrant</p>
              <p className="text-green-100 text-sm">Le technicien vous appelle</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Maintenance</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              if (!ticket?.technician_id) {
                toast.error('Aucun technicien assigne');
                return;
              }
              setShowCall(true);
            }} 
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">
            Appel
          </button>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">+ Ticket</button>
        </div>
      </div>
      {showForm && (
        <form onSubmit={createTicket} className="bg-white rounded-xl shadow p-6 mb-6">
          <input placeholder="Sujet du probleme" value={subject} onChange={e => setSubject(e.target.value)} required className="w-full px-4 py-2 border rounded-lg mb-3" />
          <textarea placeholder="Decrivez votre probleme..." value={desc} onChange={e => setDesc(e.target.value)} required rows={3} className="w-full px-4 py-2 border rounded-lg mb-3" />
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg">Creer le ticket</button>
        </form>
      )}
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {tickets.map(t => (
            <div key={t.id} onClick={() => { setTicketId(t.id); setAutoScroll(true); }}
              className={`bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-md transition ${ticketId === t.id ? 'ring-2 ring-blue-500' : ''}`}>
              <h3 className="font-bold truncate">{t.subject}</h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{t.status}</span>
            </div>
          ))}
        </div>
        <div className="col-span-2">
          {ticket ? (
            <div className="bg-white rounded-xl shadow flex flex-col h-[600px]">
              <div className="p-4 border-b font-bold text-lg flex items-center gap-2">
                {ticket.subject}
                {typing && <span className="text-xs text-gray-400 animate-pulse">Technicien ecrit...</span>}
                <button onClick={clearHistory} className="ml-auto text-red-400 hover:text-red-600 text-xs font-semibold">Effacer historique</button>
              </div>
              <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {!autoScroll && (
                  <div className="sticky top-0 text-center z-10">
                    <button onClick={scrollToBottom} className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs shadow-lg hover:bg-blue-700 animate-bounce">Nouveaux messages</button>
                  </div>
                )}
                {messages.length === 0 && !botThinking && (
                  <div className="flex justify-start">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl rounded-bl-md max-w-[80%]">
                      <p className="text-xs font-semibold text-blue-600 mb-1">Assistant AM Info</p>
                      <p className="text-sm text-gray-700">Bonjour ! Decrivez votre probleme, je vais vous aider.</p>
                      <p className="text-xs text-gray-400 mt-2">"ecran noir", "pc lent", "wifi", "commander piece"...</p>
                    </div>
                  </div>
                )}
                {messages.map((m, i) => {
                  const style = getMessageStyle(m);
                  return (
                    <div key={i} className={`flex ${style.align}`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl ${style.bg}`}>
                        {style.label && <p className={`text-xs font-semibold mb-1 ${m.is_from_bot ? 'text-blue-600' : 'text-gray-500'}`}>{style.label}</p>}
                        {m.attachment_url ? (
                          <a href={m.attachment_url} target="_blank" rel="noopener noreferrer"><img src={m.attachment_url} alt="Piece" className="rounded-lg mb-2 max-w-full cursor-pointer hover:opacity-80" /></a>
                        ) : (<p className="text-sm whitespace-pre-wrap">{m.message}</p>)}
                        <p className={`text-xs mt-1 ${String(m.sender_id) === String(userId) ? 'text-blue-200' : 'text-gray-400'}`}>{new Date(m.created_at).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                  );
                })}
                {botThinking && (
                  <div className="flex justify-start">
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl rounded-bl-md">
                      <p className="text-xs text-blue-600 font-semibold mb-2">Assistant reflechit...</p>
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                      </div>
                    </div>
                  </div>
                )}
                {typing && (
                  <div className="flex justify-start"><div className="bg-white shadow border px-4 py-2 rounded-full"><span className="text-gray-400 text-sm">Technicien ecrit...</span></div></div>
                )}
                {preview && (
                  <div className="flex justify-end">
                    <div className="bg-white shadow border rounded-2xl p-3 max-w-[75%]">
                      <img src={preview} alt="Apercu" className="rounded-lg mb-2 max-w-full max-h-48" />
                      <div className="flex gap-2">
                        <button onClick={uploadPhoto} disabled={uploading} className="bg-green-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">{uploading ? 'Envoi...' : 'Envoyer'}</button>
                        <button onClick={() => { setPreview(null); fileInputRef.current.value = ''; }} className="bg-gray-300 px-4 py-1 rounded-lg text-sm">Annuler</button>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                <div className="px-4 py-3 border-t bg-gray-50"><Rating ticketId={ticket.id} ticketStatus={ticket.status} /></div>
              )}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="bg-gray-100 hover:bg-gray-200 px-3 py-3 rounded-full cursor-pointer transition text-sm" title="Photo">+</label>
                  <input placeholder="Votre message..." value={text} onChange={handleTyping}
                    onKeyPress={e => e.key === 'Enter' && askChatbot()}
                    className="flex-1 px-4 py-2 border rounded-full text-sm" />
                  <button onClick={askChatbot} className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition text-sm font-semibold whitespace-nowrap">Assistant</button>
                  <button onClick={send} className="bg-gray-700 text-white px-4 py-2 rounded-full hover:bg-gray-800 transition text-sm font-semibold">Envoyer</button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">Assistant = IA | Envoyer = technicien</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow h-[600px] flex items-center justify-center text-gray-400 text-lg">
              <div className="text-center"><p className="text-6xl mb-4">+</p><p>Selectionnez un ticket</p></div>
            </div>
          )}
        </div>
      </div>

      {showCall && ticket && (
        <VideoCall
          ws={wsRef.current}
          ticketId={ticketId}
          recipientId={ticket.technician_id}
          userId={userId}
          userName={user?.full_name}
          onClose={() => { setShowCall(false); setIncomingCall(null); }}
        />
      )}
    </div>
  );
}
