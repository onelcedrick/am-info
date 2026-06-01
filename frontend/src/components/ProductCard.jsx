// -*- coding: utf-8 -*-
import { Link } from 'react-router-dom';

export default function ProductCard({ product, onAddToCart }) {
  const finalPrice = product.final_price || product.price;
  const hasDiscount = product.discount_percent > 0;
  const hasImage = product.image_url && product.image_url.startsWith('http');

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden flex flex-col">
      <div className="h-48 bg-gray-100 flex items-center justify-center relative">
        {hasImage ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            -{product.discount_percent}%
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-lg mb-1 truncate">{product.name}</h3>
        <p className="text-gray-500 text-sm mb-3 truncate">{product.category || 'Non categorise'}</p>
        <div className="flex items-center gap-2 mb-3 mt-auto">
          {hasDiscount ? (
            <>
              <span className="text-xl font-bold text-blue-600">{finalPrice.toLocaleString()} Ar</span>
              <span className="text-sm text-gray-400 line-through">{product.price.toLocaleString()} Ar</span>
            </>
          ) : (
            <span className="text-xl font-bold text-blue-600">{product.price.toLocaleString()} Ar</span>
          )}
        </div>
        <div className="flex gap-2">
          <Link to={`/products/${product.id}`} className="flex-1 text-center border border-blue-600 text-blue-600 py-2 rounded-lg text-sm hover:bg-blue-50 transition">
            Details
          </Link>
          <button onClick={() => onAddToCart && onAddToCart(product.id)}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition">
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
