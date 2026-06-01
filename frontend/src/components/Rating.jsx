// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function Rating({ ticketId, ticketStatus }) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticketId) return;
    api.get(`/ratings/ticket/${ticketId}`).then(r => {
      if (r.data.rated) {
        setExisting(r.data);
        setSubmitted(true);
      }
    }).finally(() => setLoading(false));
  }, [ticketId]);

  const submitRating = async () => {
    if (!score) return;
    try {
      await api.post('/ratings/', { ticket_id: ticketId, score, comment });
      setSubmitted(true);
      setExisting({ score, comment });
      toast.success('Merci pour votre avis !');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  if (loading) return null;

  if (submitted && existing) {
    return (
      <div className="bg-white rounded-xl shadow p-4 text-center">
        <p className="text-sm text-gray-500 mb-2">Votre evaluation</p>
        <div className="flex justify-center gap-1 mb-1">
          {[1,2,3,4,5].map(i => (
            <span key={i} className={`text-2xl ${i <= existing.score ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
          ))}
        </div>
        {existing.comment && <p className="text-xs text-gray-400">"{existing.comment}"</p>}
      </div>
    );
  }

  if (ticketStatus !== 'resolved' && ticketStatus !== 'closed') return null;

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-sm font-semibold text-center mb-3">Comment s'est passe le depannage ?</p>
      <div className="flex justify-center gap-1 mb-3">
        {[1,2,3,4,5].map(i => (
          <button key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setScore(i)}
            className={`text-3xl transition ${i <= (hover || score) ? 'text-yellow-400 scale-110' : 'text-gray-300'}`}>
            ★
          </button>
        ))}
      </div>
      {score > 0 && (
        <>
          <textarea placeholder="Commentaire (optionnel)" value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm mb-2" rows={2} />
          <button onClick={submitRating}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition">
            Envoyer
          </button>
        </>
      )}
      <p className="text-xs text-gray-400 text-center mt-2">
        {score === 1 && 'Pas satisfait'}
        {score === 2 && 'Peut mieux faire'}
        {score === 3 && 'Correct'}
        {score === 4 && 'Tres bien'}
        {score === 5 && 'Excellent !'}
      </p>
    </div>
  );
}
