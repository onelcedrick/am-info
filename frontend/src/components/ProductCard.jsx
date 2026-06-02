// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

export default function ProductCard({ product, onAddToCart }) {
  const [isFav, setIsFav] = useState(false);
  const { isAuthenticated } = useAuth();
  const finalPrice = product.final_price || product.price;
  const hasDiscount = product.discount_percent > 0;

  // Charger l'etat du favori au montage
  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/wishlist/ids').then(r => {
      const ids = r.data || [];
      setIsFav(ids.includes(product.id));
    }).catch(() => {});
  }, [isAuthenticated, product.id]);

  const toggleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    try {
      const res = await api.post(`/wishlist/${product.id}`);
      setIsFav(res.data.added);
    } catch (err) {}
  };

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden group relative">
      <button onClick={toggleFav}
        className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full shadow flex items-center justify-center text-sm transition ${
          isFav ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-300 hover:text-red-400'
        }`}>
        {isFav ? '❤' : '♡'}
      </button>
      <Link to={`/products/${product.id}`}>
        <div className="h-32 md:h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
          {product.image_url && product.image_url.startsWith('http') ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
          ) : (
            <svg className="w-10 h-10 md:w-16 md:h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
      </Link>
      <div className="p-3 md:p-4">
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold z-10">-{product.discount_percent}%</span>
        )}
        <Link to={`/products/${product.id}`}><h3 className="font-bold text-sm md:text-base truncate hover:text-blue-600">{product.name}</h3></Link>
        <p className="text-gray-500 text-xs mb-2 truncate">{product.category || 'Non categorise'}</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-blue-600">{finalPrice.toLocaleString()} Ar</span>
          {hasDiscount && <span className="text-sm text-gray-400 line-through">{product.price.toLocaleString()} Ar</span>}
        </div>
        <div className="flex gap-2">
          <Link to={`/products/${product.id}`} className="flex-1 text-center border border-blue-600 text-blue-600 py-2 rounded-lg text-sm hover:bg-blue-50 transition">Details</Link>
          <button onClick={() => onAddToCart && onAddToCart(product.id)}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition">Ajouter</button>
        </div>
      </div>
    </div>
  );
}
