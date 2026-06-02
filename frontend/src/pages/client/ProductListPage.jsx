// -*- coding: utf-8 -*-
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import ProductCard from '../../components/ProductCard';
import Pagination from '../../components/Pagination';
import { SkeletonCard, EmptyState } from '../../components/Skeleton';
import { useAuth } from '../../hooks/useAuth';

export default function ProductListPage() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [allCategories, setAllCategories] = useState([]);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const loadProducts = (page = 1) => {
    setLoading(true);
    api.get(`/products?page=${page}&limit=12`).then(r => {
      setData(r.data || { items: [], total: 0, page: 1, pages: 1 });
      setAllCategories([...new Set((r.data.items || []).map(p => p.category).filter(Boolean))]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadProducts(); }, []);

  useEffect(() => {
    if (search.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    const timer = setTimeout(() => {
      api.get(`/products/search?q=${encodeURIComponent(search)}`).then(r => {
        setSuggestions(r.data || []); setShowSuggestions((r.data || []).length > 0);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleClick = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, -1)); }
    else if (e.key === 'Enter' && selectedIndex >= 0 && suggestions[selectedIndex]) { navigate(`/products/${suggestions[selectedIndex].id}`); }
    else if (e.key === 'Escape') { setShowSuggestions(false); }
  };

  const addToCart = async (productId) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      await api.post('/cart/items', { product_id: productId, quantity: 1 });
      toast.success('Ajoute au panier');
    } catch (err) { toast.error(err.response?.data?.detail || 'Erreur'); }
  };

  // Filtrage local (parmi les items de la page courante)
  const filtered = data.items.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !category || p.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      <nav className="text-xs text-gray-400 mb-4">
        <Link to="/" className="hover:text-blue-600">Accueil</Link><span className="mx-1">/</span>
        <span className="text-gray-600">Produits</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6">Nos Produits</h1>

      <div ref={searchRef} className="relative mb-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setSelectedIndex(-1); }}
              onKeyDown={handleKeyDown} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="px-4 py-2.5 border rounded-xl text-sm bg-white">
            <option value="">Toutes categories</option>
            {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border overflow-hidden z-50">
            {suggestions.map((p, i) => (
              <div key={p.id} onClick={() => navigate(`/products/${p.id}`)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-sm ${i === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> :
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                </div>
                <div className="flex-1 min-w-0"><p className="font-medium truncate">{p.name}</p><p className="text-xs text-gray-400">{p.category} · {p.price?.toLocaleString()} Ar</p></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="Aucun produit"
          action={search ? <button onClick={() => setSearch('')} className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm">Reinitialiser</button> : null} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {filtered.map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} />)}
          </div>
          <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={loadProducts} />
        </>
      )}
    </div>
  );
}
