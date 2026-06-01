// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    api.get(`/products/${id}`).then(r => setProduct(r.data)).catch(() => {});
  }, [id]);

  if (!product) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  const finalPrice = product.final_price || product.price;
  const hasDiscount = product.discount_percent > 0;
  const hasImage = product.image_url && product.image_url.startsWith('http');

  const addToCart = async () => {
    try {
      await api.post('/cart/items', { product_id: product.id, quantity });
      alert('Produit ajoute au panier');
    } catch (err) {
      alert('Connectez-vous pour ajouter au panier');
    }
  };

  return (
    <div>
      <Link to="/products" className="text-blue-600 hover:underline text-sm mb-4 inline-block">&larr; Retour aux produits</Link>
      <div className="grid grid-cols-2 gap-8 mt-4">
        <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center overflow-hidden">
          {hasImage ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-500 mb-4">{product.category || 'Non categorise'}</p>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold text-blue-600">{finalPrice.toLocaleString()} Ar</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-gray-400 line-through">{product.price.toLocaleString()} Ar</span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm">-{product.discount_percent}%</span>
              </>
            )}
          </div>
          <p className="text-gray-700 mb-6">{product.description || 'Aucune description disponible.'}</p>
          <div className="flex items-center gap-4 mb-6">
            <span>Quantite:</span>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 border rounded">-</button>
            <span className="font-bold text-lg">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 border rounded">+</button>
          </div>
          <button onClick={addToCart}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition">
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
}
