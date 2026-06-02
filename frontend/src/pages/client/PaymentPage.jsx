// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [methods, setMethods] = useState([]);
  const [selected, setSelected] = useState(null);
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('choose'); // choose, confirm, success
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/payments/methods').then(r => setMethods(r.data || []));
  }, []);

  const handlePay = async () => {
    if (!phone.trim() || phone.length < 9) {
      toast.error('Numero de telephone invalide');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/payments/pay', {
        order_id: orderId,
        method: selected.id,
        phone: phone
      });
      setResult(res.data);
      setStep('success');
      toast.success('Paiement effectue avec succes !');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur de paiement');
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Aucune commande a payer.</p>
        <Link to="/client/orders" className="text-blue-600 hover:underline mt-4 inline-block">Voir mes commandes</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Paiement Mobile</h1>

      {step === 'choose' && (
        <>
          <p className="text-gray-500 text-sm mb-6">
            Commande <span className="font-mono font-bold">#{orderId.slice(0, 8)}</span> - Choisissez votre methode de paiement
          </p>

          <div className="space-y-3 mb-6">
            {methods.map(m => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition ${
                  selected?.id === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-3xl">{m.icon}</span>
                <div className="text-left flex-1">
                  <p className="font-bold">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.description}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selected?.id === m.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {selected?.id === m.id && <span className="text-white text-sm">✓</span>}
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-bold mb-4">Numero {selected.name}</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-gray-400">{selected.prefix}</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="XX XXX XX"
                  className="flex-1 px-4 py-3 border rounded-lg text-lg tracking-wider"
                />
              </div>
              <button
                onClick={() => setStep('confirm')}
                disabled={phone.length < 9}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Continuer
              </button>
            </div>
          )}
        </>
      )}

      {step === 'confirm' && (
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <div className="text-4xl mb-4">{selected?.icon}</div>
          <h2 className="text-xl font-bold mb-2">Confirmer le paiement</h2>
          <p className="text-gray-500 mb-4">
            Paiement via <strong>{selected?.name}</strong> au <strong>{selected?.prefix} {phone}</strong>
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Vous recevrez une notification de confirmation sur votre telephone
          </p>
          <div className="flex gap-3">
            <button onClick={() => setStep('choose')} className="flex-1 py-3 border rounded-xl font-semibold hover:bg-gray-50">Retour</button>
            <button onClick={handlePay} disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Paiement...' : 'Payer'}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && result && (
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Paiement reussi !</h2>
          <p className="text-gray-500 mb-2">{result.message}</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
            <p><strong>Transaction:</strong> {result.transaction_id}</p>
            <p><strong>Montant:</strong> {result.amount?.toLocaleString()} Ar</p>
            <p><strong>Methode:</strong> {result.method}</p>
            <p><strong>Telephone:</strong> {result.phone}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/client/orders" className="flex-1 py-3 border rounded-xl font-semibold hover:bg-gray-50 text-center">
              Mes commandes
            </Link>
            <Link to="/products" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 text-center">
              Continuer mes achats
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
