import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import ProductCard from '../../components/ProductCard';
import { useAuth } from '../../hooks/useAuth';

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/products').then(res => setProducts(res.data)).catch(console.error);
  }, []);

  const addToCart = async (productId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/cart/items', { product_id: productId, quantity: 1 });
      setMessage('✅ Produit ajouté au panier !');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error(err);
      setMessage('❌ Erreur lors de l\'ajout');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !category || p.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Nos Produits</h1>

      {message && (
        <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4 text-center">{message}</div>
      )}
      
      <div className="flex gap-4 mb-6">
        <input type="text" placeholder="🔍 Rechercher un produit..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Toutes les catégories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 mt-8">Aucun produit trouvé</p>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))}
        </div>
      )}
    </div>
  );
}
