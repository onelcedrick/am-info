// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { EmptyState } from '../../components/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { IconCart, IconTrash, IconPackage } from '../../components/Icons';

const API_URL = import.meta.env.VITE_API_URL;

function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_URL + url;
}

export default function CartPage() {
  const [cart, setCart] = useState({ items: [], total: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    loadCart();
  }, [isAuthenticated]);

  const loadCart = () => {
    api.get('/cart')
      .then(res => setCart(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const updateQuantity = (itemId, qty) => {
    if (qty < 1) return;
    api.put(`/cart/items/${itemId}?quantity=${qty}`)
      .then(() => loadCart())
      .catch(err => toast.error(err.response?.data?.detail || 'Erreur'));
  };

  const removeItem = (itemId, name) => {
    api.delete(`/cart/items/${itemId}`)
      .then(() => {
        toast.success(`${name || 'Produit'} retiré du panier`);
        loadCart();
      })
      .catch(() => toast.error('Erreur'));
  };

  const createOrder = () => {
    api.post('/orders')
      .then(() => {
        toast.success('Commande créée ! Paiement en boutique.');
        navigate('/client/orders');
      })
      .catch(err => toast.error(err.response?.data?.detail || 'Erreur'));
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl md:text-2xl font-bold mb-6">Mon Panier</h1>
        <div className="space-y-3 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 flex gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
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
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Mon Panier ({cart.count})</h1>

      {/* Liste des articles */}
      <div className="space-y-3 mb-6">
        {cart.items.map(item => {
          const imageUrl = getImageUrl(item.image_url);
          return (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4 flex items-center gap-3 md:gap-4">
              {/* Image */}
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <IconPackage size={24} />
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm md:text-base truncate">{item.product_name}</h3>
                <p className="text-blue-600 font-bold text-sm">{item.unit_price?.toLocaleString()} Ar</p>
                
                {/* Quantité + prix total sur mobile */}
                <div className="flex items-center justify-between mt-2 md:hidden">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-full px-1 py-0.5">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-white border text-sm font-bold">−</button>
                    <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-white border text-sm font-bold">+</button>
                  </div>
                  <p className="font-bold text-sm">{item.total?.toLocaleString()} Ar</p>
                </div>
              </div>

              {/* Quantité desktop */}
              <div className="hidden md:flex items-center gap-3 bg-gray-50 rounded-full px-2 py-1">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-full bg-white border text-lg font-bold hover:bg-gray-100">−</button>
                <span className="font-bold w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-full bg-white border text-lg font-bold hover:bg-gray-100">+</button>
              </div>

              {/* Prix desktop */}
              <div className="hidden md:block text-right w-28">
                <p className="font-bold text-lg">{item.total?.toLocaleString()} Ar</p>
              </div>

              {/* Supprimer */}
              <button 
                onClick={() => removeItem(item.id, item.product_name)}
                className="text-gray-300 hover:text-red-500 transition p-2 flex-shrink-0"
                title="Retirer"
              >
                <IconTrash size={18} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Résumé - sticky en bas sur mobile */}
      <div className="md:sticky md:bottom-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Sous-total</span>
            <span>{cart.total?.toLocaleString()} Ar</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Livraison</span>
            <span className="text-green-600 font-medium">Gratuite</span>
          </div>
          <hr className="my-3" />
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-lg">Total</span>
            <span className="text-xl font-bold text-blue-600">{cart.total?.toLocaleString()} Ar</span>
          </div>
          <button 
            onClick={createOrder}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition"
          >
            Commander (Paiement en boutique)
          </button>
          <p className="text-gray-400 text-xs text-center mt-2">💰 Paiement sur place au point de vente</p>
        </div>
      </div>
    </div>
  );
}
