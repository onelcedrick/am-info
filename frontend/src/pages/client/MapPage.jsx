// -*- coding: utf-8 -*-
import { Link } from 'react-router-dom';
import { IconPhone, IconEmail, IconClock, IconMap } from '../../components/Icons';

export default function MapPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Notre Boutique</h1>

      {/* A propos */}
      <div className="bg-white rounded-2xl shadow p-8">
        <h2 className="text-xl font-bold mb-4">A propos d'AM Info</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Fondee en 2020, AM Info est votre partenaire de confiance en materiel informatique 
          et depannage technique a Antananarivo. Notre equipe de techniciens qualifies est 
          passionnee par l'informatique et s'engage a fournir des solutions rapides et efficaces.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center bg-blue-50 rounded-xl p-4">
            <p className="text-3xl font-bold text-blue-600">500+</p>
            <p className="text-sm text-gray-500">Clients satisfaits</p>
          </div>
          <div className="text-center bg-green-50 rounded-xl p-4">
            <p className="text-3xl font-bold text-green-600">1000+</p>
            <p className="text-sm text-gray-500">Produits vendus</p>
          </div>
          <div className="text-center bg-purple-50 rounded-xl p-4">
            <p className="text-3xl font-bold text-purple-600">200+</p>
            <p className="text-sm text-gray-500">Depannages realises</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Infos */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">Contact</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 mt-0.5"><IconMap size={20} /></span>
                <div>
                  <p className="font-semibold">Adresse</p>
                  <p className="text-gray-500">Lot II M 75 Ankadivato, Antananarivo 101</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 mt-0.5"><IconPhone size={20} /></span>
                <div>
                  <p className="font-semibold">Telephone</p>
                  <p className="text-gray-500">+261 34 00 000 00</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 mt-0.5"><IconEmail size={20} /></span>
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-gray-500">contact@aminfo.mg</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 mt-0.5"><IconClock size={20} /></span>
                <div>
                  <p className="font-semibold">Horaires d'ouverture</p>
                  <p className="text-gray-500">Lundi - Vendredi : 8h - 18h</p>
                  <p className="text-gray-500">Samedi : 9h - 12h</p>
                  <p className="text-gray-500">Dimanche : Ferme</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">Notre equipe</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { name: 'Jean Rakoto', role: 'Fondateur', color: 'bg-blue-100 text-blue-600' },
                { name: 'Marie Rasoa', role: 'Resp. technique', color: 'bg-green-100 text-green-600' },
                { name: 'Luc Andry', role: 'Technicien', color: 'bg-purple-100 text-purple-600' }
              ].map(m => (
                <div key={m.name} className="p-3">
                  <div className={`w-14 h-14 ${m.color} rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2`}>
                    {m.name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-sm">{m.name}</h3>
                  <p className="text-gray-500 text-xs">{m.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Carte */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow p-3 h-[450px]">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=47.52,-18.92,47.55,-18.91&layer=mapnik&marker=-18.91368,47.53613"
              width="100%" height="100%" className="rounded-lg"
              title="Carte AM Info"
            />
          </div>
          <a
            href="https://www.openstreetmap.org/directions?to=-18.91368,47.53613"
            target="_blank"
            className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Itineraire vers la boutique
          </a>
        </div>
      </div>
    </div>
  );
}
