// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import ProductCard from '../../components/ProductCard';
import SEO from '../../components/SEO';
import { useAuth } from '../../hooks/useAuth';
import { addRecentlyViewed, getRecentlyViewed } from '../../hooks/useRecentlyViewed';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [alsoBought, setAlsoBought] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    api.get(`/products/${id}`).then(r => {
      if (r.data) {
        setProduct(r.data);
        addRecentlyViewed(r.data);
        setRecentlyViewed(getRecentlyViewed().filter(p => p.id !== r.data.id));
        if (r.data.category) {
          api.get('/products').then(res => {
            const all = res.data?.items || res.data || [];
            setSimilarProducts(all.filter(p => p.category === r.data.category && p.id !== r.data.id).slice(0, 4));
          });
        }
      }
    }).catch(() => {});
    api.get(`/products/${id}/also-bought`).then(r => setAlsoBought(r.data || [])).catch(() => {});
  }, [id]);

  const addToCart = async (productId, name) => {
    if (!isAuthenticated) return;
    try { await api.post('/cart/items', { product_id: productId, quantity: 1 }); toast.success(`${name} ajoute au panier`); }
    catch (err) { toast.error(err.response?.data?.detail || 'Erreur'); }
  };

  if (!product) return <div className="text-center py-10">Chargement...</div>;

  const finalPrice = product.final_price || product.price;

  return (
    <div>
      <SEO 
        title={product.name}
        description={product.description || `Achetez ${product.name} au prix de ${finalPrice.toLocaleString()} Ar chez AM Info`}
        keywords={`${product.name}, ${product.category}, achat informatique, Madagascar`}
      />
      
      <nav className="text-xs text-gray-400 mb-4">
        <Link to="/" className="hover:text-blue-600">Accueil</Link><span className="mx-2">/</span>
        <Link to="/products" className="hover:text-blue-600">Produits</Link><span className="mx-2">/</span>
        <span className="text-gray-600">{product.category}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-gray-50 rounded-2xl h-80 md:h-96 flex items-center justify-center overflow-hidden">
          {product.image_url?.startsWith('http') ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-2xl" /> :
            <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        </div>
        <div>
          <span className="text-sm text-blue-600 font-medium mb-1">{product.category}</span>
          <h1 className="text-3xl font-bold mb-3">{product.name}</h1>
          <p className="text-gray-500 mb-6">{product.description || 'Aucune description.'}</p>
          <span className="text-3xl font-bold text-blue-600">{finalPrice.toLocaleString()} Ar</span>
          {product.stock_quantity > 0 && <p className="text-sm text-green-600 mt-2">En stock ({product.stock_quantity})</p>}
          <div className="flex items-center gap-4 mt-6">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 border rounded-full">-</button>
            <span className="font-bold text-lg">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 border rounded-full">+</button>
          </div>
          <button onClick={() => addToCart(product.id, product.name)} disabled={product.stock_quantity === 0}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">
            Ajouter au panier
          </button>
        </div>
      </div>

      {alsoBought.length > 0 && (
        <div className="border-t pt-8 mb-8">
          <h2 className="text-xl font-bold mb-4">Les clients ont aussi achete</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {alsoBought.map(p => <ProductCard key={p.id} product={p} onAddToCart={(id) => addToCart(id, p.name)} />)}
          </div>
        </div>
      )}

      {similarProducts.length > 0 && (
        <div className="border-t pt-8">
          <h2 className="text-xl font-bold mb-4">Produits similaires</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similarProducts.map(p => <ProductCard key={p.id} product={p} onAddToCart={(id) => addToCart(id, p.name)} />)}
          </div>
        </div>
      )}
    </div>
  );
}
