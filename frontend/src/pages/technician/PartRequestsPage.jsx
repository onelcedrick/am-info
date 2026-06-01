// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { EmptyState } from '../../components/Skeleton';

export default function PartRequestsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    api.get('/technician/tickets').then(r => {
      const withPhotos = [];
      Promise.all(r.data.map(ticket =>
        api.get(`/tickets/${ticket.id}`).then(detail => {
          if (detail.data.messages?.some(m => m.attachment_url)) {
            withPhotos.push({ ...ticket, messages: detail.data.messages });
          }
        }).catch(() => {})
      )).then(() => {
        setTickets(withPhotos);
        setLoading(false);
      });
    });
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Demandes de pieces</h1>
        <div className="grid grid-cols-2 gap-4 animate-pulse">
          {[...Array(2)].map((_, i) => <div key={i} className="bg-white rounded-xl shadow p-4"><div className="h-4 bg-gray-200 rounded w-3/4 mb-3" /><div className="flex gap-2">{[...Array(3)].map((_, j) => <div key={j} className="w-24 h-24 bg-gray-200 rounded-lg" />)}</div></div>)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Demandes de pieces</h1>
      {tickets.length === 0 ? (
        <EmptyState icon="🔩" title="Aucune demande de piece" description="Les photos envoyees par les clients apparaitront ici." />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {tickets.map(ticket => {
            const photos = ticket.messages?.filter(m => m.attachment_url) || [];
            return (
              <div key={ticket.id} className="bg-white rounded-xl shadow p-4">
                <h3 className="font-bold mb-2">{ticket.subject}</h3>
                <p className="text-xs text-gray-500 mb-3">#{ticket.id.slice(0,8)}</p>
                <div className="flex gap-2 flex-wrap">
                  {photos.map((photo, i) => (
                    <img key={i} src={photo.attachment_url} alt="Piece" onClick={() => setSelectedImage(photo.attachment_url)}
                      className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 border" />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">{photos.length} photo(s)</p>
              </div>
            );
          })}
        </div>
      )}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="" className="max-w-[90%] max-h-[90%] object-contain" />
          <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 text-white text-3xl">&times;</button>
        </div>
      )}
    </div>
  );
}
