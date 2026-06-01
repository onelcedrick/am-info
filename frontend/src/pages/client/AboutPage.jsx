// -*- coding: utf-8 -*-
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-4">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">A propos d'AM Info</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Votre partenaire de confiance en materiel informatique et depannage technique a Madagascar.
        </p>
      </div>

      {/* Notre histoire */}
      <div className="bg-white rounded-2xl shadow p-8">
        <h2 className="text-2xl font-bold mb-4">Notre histoire</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Fondee en 2020, AM Info est nee de la volonte d'offrir un service de qualite en matiere de 
          vente de materiel informatique et d'assistance technique a Antananarivo et ses environs.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Notre equipe de techniciens qualifies est passionnee par l'informatique et s'engage a fournir 
          des solutions rapides et efficaces a tous vos problemes techniques.
        </p>
      </div>

      {/* Nos valeurs */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { title: 'Qualite', desc: 'Nous selectionnons les meilleurs produits pour nos clients.', icon: '★' },
          { title: 'Rapidite', desc: 'Diagnostic et depannage en temps reel via notre plateforme.', icon: '⚡' },
          { title: 'Proximite', desc: 'Une equipe a votre ecoute, disponible en boutique et en ligne.', icon: '❤' }
        ].map(v => (
          <div key={v.title} className="bg-white rounded-2xl shadow p-6 text-center">
            <div className="text-4xl mb-3">{v.icon}</div>
            <h3 className="font-bold text-lg mb-2">{v.title}</h3>
            <p className="text-gray-500 text-sm">{v.desc}</p>
          </div>
        ))}
      </div>

      {/* Chiffres cles */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-8">
        <div className="grid grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl font-bold">500+</p>
            <p className="text-blue-200 text-sm mt-1">Clients satisfaits</p>
          </div>
          <div>
            <p className="text-4xl font-bold">1000+</p>
            <p className="text-blue-200 text-sm mt-1">Produits vendus</p>
          </div>
          <div>
            <p className="text-4xl font-bold">200+</p>
            <p className="text-blue-200 text-sm mt-1">Depannages realises</p>
          </div>
          <div>
            <p className="text-4xl font-bold">24/7</p>
            <p className="text-blue-200 text-sm mt-1">Support en ligne</p>
          </div>
        </div>
      </div>

      {/* Equipe */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-6">Notre equipe</h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { name: 'Jean Rakoto', role: 'Fondateur & Directeur', color: 'bg-blue-100 text-blue-600' },
            { name: 'Marie Rasoa', role: 'Responsable technique', color: 'bg-green-100 text-green-600' },
            { name: 'Luc Andry', role: 'Technicien senior', color: 'bg-purple-100 text-purple-600' }
          ].map(m => (
            <div key={m.name} className="bg-white rounded-2xl shadow p-6 text-center">
              <div className={`w-20 h-20 ${m.color} rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4`}>
                {m.name.charAt(0)}
              </div>
              <h3 className="font-bold">{m.name}</h3>
              <p className="text-gray-500 text-sm">{m.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-gray-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-3">Pret a nous rejoindre ?</h2>
        <p className="text-gray-500 mb-6">Creez votre compte et commencez a profiter de nos services.</p>
        <div className="flex gap-4 justify-center">
          <Link to="/register" className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition">Creer un compte</Link>
          <Link to="/products" className="border border-blue-600 text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition">Voir les produits</Link>
        </div>
      </div>
    </div>
  );
}
