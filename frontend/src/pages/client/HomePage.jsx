// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [stats, setStats] = useState({ products: 0, clients: 0, tickets: 0 });

  useEffect(() => {
    api.get('/products').then(r => setFeaturedProducts(r.data.slice(0, 4))).catch(() => {});
    api.get('/products').then(r => setStats(prev => ({ ...prev, products: r.data.length }))).catch(() => {});
  }, []);

  return (
    <div className="space-y-8 md:space-y-12 px-2 md:px-0">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl md:rounded-3xl p-6 md:p-12 lg:p-16">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4 tracking-tight">AM Info</h1>
          <p className="text-lg md:text-xl text-blue-100 mb-1 md:mb-2">Assistance & Maintenance Informatique</p>
          <p className="text-sm md:text-base text-blue-200 mb-6 md:mb-8 max-w-xl">
            Votre expert en materiel informatique et depannage technique.
          </p>
          <div className="flex gap-3 md:gap-4 flex-wrap">
            <Link to="/products"
              className="bg-white text-blue-600 px-5 md:px-8 py-2.5 md:py-3 rounded-full text-sm md:text-base font-semibold hover:bg-blue-50 transition shadow-lg">
              Voir les produits
            </Link>
            {!isAuthenticated && (
              <Link to="/register"
                className="border-2 border-white text-white px-5 md:px-8 py-2.5 md:py-3 rounded-full text-sm md:text-base font-semibold hover:bg-white/10 transition">
                Creer un compte
              </Link>
            )}
          </div>
          <div className="flex gap-4 md:gap-8 mt-6 md:mt-10">
            <div><p className="text-2xl md:text-3xl font-bold">{stats.products}+</p><p className="text-blue-200 text-xs md:text-sm">Produits</p></div>
            <div><p className="text-2xl md:text-3xl font-bold">24/7</p><p className="text-blue-200 text-xs md:text-sm">Assistance</p></div>
            <div><p className="text-2xl md:text-3xl font-bold">100%</p><p className="text-blue-200 text-xs md:text-sm">Satisfaction</p></div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">Nos Services</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {[
            { color: 'blue', title: 'Vente Materiel', desc: 'Ordinateurs, ecrans, imprimantes, pieces detachees.', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
            { color: 'green', title: 'Depannage', desc: 'Diagnostic a distance, chat en direct avec un technicien.', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
            { color: 'purple', title: 'En Boutique', desc: 'Paiement sur place, retrait immediat, conseils.', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
            { color: 'orange', title: 'Garantie', desc: 'Tous nos produits sont garantis, SAV inclus.', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
          ].map(s => (
            <div key={s.title} className="bg-white rounded-2xl shadow p-4 md:p-6 text-center hover:shadow-lg transition">
              <div className={`w-12 h-12 md:w-16 md:h-16 bg-${s.color}-100 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4`}>
                <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                </svg>
              </div>
              <h3 className="font-bold text-sm md:text-lg mb-1 md:mb-2">{s.title}</h3>
              <p className="text-gray-500 text-xs md:text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Produits en vedette */}
      {featuredProducts.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Produits populaires</h2>
            <Link to="/products" className="text-blue-600 hover:underline font-semibold text-sm md:text-base">Voir tout &rarr;</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {featuredProducts.map(p => (
              <Link key={p.id} to={`/products/${p.id}`}
                className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden group">
                <div className="h-32 md:h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {p.image_url && p.image_url.startsWith('http') ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <svg className="w-10 h-10 md:w-16 md:h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="p-3 md:p-4">
                  <h3 className="font-bold text-sm md:text-base truncate">{p.name}</h3>
                  <p className="text-blue-600 font-bold text-sm md:text-base mt-1">{(p.final_price || p.price).toLocaleString()} Ar</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Comment ca marche */}
      <div className="bg-white rounded-2xl md:rounded-3xl shadow p-6 md:p-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">Comment ca marche ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { step: 1, title: 'Creez un compte', desc: 'Inscrivez-vous gratuitement pour acceder a toutes les fonctionnalites.' },
            { step: 2, title: 'Commandez ou demandez de l\'aide', desc: 'Achetez du materiel ou creez un ticket de maintenance.' },
            { step: 3, title: 'Paiement en boutique', desc: 'Payez et recuperez votre materiel directement au point de vente.' }
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
        <p className="text-gray-300 text-sm md:text-base mb-5 md:mb-6 max-w-lg mx-auto">
          Notre equipe de techniciens est disponible pour vous assister.
        </p>
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
          <Link to={isAuthenticated ? '/client/tickets' : '/login'}
            className="bg-blue-600 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full text-sm md:text-base font-semibold hover:bg-blue-700 transition">
            Demander de l'aide
          </Link>
          <Link to="/map"
            className="border border-gray-500 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full text-sm md:text-base font-semibold hover:bg-white/10 transition">
            Notre boutique
          </Link>
        </div>
      </div>
    </div>
  );
}
