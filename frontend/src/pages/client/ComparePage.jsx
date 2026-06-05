// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { 
  IconPackage, IconClose, IconCheck, IconPlus, IconStar,
  IconCart, IconOrders, IconDashboard 
} from '../../components/Icons';

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const ids = searchParams.get('ids') || '';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ids) { setLoading(false); return; }
    const productIds = ids.split(',').filter(Boolean);
    if (productIds.length < 2) {
      window.location.href = '/products';
      return;
    }
    api.get(`/compare?ids=${ids}`).then(r => {
      if (r.data?.error) {
        toast.error(r.data.error, { duration: 5000 });
        // Rediriger apres 2 secondes
        setTimeout(() => { window.location.href = '/products'; }, 2500);
        setData(null);
        setLoading(false);
        return;
      }
      setData(r.data);
    }).finally(() => setLoading(false));
  }, [ids]);

  const removeProduct = (productId) => {
    const currentIds = ids.split(',').filter(id => id !== productId);
    if (currentIds.length < 2) {
      toast('Comparaison vide, retour au catalogue', { icon: '📋' });
      setTimeout(() => { window.location.href = '/products'; }, 1000);
      return;
    }
    window.location.href = `/compare?ids=${currentIds.join(',')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <IconClose size={32} />
        </div>
        <p className="text-gray-600 font-medium">Impossible de comparer</p>
        <p className="text-gray-400 text-sm mt-1">{data?.error || 'Selectionnez des produits de la meme categorie'}</p>
        <p className="text-gray-400 text-xs mt-3">Redirection automatique vers le catalogue...</p>
        <Link to="/products" className="inline-block mt-4 text-blue-600 hover:underline text-sm">
          Voir le catalogue maintenant
        </Link>
      </div>
    );
  }

  const { products, comparisons, winner_index, winner_reason } = data;
  const gridCols = products.length === 2 ? 'grid-cols-2' : products.length === 3 ? 'grid-cols-3' : 'grid-cols-4';

  const getComparisonIcon = (type) => {
    switch (type) {
      case 'price': return <IconCart size={18} />;
      case 'stock': return <IconOrders size={18} />;
      case 'popularity': return <IconDashboard size={18} />;
      default: return <IconStar size={18} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Comparaison</h1>
          <p className="text-sm text-gray-400 mt-1">
            {products.length} produit{products.length > 1 ? 's' : ''} compares · Meme categorie : <span className="font-medium text-gray-600">{products[0]?.category}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {products.length < 4 && (
            <Link to="/products" className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition">
              <IconPlus size={16} /> Ajouter
            </Link>
          )}
          <Link to="/products" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg transition">
            <IconClose size={16} /> Fermer
          </Link>
        </div>
      </div>

      {/* Produits */}
      <div className={`grid ${gridCols} gap-4 mb-8`}>
        {products.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
              i === winner_index ? 'ring-2 ring-yellow-400 border-yellow-400' : 'border-gray-100'
            }`}
          >
            {i === winner_index && (
              <div className="bg-yellow-400 text-white text-center py-1.5 text-xs font-bold flex items-center justify-center gap-1">
                <IconStar size={12} /> Meilleur choix
              </div>
            )}

            <div className="relative">
              <button onClick={() => removeProduct(p.id)}
                className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 backdrop-blur rounded-full shadow flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                <IconClose size={14} />
              </button>
              <Link to={`/products/${p.id}`} className="block h-44 bg-gray-50 flex items-center justify-center overflow-hidden">
                {p.image_url?.startsWith('http') ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-300"><IconPackage size={48} /></div>
                )}
              </Link>
            </div>

            <div className="p-4">
              <Link to={`/products/${p.id}`} className="font-bold text-sm hover:text-blue-600 line-clamp-2">{p.name}</Link>
              <p className="text-xs text-gray-400 mt-1">{p.category || 'Sans categorie'}</p>
              
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <IconCart size={14} />
                  <span className="font-bold text-blue-600">{p.price?.toLocaleString()} Ar</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <IconOrders size={14} />
                  <span className="text-gray-500">{p.stock} en stock</span>
                </div>
                {p.description && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-3">{p.description}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
          <IconDashboard size={16} />
          <h2 className="font-bold text-sm">Comparaison detaillee</h2>
        </div>
        {comparisons.map((comp, i) => (
          <div key={i} className={`p-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
            <div className="flex items-center gap-2 mb-3">
              {getComparisonIcon(comp.type)}
              <span className="font-semibold text-sm text-gray-700">{comp.name}</span>
            </div>
            <div className={`grid ${gridCols} gap-3`}>
              {comp.values.map((val, j) => (
                <div key={j} className={`text-center p-2.5 rounded-lg text-sm ${j === comp.best_index ? 'bg-green-50 text-green-700 font-semibold border border-green-200' : 'bg-gray-50 text-gray-600'}`}>
                  <span>{val}</span>
                  {j === comp.best_index && <span className="inline-flex items-center ml-1 text-green-500"><IconCheck size={14} /></span>}
                </div>
              ))}
            </div>
            {comp.analysis && <p className="text-xs text-gray-400 mt-2">{comp.analysis}</p>}
          </div>
        ))}
      </div>

      {winner_reason && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-5 text-center">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <IconStar size={20} />
          </div>
          <p className="text-lg font-bold text-yellow-800">{winner_reason}</p>
        </motion.div>
      )}
    </div>
  );
}
