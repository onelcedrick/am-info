import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function CartPage() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadCart = () => {
    setLoading(true);
    api.get('/cart')
      .then(res => {
        console.log('Cart data:', res.data);
        setCart(res.data);
      })
      .catch(err => console.error('Cart error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = (itemId, qty) => {
    api.put(`/cart/items/${itemId}?quantity=${qty}`)
      .then(() => loadCart())
      .catch(err => console.error(err));
  };

  const removeItem = (itemId) => {
    api.delete(`/cart/items/${itemId}`)
      .then(() => loadCart())
      .catch(err => console.error(err));
  };

  const createOrder = () => {
    api.post('/orders')
      .then(res => {
        alert('✅ Commande créée ! Paiement en boutique.');
        navigate('/client/orders');
      })
      .catch(err => {
        console.error(err);
        alert('❌ Erreur lors de la création');
      });
  };

  if (loading) return <div className="text-center py-10 text-lg">Chargement du panier...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">🛒 Mon Panier ({cart.count || 0})</h1>
      
      {(!cart.items || cart.items.length === 0) ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">Votre panier est vide</p>
          <button onClick={() => navigate('/products')} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            Voir les produits
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-3">
            {cart.items.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
                <div className="text-4xl">{item.image_url || '📦'}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{item.product_name}</h3>
                  <p className="text-blue-600 font-bold">{item.unit_price?.toLocaleString()} Ar</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 border rounded-full hover:bg-gray-100 text-lg">−</button>
                  <span className="font-bold w-8 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 border rounded-full hover:bg-gray-100 text-lg">+</button>
                </div>
                <div className="text-right ml-4 w-32">
                  <p className="font-bold text-lg">{item.total?.toLocaleString()} Ar</p>
                </div>
                <button onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-700 text-2xl ml-2">×</button>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-xl shadow p-6 h-fit sticky top-4">
            <h2 className="text-xl font-bold mb-4">Résumé</h2>
            <div className="flex justify-between mb-2"><span>Sous-total</span><span>{cart.total?.toLocaleString()} Ar</span></div>
            <div className="flex justify-between mb-2"><span>Livraison</span><span className="text-green-600">Gratuite</span></div>
            <hr className="my-3" />
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Total</span><span className="text-blue-600">{cart.total?.toLocaleString()} Ar</span>
            </div>
            <button onClick={createOrder}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition">
              Commander (Paiement en boutique)
            </button>
            <p className="text-gray-500 text-sm text-center mt-3">💰 Paiement sur place</p>
          </div>
        </div>
      )}
    </div>
  );
}
