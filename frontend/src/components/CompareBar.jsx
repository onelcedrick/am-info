// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function CompareBar() {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    const update = () => {
      const list = JSON.parse(localStorage.getItem('compareList') || '[]');
      const cat = localStorage.getItem('compareCategory') || null;
      setItems(list);
      setCategory(cat);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const clearAll = () => {
    localStorage.removeItem('compareList');
    localStorage.removeItem('compareCategory');
    setItems([]);
    setCategory(null);
    toast.success('Comparaison videe');
  };

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border z-40 px-5 py-3 flex items-center gap-4"
        >
          <div className="text-sm">
            <span className="font-semibold text-gray-700">{items.length} produit{items.length > 1 ? 's' : ''}</span>
            {category && (
              <span className="text-gray-400 ml-2">· {category}</span>
            )}
          </div>
          
          {items.length >= 2 && (
            <Link
              to={`/compare?ids=${items.join(',')}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition"
            >
              Comparer
            </Link>
          )}
          
          {items.length === 1 && (
            <span className="text-xs text-gray-400">Ajoutez un autre produit de la meme categorie</span>
          )}
          
          <button onClick={clearAll} className="text-gray-400 hover:text-red-500 text-sm transition">
            Vider
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
