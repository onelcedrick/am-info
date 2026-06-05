// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { IconHeart, IconPhoto } from './Icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_URL + url;
}

export default function ProductCard({ product, onAddToCart }) {
  const [isFav, setIsFav] = useState(false);
  const [inCompare, setInCompare] = useState(false);
  const { isAuthenticated } = useAuth();
  const finalPrice = product.final_price || product.price;
  const hasDiscount = product.discount_percent > 0;
  const imageUrl = getImageUrl(product.image_url);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/wishlist/ids').then(r => setIsFav((r.data || []).includes(product.id))).catch(() => {});
    
    const compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
    setInCompare(compareList.includes(product.id));
  }, [isAuthenticated, product.id]);

  const toggleFav = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) return;
    try { const res = await api.post(`/wishlist/${product.id}`); setIsFav(res.data.added); } catch (err) {}
  };

  const toggleCompare = (e) => {
    e.preventDefault();
    const compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
    const savedCategory = localStorage.getItem('compareCategory');
    
    if (compareList.includes(product.id)) {
      // Retirer de la comparaison
      const updated = compareList.filter(id => id !== product.id);
      localStorage.setItem('compareList', JSON.stringify(updated));
      setInCompare(false);
      
      // Si plus que 1 produit, garder la categorie, sinon vider
      if (updated.length === 0) {
        localStorage.removeItem('compareCategory');
      }
      
      toast.success('Retire de la comparaison');
    } else if (compareList.length >= 4) {
      toast.error('Maximum 4 produits a comparer');
    } else if (savedCategory && product.category && product.category !== savedCategory) {
      // Categorie differente !
      toast.error(
        <div>
          <p className="font-semibold">Categorie differente !</p>
          <p className="text-xs mt-0.5">
            Vous comparez des produits en <strong>{savedCategory}</strong>.
            Ce produit est en <strong>{product.category}</strong>.
          </p>
          <button 
            onClick={() => {
              localStorage.removeItem('compareList');
              localStorage.removeItem('compareCategory');
              setInCompare(false);
              // Forcer le re-render de tous les ProductCard
              window.dispatchEvent(new Event('storage'));
            }}
            className="mt-1 text-xs underline"
          >
            Vider et recommencer
          </button>
        </div>,
        { duration: 5000 }
      );
    } else {
      // Ajouter a la comparaison
      compareList.push(product.id);
      localStorage.setItem('compareList', JSON.stringify(compareList));
      localStorage.setItem('compareCategory', product.category || '');
      setInCompare(true);
      toast.success(`Ajoute a la comparaison (${compareList.length}/4) · ${product.category}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden group relative">
      <button onClick={toggleFav}
        className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full shadow flex items-center justify-center transition ${
          isFav ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-300 hover:text-red-400'
        }`}>
        <IconHeart filled={isFav} size={16} />
      </button>

      <Link to={`/products/${product.id}`}>
        <div className="h-32 md:h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
          ) : (
            <IconPhoto size={40} />
          )}
        </div>
      </Link>

      <div className="p-3 md:p-4">
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold z-10">
            -{product.discount_percent}%
          </span>
        )}

        <Link to={`/products/${product.id}`}>
          <h3 className="font-bold text-sm md:text-base truncate hover:text-blue-600">{product.name}</h3>
        </Link>
        <p className="text-gray-500 text-xs mb-2 truncate">{product.category || 'Non categorise'}</p>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-blue-600">{finalPrice.toLocaleString()} Ar</span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">{product.price.toLocaleString()} Ar</span>
          )}
        </div>

        <div className="flex gap-2 mb-1">
          <Link to={`/products/${product.id}`} 
            className="flex-1 text-center border border-blue-600 text-blue-600 py-2 rounded-lg text-sm hover:bg-blue-50 transition">
            Details
          </Link>
          <button onClick={() => onAddToCart && onAddToCart(product.id)} 
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition">
            Ajouter
          </button>
        </div>

        <button onClick={toggleCompare} 
          className={`w-full text-xs mt-1 py-1 rounded-lg transition ${
            inCompare 
              ? 'bg-blue-50 text-blue-600 font-medium' 
              : 'text-gray-400 hover:text-blue-500'
          }`}>
          {inCompare ? '✓ Dans la comparaison' : '+ Comparer'}
        </button>
      </div>
    </div>
  );
}
