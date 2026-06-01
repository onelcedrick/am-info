import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-blue-600">404</h1>
        <p className="text-2xl text-gray-600 mt-4">Page introuvable</p>
        <p className="text-gray-500 mt-2">La page que vous cherchez n'existe pas.</p>
        <Link to="/" className="inline-block mt-6 bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition">
          Retour a l'accueil
        </Link>
      </div>
    </div>
  );
}
