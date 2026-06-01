import { useEffect, useState } from 'react';

export default function MapPage() {
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => setUserPos(null)
    );
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">📍 Notre Boutique</h1>
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-1">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-xl mb-4">AM Info</h3>
            <p className="mb-2">📍 Lot II M 75 Ankadivato, Antananarivo</p>
            <p className="mb-2">📞 +261 34 00 000 00</p>
            <p className="mb-4">🕐 Lun-Ven: 8h-18h | Sam: 9h-12h</p>
            {userPos && (
              <a href={`https://www.openstreetmap.org/directions?from=${userPos[0]},${userPos[1]}&to=-18.91368,47.53613`}
                target="_blank" className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                🧭 Itinéraire vers la boutique
              </a>
            )}
          </div>
        </div>
        <div className="col-span-2 bg-white rounded-xl shadow p-4">
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=47.52,-18.92,47.55,-18.91&layer=mapnik&marker=-18.91368,47.53613"
            width="100%" height="400" className="rounded-lg"
            title="Carte AM Info"
          />
        </div>
      </div>
    </div>
  );
}
