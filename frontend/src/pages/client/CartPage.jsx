// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { EmptyState } from '../../components/Skeleton';

export default function CartPage() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadCart = () => {
    setLoading(true);
    api.get('/cart')
      .then(res => setCart(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCart(); }, []);

  const updateQuantity = (itemId, qty) => {
    api.put(`/cart/items/${itemId}?quantity=${qty}`).then(() => loadCart()).catch(() => toast.error('Erreur'));
  };

  const removeItem = (itemId) => {
    api.delete(`/cart/items/${itemId}`).then(() => { toast.success('Retire du panier'); loadCart(); }).catch(() => toast.error('Erreur'));
  };

  const createOrder = () => {
    api.post('/orders').then(() => { toast.success('Commande creee !'); navigate('/client/orders'); }).catch(err => toast.error(err.response?.data?.detail || 'Erreur'));
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Mon Panier</h1>
        <div className="animate-pulse space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 flex gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Votre panier est vide"
        description="Ajoutez des produits depuis notre catalogue."
        action={
          <button onClick={() => navigate('/products')} className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm">
            Voir les produits
          </button>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mon Panier ({cart.count || 0})</h1>
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-3">
          {cart.items.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                {item.image_url && item.image_url.startsWith('http') ? (
                  <img src={item.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold">{item.product_name}</h3>
                <p className="text-blue-600 font-bold">{item.unit_price?.toLocaleString()} Ar</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 border rounded-full">-</button>
                <span className="font-bold w-8 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 border rounded-full">+</button>
              </div>
              <div className="text-right w-32"><p className="font-bold text-lg">{item.total?.toLocaleString()} Ar</p></div>
              <button onClick={() => removeItem(item.id)} className="text-red-500 text-2xl">&times;</button>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Resume</h2>
          <div className="flex justify-between mb-2"><span>Sous-total</span><span>{cart.total?.toLocaleString()} Ar</span></div>
          <div className="flex justify-between mb-2"><span>Livraison</span><span className="text-green-600">Gratuite</span></div>
          <hr className="my-3" />
          <div className="flex justify-between font-bold text-lg mb-4"><span>Total</span><span className="text-blue-600">{cart.total?.toLocaleString()} Ar</span></div>
          <button onClick={createOrder} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition">Commander</button>
          <p className="text-gray-500 text-sm text-center mt-3">Paiement en boutique</p>
        </div>
      </div>
    </div>
  );
}
