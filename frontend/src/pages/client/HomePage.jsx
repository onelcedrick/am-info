import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-12 mb-8">
        <h1 className="text-4xl font-bold mb-4">Bienvenue chez AM Info</h1>
        <p className="text-xl mb-6">Vente de matériel informatique & Dépannage technique</p>
        <div className="flex gap-4">
          <Link to="/products" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-100 transition">
            Voir les produits
          </Link>
          <Link to="/login" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Espace client
          </Link>
        </div>
      </div>

      {/* Services */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-bold mb-2">🛒 Achat Matériel</h3>
          <p className="text-gray-600">Ordinateurs, écrans, imprimantes, pièces détachées...</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-bold mb-2">🔧 Dépannage</h3>
          <p className="text-gray-600">Chat en direct avec un technicien, diagnostic à distance.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-bold mb-2">📍 En boutique</h3>
          <p className="text-gray-600">Paiement sur place, retrait immédiat de votre matériel.</p>
        </div>
      </div>
    </div>
  );
}