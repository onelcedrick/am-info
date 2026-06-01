import { useEffect, useRef, useState } from 'react';

const servers = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

export default function VideoCall({ ws, ticketId, recipientId, userId, onClose }) {
  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, connected, ended
  const [callType, setCallType] = useState('video');
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const pcRef = useRef(null);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(servers);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({
          action: 'ice_candidate',
          recipient_id: recipientId,
          ticket_id: ticketId,
          candidate: event.candidate
        }));
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  const startCall = async (type) => {
    setCallType(type);
    setCallState('calling');
    
    const pc = createPeerConnection();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
      
      if (localVideo.current) {
        localVideo.current.srcObject = stream;
      }
      
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      ws.send(JSON.stringify({
        action: 'call_start',
        recipient_id: recipientId,
        ticket_id: ticketId,
        call_type: type,
        offer: offer
      }));
    } catch (err) {
      console.error('Erreur média:', err);
      setCallState('ended');
    }
  };

  const answerCall = async (offer) => {
    setCallState('connecting');
    
    const pc = createPeerConnection();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });
      
      if (localVideo.current) {
        localVideo.current.srcObject = stream;
      }
      
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      ws.send(JSON.stringify({
        action: 'call_answer',
        recipient_id: recipientId,
        answer: answer
      }));
      
      setCallState('connected');
    } catch (err) {
      console.error('Erreur réponse:', err);
      setCallState('ended');
    }
  };

  const handleAnswer = async (answer) => {
    if (pcRef.current) {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      setCallState('connected');
    }
  };

  const handleIceCandidate = async (candidate) => {
    if (pcRef.current) {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const endCall = () => {
    if (pcRef.current) {
      pcRef.current.getTracks?.()?.forEach(track => track.stop());
      pcRef.current.close();
    }
    if (localVideo.current?.srcObject) {
      localVideo.current.srcObject.getTracks().forEach(track => track.stop());
    }
    ws.send(JSON.stringify({
      action: 'call_end',
      recipient_id: recipientId
    }));
    setCallState('ended');
    onClose?.();
  };

  const rejectCall = () => {
    ws.send(JSON.stringify({
      action: 'call_reject',
      recipient_id: recipientId
    }));
    setCallState('ended');
    onClose?.();
  };

  // Écouter les événements WebSocket pour les appels
  useEffect(() => {
    if (!ws) return;
    const originalOnMessage = ws.onmessage;
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'incoming_call' && data.from !== userId) {
        setCallState('ringing');
        setCallType(data.call_type || 'video');
        // Stocker l'offer pour répondre
        ws._pendingOffer = data.offer;
      }
      
      if (data.type === 'call_answered' && data.from !== userId) {
        handleAnswer(data.answer);
      }
      
      if (data.type === 'ice_candidate' && data.from !== userId) {
        handleIceCandidate(data.candidate);
      }
      
      if (data.type === 'call_ended' || data.type === 'call_rejected') {
        endCall();
      }
      
      // Appeler le handler original
      if (originalOnMessage) originalOnMessage.call(ws, event);
    };
    
    return () => {
      if (originalOnMessage) ws.onmessage = originalOnMessage;
    };
  }, [ws, userId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">
            {callState === 'ringing' ? '📞 Appel entrant...' : 
             callState === 'calling' ? '📞 Appel en cours...' :
             callState === 'connected' ? '✅ En ligne' : '📞 Appel'}
          </h2>
          <button onClick={endCall} className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700">
            ✕ Raccrocher
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative bg-gray-800 rounded-xl overflow-hidden" style={{ minHeight: 300 }}>
            <video ref={remoteVideo} autoPlay playsInline className="w-full h-full object-cover" />
            {callState !== 'connected' && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
                {callState === 'ringing' ? 'Sonnerie...' : 
                 callState === 'calling' ? 'Appel...' : 'En attente'}
              </div>
            )}
          </div>
          <div className="w-40 relative">
            <video ref={localVideo} autoPlay playsInline muted className="w-full h-48 object-cover rounded-xl bg-gray-800" />
          </div>
        </div>

        <div className="flex justify-center gap-4">
          {callState === 'ringing' && (
            <>
              <button onClick={() => answerCall(ws._pendingOffer)}
                className="bg-green-600 text-white px-8 py-4 rounded-full text-lg hover:bg-green-700">
                ✅ Répondre
              </button>
              <button onClick={rejectCall}
                className="bg-red-600 text-white px-8 py-4 rounded-full text-lg hover:bg-red-700">
                ❌ Refuser
              </button>
            </>
          )}
          {callState === 'connected' && (
            <button onClick={endCall}
              className="bg-red-600 text-white px-8 py-4 rounded-full text-lg hover:bg-red-700 animate-pulse">
              🔴 Raccrocher
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
