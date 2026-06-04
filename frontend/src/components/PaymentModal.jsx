// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function PaymentModal({ orderId, orderTotal, onClose, onSuccess }) {
  const [methods, setMethods] = useState([]);
  const [selected, setSelected] = useState(null);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState('choose');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get('/payments/methods').then(r => setMethods(r.data || []));
  }, []);

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 7);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return digits.slice(0, 2) + ' ' + digits.slice(2);
    return digits.slice(0, 2) + ' ' + digits.slice(2, 5) + ' ' + digits.slice(5);
  };

  const getRawPhone = () => phone.replace(/\s/g, '');

  const formatPin = (value) => value.replace(/\D/g, '').slice(0, 4);

  const handlePay = async () => {
    if (pin.length < 4) { toast.error('Code PIN à 4 chiffres requis'); return; }
    setLoading(true);
    const fullPhone = selected.prefix + getRawPhone();
    try {
      const res = await api.post('/payments/pay', { order_id: orderId, method: selected.id, phone: fullPhone, pin });
      setResult(res.data);
      setStep('success');
      toast.success('Paiement effectué !');
      if (onSuccess) setTimeout(onSuccess, 2000);
    } catch (err) { toast.error(err.response?.data?.detail || 'Erreur de paiement'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full md:max-w-md max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="font-bold text-lg">Paiement Mobile Money</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <div className="p-4">
          {/* Étape 1 : Choisir méthode + numéro */}
          {step === 'choose' && (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Commande <span className="font-mono font-bold">#{orderId?.slice(0, 8)}</span> · <span className="font-bold text-blue-600">{orderTotal?.toLocaleString()} Ar</span>
              </p>

              <div className="space-y-2 mb-4">
                {methods.map(m => (
                  <button key={m.id} onClick={() => { setSelected(m); setPhone(''); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition ${
                      selected?.id === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <span className="text-2xl">{m.icon}</span>
                    <div className="text-left flex-1">
                      <p className="font-bold text-sm">{m.name}</p>
                      <p className="text-xs text-gray-400">Préfixe automatique : {m.prefix}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selected?.id === m.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {selected?.id === m.id && <span className="text-white text-xs">✓</span>}
                    </div>
                  </button>
                ))}
              </div>

              {selected && (
                <div className="border-t pt-4">
                  <label className="text-sm font-semibold mb-2 block">Numéro {selected.name}</label>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-gray-100 text-gray-700 font-mono font-bold px-3 py-3 rounded-lg text-lg">{selected.prefix}</span>
                    <input type="tel" value={phone} onChange={e => setPhone(formatPhone(e.target.value))}
                      placeholder="XX XXX XX" className="flex-1 px-4 py-3 border rounded-lg text-lg tracking-wider text-center font-mono" autoFocus />
                  </div>
                  <p className="text-xs text-gray-400 mb-4 text-center">{getRawPhone().length}/7 chiffres</p>
                  <button onClick={() => setStep('confirm')} disabled={getRawPhone().length < 7}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition">
                    Continuer
                  </button>
                </div>
              )}
            </>
          )}

          {/* Étape 2 : Code PIN */}
          {step === 'confirm' && (
            <div className="text-center">
              <div className="text-4xl mb-3">{selected?.icon}</div>
              <h3 className="text-lg font-bold mb-1">{selected?.name}</h3>
              <p className="text-gray-500 text-sm mb-1">
                <span className="font-mono font-bold">{selected?.prefix} {phone}</span>
              </p>
              <p className="text-2xl font-bold text-blue-600 mb-6">{orderTotal?.toLocaleString()} Ar</p>

              <div className="mb-6">
                <label className="text-sm font-semibold mb-3 block">Entrez votre code PIN</label>
                <div className="flex justify-center gap-3 mb-3">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-12 h-14 border-2 rounded-xl flex items-center justify-center text-2xl font-bold transition ${
                      pin.length > i ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200'
                    }`}>
                      {pin[i] ? '•' : ''}
                    </div>
                  ))}
                </div>
                <input type="password" inputMode="numeric" value={pin}
                  onChange={e => setPin(formatPin(e.target.value))}
                  placeholder="Code PIN 4 chiffres"
                  className="w-full px-4 py-3 border rounded-lg text-center text-lg tracking-widest font-mono"
                  autoFocus maxLength={4} />
                <p className="text-xs text-gray-400 mt-1">Saisissez votre code PIN</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep('choose')} className="flex-1 py-3 border rounded-xl font-semibold hover:bg-gray-50 text-sm">Retour</button>
                <button onClick={handlePay} disabled={loading || pin.length < 4}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 text-sm">
                  {loading ? 'Paiement...' : 'Payer'}
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 : Succès */}
          {step === 'success' && result && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Paiement réussi !</h3>
              <p className="text-gray-500 text-sm mb-4">{result.message}</p>
              <div className="bg-gray-50 rounded-lg p-3 text-xs mb-4 space-y-1 text-left">
                <p><strong>Transaction:</strong> {result.transaction_id}</p>
                <p><strong>Référence:</strong> {result.reference}</p>
                <p><strong>Montant:</strong> {result.amount?.toLocaleString()} Ar</p>
                <p><strong>Téléphone:</strong> {result.phone}</p>
                {result.auto_verified && <p className="text-green-600 font-semibold">✓ Vérifié automatiquement</p>}
              </div>
              <button onClick={onClose} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
