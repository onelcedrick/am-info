import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import VideoCall from '../../components/VideoCall';

const token = localStorage.getItem('token');
const userId = (() => {
  if (!token) return null;
  try { return JSON.parse(atob(token.split('.')[1])).sub; }
  catch { return null; }
})();

export default function TicketListPage() {
  const [tickets, setTickets] = useState([]);
  const [ticketId, setTicketId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const wsRef = useRef(null);
  const typingTimer = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const ticket = tickets.find(t => t.id === ticketId);

  const loadTickets = () => api.get('/technician/tickets').then(r => setTickets(r.data));
  const loadMessages = () => ticketId && api.get(`/tickets/${ticketId}`).then(r => setMessages(r.data.messages || []));

  useEffect(() => { loadTickets(); }, []);
  useEffect(() => { loadMessages(); }, [ticketId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => { if (!ticketId) return; const i = setInterval(() => loadMessages(), 2000); return () => clearInterval(i); }, [ticketId]);

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`ws://localhost:8000/ws?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'typing' && data.ticket_id === ticketId) setTyping(data.is_typing);
      if (data.type === 'new_message' && data.ticket_id === ticketId) loadMessages();
    };
    return () => ws.close();
  }, [token, ticketId]);

  const send = async () => {
    if (!text.trim() || !ticketId) return;
    await api.post(`/tickets/${ticketId}/messages`, { message: text });
    wsRef.current?.send(JSON.stringify({ action: 'message', ticket_id: ticketId }));
    setText(''); loadMessages();
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'typing', ticket_id: ticketId, recipient_id: ticket?.client_id, is_typing: true }));
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        wsRef.current?.send(JSON.stringify({ action: 'typing', ticket_id: ticketId, recipient_id: ticket?.client_id, is_typing: false }));
      }, 2000);
    }
  };

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
      wsRef.current?.send(JSON.stringify({ action: 'message', ticket_id: ticketId }));
      setPreview(null); fileInputRef.current.value = ''; loadMessages();
    } catch (err) { alert('Erreur envoi photo'); }
    finally { setUploading(false); }
  };

  const assignToMe = async (id) => { await api.put(`/technician/tickets/${id}/assign`); loadTickets(); };
  const changeStatus = async (id, status) => { await api.put(`/technician/tickets/${id}/status?status=${status}`); loadTickets(); };
  const isMine = (m) => m.sender_id === userId;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">🎫 Tickets</h1>
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {tickets.map(t => (
            <div key={t.id} onClick={() => setTicketId(t.id)}
              className={`bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-md transition ${ticketId === t.id ? 'ring-2 ring-teal-500' : ''}`}>
              <h3 className="font-bold truncate">{t.subject}</h3>
              <div className="flex justify-between mt-2">
                <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">{t.status}</span>
                {t.status === 'open' && (
                  <button onClick={e => { e.stopPropagation(); assignToMe(t.id); }}
                    className="bg-teal-600 text-white px-3 py-1 rounded-full text-xs hover:bg-teal-700">Prendre</button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-2">
          {ticket ? (
            <div className="bg-white rounded-xl shadow flex flex-col h-[600px]">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  {ticket.subject}
                  {typing && <span className="text-xs text-gray-400 animate-pulse">💬 En train d'écrire...</span>}
                </h2>
                <div className="flex gap-2 items-center">
                  <button onClick={() => setShowCall(true)}
                    className="bg-green-600 text-white px-3 py-1 rounded-full text-sm hover:bg-green-700 transition">📞 Audio</button>
                  <button onClick={() => setShowCall(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-700 transition">📹 Vidéo</button>
                  <select value={ticket.status} onChange={e => changeStatus(ticket.id, e.target.value)}
                    className="border rounded-lg px-3 py-1 text-sm">
                    <option value="open">Ouvert</option>
                    <option value="assigned">Assigné</option>
                    <option value="in_progress">En cours</option>
                    <option value="resolved">Résolu</option>
                    <option value="closed">Fermé</option>
                  </select>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${isMine(m) ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl ${isMine(m) ? 'bg-teal-600 text-white' : 'bg-white shadow border'}`}>
                      {m.attachment_url ? (
                        <a href={m.attachment_url} target="_blank" rel="noopener noreferrer">
                          <img src={m.attachment_url} alt="Pièce" className="rounded-lg mb-2 max-w-full cursor-pointer hover:opacity-80" />
                        </a>
                      ) : (<p className="text-sm">{m.message}</p>)}
                      <p className={`text-xs mt-1 ${isMine(m) ? 'text-teal-200' : 'text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))}
                {typing && (<div className="flex justify-start"><div className="bg-gray-200 px-4 py-2 rounded-full animate-bounce"><span className="text-gray-500 text-sm">● ● ●</span></div></div>)}
                {preview && (
                  <div className="flex justify-end">
                    <div className="bg-white shadow border rounded-2xl p-3 max-w-[75%]">
                      <img src={preview} alt="Aperçu" className="rounded-lg mb-2 max-w-full max-h-48" />
                      <div className="flex gap-2">
                        <button onClick={uploadPhoto} disabled={uploading} className="bg-green-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">{uploading ? 'Envoi...' : '📤 Envoyer'}</button>
                        <button onClick={() => { setPreview(null); fileInputRef.current.value = ''; }} className="bg-gray-300 px-4 py-1 rounded-lg text-sm">Annuler</button>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="tech-file-upload" />
                  <label htmlFor="tech-file-upload" className="bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-full cursor-pointer transition text-xl" title="Photo">📎</label>
                  <input placeholder="Réponse..." value={text} onChange={handleTyping}
                    onKeyPress={e => e.key === 'Enter' && send()}
                    className="flex-1 px-4 py-3 border rounded-full" />
                  <button onClick={send} className="bg-teal-600 text-white px-6 py-3 rounded-full hover:bg-teal-700 transition font-bold">➤</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow h-[600px] flex items-center justify-center text-gray-400 text-lg">
              <div className="text-center"><p className="text-6xl mb-4">💬</p><p>Sélectionnez un ticket</p></div>
            </div>
          )}
        </div>
      </div>

      {showCall && ticket && (
        <VideoCall
          ws={wsRef.current}
          ticketId={ticketId}
          recipientId={ticket.client_id}
          userId={userId}
          onClose={() => setShowCall(false)}
        />
      )}
    </div>
  );
}
