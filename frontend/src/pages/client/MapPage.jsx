// -*- coding: utf-8 -*-

export default function MapPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Notre Boutique</h1>

      <div className="grid grid-cols-2 gap-8">
        {/* Infos */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">Informations</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="font-semibold">Adresse</p>
                  <p className="text-gray-500">Lot II M 75 Ankadivato, Antananarivo 101</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📞</span>
                <div>
                  <p className="font-semibold">Telephone</p>
                  <p className="text-gray-500">+261 34 00 000 00</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-gray-500">contact@aminfo.mg</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🕐</span>
                <div>
                  <p className="font-semibold">Horaires d'ouverture</p>
                  <p className="text-gray-500">Lundi - Vendredi : 8h - 18h</p>
                  <p className="text-gray-500">Samedi : 9h - 12h</p>
                  <p className="text-gray-500">Dimanche : Ferme</p>
                </div>
              </div>
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
