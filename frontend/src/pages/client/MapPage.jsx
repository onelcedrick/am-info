// -*- coding: utf-8 -*-
import { Link } from 'react-router-dom';
import { IconPhone, IconEmail, IconClock, IconMap, IconPackage } from '../../components/Icons';

export default function MapPage() {
  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto">
      <h1 className="text-xl md:text-3xl font-bold">Notre Boutique</h1>

      {/* A propos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-8">
        <h2 className="text-lg md:text-xl font-bold mb-3">À propos d'AM Info</h2>
        <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4">
          Fondée en 2020, AM Info est votre partenaire de confiance en matériel informatique 
          et dépannage technique à Antananarivo. Notre équipe de techniciens qualifiés est 
          passionnée par l'informatique et s'engage à fournir des solutions rapides et efficaces.
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center bg-blue-50 rounded-xl p-3 md:p-4">
            <p className="text-xl md:text-3xl font-bold text-blue-600">500+</p>
            <p className="text-[10px] md:text-sm text-gray-500">Clients satisfaits</p>
          </div>
          <div className="text-center bg-green-50 rounded-xl p-3 md:p-4">
            <p className="text-xl md:text-3xl font-bold text-green-600">1000+</p>
            <p className="text-[10px] md:text-sm text-gray-500">Produits vendus</p>
          </div>
          <div className="text-center bg-purple-50 rounded-xl p-3 md:p-4">
            <p className="text-xl md:text-3xl font-bold text-purple-600">200+</p>
            <p className="text-[10px] md:text-sm text-gray-500">Dépannages réalisés</p>
          </div>
        </div>
      </div>

      {/* Desktop : 2 colonnes */}
      <div className="hidden md:grid md:grid-cols-2 gap-8">
        {/* Infos */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
                  <p className="font-semibold">Téléphone</p>
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
                  <p className="text-gray-500">Dimanche : Fermé</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-4">Notre équipe</h2>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 h-[450px]">
            <iframe src="https://www.openstreetmap.org/export/embed.html?bbox=47.52,-18.92,47.55,-18.91&layer=mapnik&marker=-18.91368,47.53613"
              width="100%" height="100%" className="rounded-lg" title="Carte AM Info" />
          </div>
          <a href="https://www.openstreetmap.org/directions?to=-18.91368,47.53613" target="_blank"
            className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
            Itinéraire vers la boutique
          </a>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-4">
        {/* Contact en carte */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold text-sm flex items-center gap-2"><IconPhone size={16} /> Contact</h2>
          </div>
          <div className="divide-y">
            <div className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <IconMap size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm">Adresse</p>
                <p className="text-gray-500 text-xs">Lot II M 75 Ankadivato, Antananarivo 101</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <IconPhone size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm">Téléphone</p>
                <p className="text-gray-500 text-xs">+261 34 00 000 00</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <IconEmail size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm">Email</p>
                <p className="text-gray-500 text-xs">contact@aminfo.mg</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <IconClock size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm">Horaires</p>
                <p className="text-gray-500 text-xs">Lun-Ven: 8h-18h | Sam: 9h-12h</p>
                <p className="text-gray-400 text-xs">Dimanche: Fermé</p>
              </div>
            </div>
          </div>
        </div>

        {/* Carte */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 h-64">
          <iframe src="https://www.openstreetmap.org/export/embed.html?bbox=47.52,-18.92,47.55,-18.91&layer=mapnik&marker=-18.91368,47.53613"
            width="100%" height="100%" className="rounded-lg" title="Carte AM Info" />
        </div>
        <a href="https://www.openstreetmap.org/directions?to=-18.91368,47.53613" target="_blank"
          className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition text-sm">
          Itinéraire vers la boutique
        </a>

        {/* Équipe compacte */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-bold text-sm mb-3">Notre équipe</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[
              { name: 'Jean Rakoto', role: 'Fondateur', color: 'bg-blue-100 text-blue-600' },
              { name: 'Marie Rasoa', role: 'Resp. technique', color: 'bg-green-100 text-green-600' },
              { name: 'Luc Andry', role: 'Technicien', color: 'bg-purple-100 text-purple-600' }
            ].map(m => (
              <div key={m.name} className="flex-shrink-0 text-center w-24">
                <div className={`w-12 h-12 ${m.color} rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-1`}>
                  {m.name.charAt(0)}
                </div>
                <h3 className="font-bold text-xs">{m.name}</h3>
                <p className="text-gray-500 text-[10px]">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
