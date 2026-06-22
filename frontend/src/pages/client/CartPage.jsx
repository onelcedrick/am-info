// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { EmptyState } from '../../components/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import useConfirm from '../../hooks/useConfirm';
import { IconCart, IconTrash, IconPackage, IconTag } from '../../components/Icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_URL + url;
}

export default function CartPage() {
  const { confirm, Modal } = useConfirm();
  const [cart, setCart] = useState({ items: [], total: 0, count: 0, total_savings: 0 });
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    loadCart();
  }, [isAuthenticated]);

  const loadCart = () => {
    api.get('/cart')
      .then(res => {
        const items = res.data.items || [];
        const totalSavings = items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
        setCart({ ...res.data, total_savings: totalSavings });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const updateQuantity = (itemId, qty) => {
    if (qty < 1) return;
    api.put(`/cart/items/${itemId}?quantity=${qty}`)
      .then(() => loadCart())
      .catch(err => toast.error(err.response?.data?.detail || 'Erreur'));
  };

  const removeItem = async (itemId, name) => {
    const ok = await confirm('Retirer du panier', `${name || 'Ce produit'} sera retiré de votre panier.`);
    if (!ok) return;
    api.delete(`/cart/items/${itemId}`)
      .then(() => {
        toast.success(`${name || 'Produit'} retiré du panier`);
        loadCart();
      })
      .catch(() => toast.error('Erreur'));
  };

  const createOrder = async () => {
    const ok = await confirm('Confirmer la commande', 'Voulez-vous créer cette commande ? Le paiement se fera en boutique.');
    if (!ok) return;
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
      {Modal}
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Mon Panier ({cart.count})</h1>

      {/* Liste des articles */}
      <div className="space-y-3 mb-6">
        {cart.items.map(item => {
          const imageUrl = getImageUrl(item.image_url);
          const hasDiscount = item.has_discount && item.discount_percent > 0;
          return (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4 flex items-center gap-3 md:gap-4">
              {/* Image */}
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <IconPackage size={24} />
                )}
                {hasDiscount && (
                  <span className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg rounded-tl-lg">
                    -{item.discount_percent}%
                  </span>
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm md:text-base truncate">{item.product_name}</h3>
                
                {/* Prix avec/sans réduction */}
                <div className="flex items-center gap-2 mt-0.5">
                  {hasDiscount ? (
                    <>
                      <span className="text-blue-600 font-bold text-sm">
                        {item.unit_price?.toLocaleString()} Ar
                      </span>
                      <span className="text-gray-400 text-xs line-through">
                        {item.original_price?.toLocaleString()} Ar
                      </span>
                      {item.discount_name && (
                        <span className="text-green-600 text-xs flex items-center gap-0.5">
                          <IconTag size={12} />
                          {item.discount_name}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-blue-600 font-bold text-sm">
                      {item.unit_price?.toLocaleString()} Ar
                    </span>
                  )}
                </div>
                
                {/* Quantité + prix total sur mobile */}
                <div className="flex items-center justify-between mt-2 md:hidden">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-full px-1 py-0.5">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-white border text-sm font-bold">−</button>
                    <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-white border text-sm font-bold">+</button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{item.total?.toLocaleString()} Ar</p>
                    {hasDiscount && item.discount_amount > 0 && (
                      <p className="text-green-600 text-xs">Économie: {item.discount_amount?.toLocaleString()} Ar</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantité desktop */}
              <div className="hidden md:flex items-center gap-3 bg-gray-50 rounded-full px-2 py-1">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-full bg-white border text-lg font-bold hover:bg-gray-100">−</button>
                <span className="font-bold w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-full bg-white border text-lg font-bold hover:bg-gray-100">+</button>
              </div>

              {/* Prix desktop */}
              <div className="hidden md:block text-right w-32">
                <p className="font-bold text-lg">{item.total?.toLocaleString()} Ar</p>
                {hasDiscount && item.discount_amount > 0 && (
                  <p className="text-green-600 text-xs">Économie: {item.discount_amount?.toLocaleString()} Ar</p>
                )}
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

      {/* Récapitulatif */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Sous-total</span>
            <span>{cart.total?.toLocaleString()} Ar</span>
          </div>
          
          {cart.total_savings > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-green-600 flex items-center gap-1">
                <IconTag size={14} />
                Économies
              </span>
              <span className="text-green-600 font-medium">-{cart.total_savings?.toLocaleString()} Ar</span>
            </div>
          )}
          
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