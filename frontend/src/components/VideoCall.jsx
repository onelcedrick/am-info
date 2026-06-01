// -*- coding: utf-8 -*-
import { useState, useEffect, useRef } from 'react';

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

export default function VideoCall({ ws, ticketId, recipientId, userId, userName, onClose }) {
  const [state, setState] = useState('idle'); // idle, calling, ringing, connected, ended
  const [error, setError] = useState('');
  const localAudio = useRef(null);
  const remoteAudio = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    if (!ws) return;
    
    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'incoming_call' && data.from !== userId) {
        setState('ringing');
        // Stocker les infos d'appel
        ws._pendingCall = data;
      }
      
      if (data.type === 'call_answered' && data.from !== userId) {
        handleRemoteAnswer(data.answer);
      }
      
      if (data.type === 'ice_candidate' && data.from !== userId) {
        handleIceCandidate(data.candidate);
      }
      
      if (data.type === 'call_ended' || data.type === 'call_rejected') {
        endCall();
      }
    };
    
    const originalOnMessage = ws.onmessage;
    ws.onmessage = (event) => {
      handleMessage(event);
      if (originalOnMessage) originalOnMessage.call(ws, event);
    };
    
    return () => {
      if (originalOnMessage) ws.onmessage = originalOnMessage;
    };
  }, [ws, userId]);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          action: 'ice_candidate',
          recipient_id: recipientId,
          ticket_id: ticketId,
          candidate: event.candidate
        }));
      }
    };

    pc.ontrack = (event) => {
      if (remoteAudio.current) {
        remoteAudio.current.srcObject = event.streams[0];
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        endCall();
      }
    };

    return pc;
  };

  const startCall = async () => {
    setState('calling');
    setError('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      if (localAudio.current) localAudio.current.srcObject = stream;
      
      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          action: 'call_start',
          recipient_id: recipientId,
          ticket_id: ticketId,
          call_type: 'audio',
          offer: { type: offer.type, sdp: offer.sdp }
        }));
      }
    } catch (err) {
      setError('Micro non accessible. Verifiez les permissions.');
      setState('ended');
    }
  };

  const answerCall = async () => {
    setState('connected');
    const offerData = ws._pendingCall?.offer;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      if (localAudio.current) localAudio.current.srcObject = stream;
      
      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      await pc.setRemoteDescription(new RTCSessionDescription(offerData));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          action: 'call_answer',
          recipient_id: recipientId,
          answer: { type: answer.type, sdp: answer.sdp }
        }));
      }
    } catch (err) {
      setError('Erreur lors de la reponse.');
      setState('ended');
    }
  };

  const handleRemoteAnswer = async (answerData) => {
    if (pcRef.current) {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answerData));
      setState('connected');
    }
  };

  const handleIceCandidate = async (candidate) => {
    if (pcRef.current) {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'call_end', recipient_id: recipientId }));
    }
    setState('ended');
    setTimeout(() => onClose?.(), 1000);
  };

  const rejectCall = () => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'call_reject', recipient_id: recipientId }));
    }
    setState('ended');
    onClose?.();
  };

  if (state === 'ended') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">+</div>
          <p className="text-lg text-gray-500 mb-4">Appel termine</p>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button onClick={onClose} className="bg-blue-600 text-white px-6 py-3 rounded-full">Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center">
        {/* Icone appel */}
        <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl ${
          state === 'connected' ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-blue-100 text-blue-600'
        }`}>
          {state === 'ringing' ? '📞' : state === 'connected' ? '🔊' : '📞'}
        </div>

        <h2 className="text-xl font-bold mb-2">
          {state === 'calling' && 'Appel en cours...'}
          {state === 'ringing' && `${userName || 'Utilisateur'} vous appelle`}
          {state === 'connected' && 'En communication'}
        </h2>
        
        <p className="text-gray-500 text-sm mb-6">
          {state === 'calling' && 'Sonnerie...'}
          {state === 'ringing' && 'Appel vocal entrant'}
          {state === 'connected' && 'Parlez maintenant'}
        </p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Audio elements */}
        <audio ref={localAudio} autoPlay muted playsInline className="hidden" />
        <audio ref={remoteAudio} autoPlay playsInline className="hidden" />

        {/* Boutons */}
        <div className="flex justify-center gap-4">
          {state === 'ringing' && (
            <>
              <button onClick={answerCall}
                className="bg-green-600 text-white w-16 h-16 rounded-full text-2xl hover:bg-green-700 transition flex items-center justify-center">
                📞
              </button>
              <button onClick={rejectCall}
                className="bg-red-600 text-white w-16 h-16 rounded-full text-2xl hover:bg-red-700 transition flex items-center justify-center">
                ✕
              </button>
            </>
          )}
          {(state === 'calling' || state === 'connected') && (
            <button onClick={endCall}
              className="bg-red-600 text-white w-20 h-20 rounded-full text-3xl hover:bg-red-700 transition animate-pulse flex items-center justify-center">
              📞
            </button>
          )}
          {state === 'idle' && (
            <button onClick={startCall}
              className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg hover:bg-blue-700 transition">
              Appeler
            </button>
          )}
        </div>
        
        {state === 'calling' && (
          <button onClick={endCall} className="mt-4 text-red-500 text-sm hover:underline">Annuler</button>
        )}
      </div>
    </div>
  );
}
