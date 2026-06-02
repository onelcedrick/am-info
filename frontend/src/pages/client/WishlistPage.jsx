// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { EmptyState } from '../../components/Skeleton';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/wishlist/').then(r => setItems(r.data || [])).finally(() => setLoading(false));
  }, []);

  const removeFromWishlist = async (productId) => {
    await api.post(`/wishlist/${productId}`);
    setItems(prev => prev.filter(i => i.id !== productId));
    toast.success('Retire des favoris');
  };

  const addToCart = async (productId, name) => {
    try {
      await api.post('/cart/items', { product_id: productId, quantity: 1 });
      toast.success(`${name} ajoute au panier`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mes Favoris</h1>
      {items.length === 0 ? (
        <EmptyState icon="❤️" title="Aucun favori" description="Ajoutez des produits a vos favoris depuis le catalogue."
          action={<Link to="/products" className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm">Decouvrir les produits</Link>} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow hover:shadow-md transition overflow-hidden group relative">
              <button onClick={() => removeFromWishlist(p.id)}
                className="absolute top-2 right-2 z-10 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-red-500 hover:bg-red-50 transition">
                ❤️
              </button>
              <Link to={`/products/${p.id}`}>
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> :
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                </div>
              </Link>
              <div className="p-3">
                <Link to={`/products/${p.id}`}><h3 className="font-bold text-sm truncate hover:text-blue-600">{p.name}</h3></Link>
                <p className="text-blue-600 font-bold text-sm mt-1">{p.price?.toLocaleString()} Ar</p>
                <button onClick={() => addToCart(p.id, p.name)}
                  className="w-full mt-2 bg-blue-600 text-white py-1.5 rounded-lg text-xs hover:bg-blue-700 transition">
                  Ajouter au panier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
