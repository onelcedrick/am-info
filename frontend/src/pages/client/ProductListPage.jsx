// -*- coding: utf-8 -*-
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import ProductCard from '../../components/ProductCard';
import Pagination from '../../components/Pagination';
import { SkeletonCard, EmptyState } from '../../components/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { IconPackage, IconClose } from '../../components/Icons';

export default function ProductListPage() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [allCategories, setAllCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const loadProducts = (page = 1) => {
    setLoading(true);
    api.get(`/products?page=${page}&limit=12`).then(r => {
      setData(r.data || { items: [], total: 0, page: 1, pages: 1 });
      const cats = [...new Set((r.data.items || []).map(p => p.category).filter(Boolean))];
      setAllCategories(cats);
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

  const addToCart = async (productId) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      await api.post('/cart/items', { product_id: productId, quantity: 1 });
      toast.success('Ajouté au panier');
    } catch (err) { toast.error(err.response?.data?.detail || 'Erreur'); }
  };

  const filtered = data.items.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !category || p.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-3">
        <Link to="/" className="hover:text-blue-600">Accueil</Link><span className="mx-1">/</span>
        <span className="text-gray-600">Produits</span>
      </nav>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl md:text-2xl font-bold">Nos Produits</h1>
        {/* Bouton filtres mobile */}
        <button onClick={() => setShowFilters(!showFilters)}
          className="md:hidden text-sm text-blue-600 font-medium flex items-center gap-1">
          {showFilters ? <IconClose size={16} /> : '☰'} Filtres
        </button>
      </div>

      {/* Barre de recherche + filtres */}
      <div ref={searchRef} className="relative mb-4">
        <div className="flex gap-2 md:gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setSelectedIndex(-1); }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
          {/* Catégorie desktop */}
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="hidden md:block px-4 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Toutes catégories</option>
            {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* Filtres mobiles (dropdown) */}
        {showFilters && (
          <div className="md:hidden mt-2 bg-white rounded-xl shadow-lg border p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-500">Catégorie</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setCategory(''); setShowFilters(false); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  !category ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>Toutes</button>
              {allCategories.map(cat => (
                <button key={cat} onClick={() => { setCategory(cat); setShowFilters(false); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    category === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{cat}</button>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border overflow-hidden z-50">
            {suggestions.map((p, i) => (
              <div key={p.id} onClick={() => navigate(`/products/${p.id}`)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-sm ${i === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <IconPackage size={20} />}
                </div>
                <div className="flex-1 min-w-0"><p className="font-medium truncate">{p.name}</p><p className="text-xs text-gray-400">{p.category} · {p.price?.toLocaleString()} Ar</p></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Résultats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Aucun produit" description={search ? `Aucun résultat pour "${search}"` : 'Le catalogue est vide.'}
          action={search ? <button onClick={() => setSearch('')} className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm">Réinitialiser</button> : null} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {filtered.map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} />)}
          </div>
          <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={loadProducts} />
        </>
      )}
    </div>
  );
}
