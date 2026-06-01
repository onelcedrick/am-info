// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [newArrivals, setNewArrivals] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [stats, setStats] = useState({ products: 0 });

  useEffect(() => {
    // Utiliser les memes routes que le catalogue existant
    api.get('/products').then(r => {
      const all = r.data || [];
      setStats({ products: all.length });
      // Nouveaux arrives : les 4 premiers
      setNewArrivals(all.slice(0, 4));
      // Populaires : les 4 suivants
      setPopularProducts(all.slice(4, 8));
    }).catch(() => {
      setStats({ products: 0 });
      setNewArrivals([]);
      setPopularProducts([]);
    });
  }, []);

  const addToCart = async (productId, productName) => {
    if (!isAuthenticated) return;
    try {
      await api.post('/cart/items', { product_id: productId, quantity: 1 });
      toast.success(`${productName} ajoute au panier`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  return (
    <div className="space-y-8 md:space-y-12 px-2 md:px-0">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl md:rounded-3xl p-6 md:p-12 lg:p-16">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4">AM Info</h1>
          <p className="text-lg md:text-xl text-blue-100 mb-1 md:mb-2">Assistance & Maintenance Informatique</p>
          <p className="text-sm md:text-base text-blue-200 mb-6 md:mb-8 max-w-xl">Votre expert en materiel informatique et depannage technique.</p>
          <div className="flex gap-3 md:gap-4 flex-wrap">
            <Link to="/products" className="bg-white text-blue-600 px-5 md:px-8 py-2.5 md:py-3 rounded-full text-sm md:text-base font-semibold hover:bg-blue-50 transition shadow-lg">Voir les produits</Link>
            {!isAuthenticated && (
              <Link to="/register" className="border-2 border-white text-white px-5 md:px-8 py-2.5 md:py-3 rounded-full text-sm md:text-base font-semibold hover:bg-white/10 transition">Creer un compte</Link>
            )}
          </div>
          <div className="flex gap-4 md:gap-8 mt-6 md:mt-10">
            <div><p className="text-2xl md:text-3xl font-bold">{stats.products}+</p><p className="text-blue-200 text-xs md:text-sm">Produits</p></div>
            <div><p className="text-2xl md:text-3xl font-bold">24/7</p><p className="text-blue-200 text-xs md:text-sm">Assistance</p></div>
            <div><p className="text-2xl md:text-3xl font-bold">100%</p><p className="text-blue-200 text-xs md:text-sm">Satisfaction</p></div>
          </div>
        </div>
      </div>

      {/* Nouveaux arrives */}
      {newArrivals.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Nouveaux arrives</h2>
              <p className="text-gray-500 text-sm mt-1">Decouvrez nos derniers produits</p>
            </div>
            <Link to="/products" className="text-blue-600 hover:underline font-semibold text-sm">Voir tout</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {newArrivals.map(p => (
              <div key={p.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden group relative">
                <span className="absolute top-2 left-2 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold z-10">Nouveau</span>
                <Link to={`/products/${p.id}`}>
                  <div className="h-32 md:h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {p.image_url && p.image_url.startsWith('http') ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <svg className="w-10 h-10 md:w-16 md:h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                </Link>
                <div className="p-3 md:p-4">
                  <Link to={`/products/${p.id}`}><h3 className="font-bold text-sm md:text-base truncate hover:text-blue-600">{p.name}</h3></Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-blue-600 font-bold text-sm md:text-base">{(p.final_price || p.price).toLocaleString()} Ar</span>
                    {p.discount_percent > 0 && <span className="text-xs text-red-500">-{p.discount_percent}%</span>}
                  </div>
                  {isAuthenticated && (
                    <button onClick={() => addToCart(p.id, p.name)}
                      className="w-full mt-2 bg-blue-600 text-white py-1.5 rounded-lg text-xs md:text-sm hover:bg-blue-700 transition">Ajouter</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Produits populaires */}
      {popularProducts.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Produits populaires</h2>
              <p className="text-gray-500 text-sm mt-1">Les plus demandes par nos clients</p>
            </div>
            <Link to="/products" className="text-blue-600 hover:underline font-semibold text-sm">Voir tout</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {popularProducts.map(p => (
              <div key={p.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden group relative">
                <span className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold z-10">Populaire</span>
                <Link to={`/products/${p.id}`}>
                  <div className="h-32 md:h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {p.image_url && p.image_url.startsWith('http') ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <svg className="w-10 h-10 md:w-16 md:h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                </Link>
                <div className="p-3 md:p-4">
                  <Link to={`/products/${p.id}`}><h3 className="font-bold text-sm md:text-base truncate hover:text-blue-600">{p.name}</h3></Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-blue-600 font-bold text-sm md:text-base">{(p.final_price || p.price).toLocaleString()} Ar</span>
                    {p.discount_percent > 0 && <span className="text-xs text-red-500">-{p.discount_percent}%</span>}
                  </div>
                  {isAuthenticated && (
                    <button onClick={() => addToCart(p.id, p.name)}
                      className="w-full mt-2 bg-blue-600 text-white py-1.5 rounded-lg text-xs md:text-sm hover:bg-blue-700 transition">Ajouter</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">Nos Services</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {[
            { title: 'Vente Materiel', desc: 'Ordinateurs, ecrans, imprimantes, pieces detachees.' },
            { title: 'Depannage', desc: 'Diagnostic a distance, chat en direct avec un technicien.' },
            { title: 'En Boutique', desc: 'Paiement sur place, retrait immediat, conseils.' },
            { title: 'Garantie', desc: 'Tous nos produits sont garantis, SAV inclus.' }
          ].map(s => (
            <div key={s.title} className="bg-white rounded-2xl shadow p-4 md:p-6 text-center hover:shadow-lg transition">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="font-bold text-sm md:text-lg mb-1 md:mb-2">{s.title}</h3>
              <p className="text-gray-500 text-xs md:text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comment ca marche */}
      <div className="bg-white rounded-2xl md:rounded-3xl shadow p-6 md:p-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">Comment ca marche ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { step: 1, title: 'Creez un compte', desc: 'Inscrivez-vous gratuitement.' },
            { step: 2, title: 'Commandez ou demandez de l\'aide', desc: 'Achetez du materiel ou creez un ticket.' },
            { step: 3, title: 'Paiement en boutique', desc: 'Payez et recuperez votre materiel au point de vente.' }
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg md:text-xl font-bold mx-auto mb-3 md:mb-4">{s.step}</div>
              <h3 className="font-bold text-base md:text-lg mb-1 md:mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl md:rounded-3xl p-6 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Besoin d'aide ?</h2>
        <p className="text-gray-300 text-sm md:text-base mb-5 md:mb-6 max-w-lg mx-auto">Notre equipe est disponible pour vous assister.</p>
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
          <Link to={isAuthenticated ? '/client/tickets' : '/login'} className="bg-blue-600 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full text-sm md:text-base font-semibold hover:bg-blue-700 transition">Demander de l'aide</Link>
          <Link to="/map" className="border border-gray-500 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full text-sm md:text-base font-semibold hover:bg-white/10 transition">Notre boutique</Link>
        </div>
      </div>
    </div>
  );
}
