// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function PartRequestsPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadTickets = () => {
    api.get('/technician/tickets').then(r => {
      // Filtrer les tickets qui contiennent des photos
      const ticketsWithPhotos = [];
      r.data.forEach(ticket => {
        // Verifier si le ticket a des messages avec photos
        api.get(`/tickets/${ticket.id}`).then(detail => {
          const hasPhoto = detail.data.messages?.some(m => m.attachment_url);
          if (hasPhoto) {
            ticketsWithPhotos.push({ ...ticket, messages: detail.data.messages });
          }
          setTickets([...ticketsWithPhotos]);
        }).catch(() => {});
      });
    });
  };

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">Demandes de pieces</h1>
      
      {tickets.length === 0 ? (
        <div className="flex-1 bg-white rounded-xl shadow flex items-center justify-center text-gray-400">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg">Aucune demande de piece</p>
            <p className="text-sm mt-1">Les photos envoyees par les clients apparaitront ici</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 overflow-auto">
          {tickets.map(ticket => {
            const photos = ticket.messages?.filter(m => m.attachment_url) || [];
            return (
              <div key={ticket.id} className="bg-white rounded-xl shadow p-4">
                <h3 className="font-bold mb-2">{ticket.subject}</h3>
                <p className="text-xs text-gray-500 mb-3">Ticket #{ticket.id.slice(0, 8)}</p>
                <div className="flex gap-2 flex-wrap">
                  {photos.map((photo, i) => (
                    <img key={i} src={photo.attachment_url} alt="Piece"
                      onClick={() => setSelectedImage(photo.attachment_url)}
                      className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition border" />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">{photos.length} photo(s)</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal image plein ecran */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Piece" className="max-w-[90%] max-h-[90%] object-contain rounded-lg" />
          <button onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300">&times;</button>
        </div>
      )}
    </div>
  );
}
