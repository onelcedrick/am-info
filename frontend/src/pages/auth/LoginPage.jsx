// import { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { useAuth } from '../../hooks/useAuth';
// import { loginUser, googleLoginUrl } from '../../api/auth';

// export default function LoginPage() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await loginUser(email, password);
//       login(res.data.user, res.data.token);
//       if (res.data.user.role === 'admin') navigate('/admin');
//       else if (res.data.user.role === 'technician') navigate('/technician');
//       else navigate('/client');
//     } catch (err) {
//       setError('Email ou mot de passe incorrect');
//     }
//   };

//   return (
//     <div style={{ maxWidth: 400, margin: '100px auto', padding: 20 }}>
//       <h1>Connexion</h1>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//       <form onSubmit={handleSubmit}>
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//           style={{ width: '100%', padding: 10, margin: '5px 0' }}
//         />
//         <input
//           type="password"
//           placeholder="Mot de passe"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//           style={{ width: '100%', padding: 10, margin: '5px 0' }}
//         />
//         <button type="submit" style={{ width: '100%', padding: 10, margin: '10px 0' }}>
//           Se connecter
//         </button>
//       </form>
//       <a href={googleLoginUrl()} style={{ display: 'block', textAlign: 'center', margin: '10px 0' }}>
//         Se connecter avec Google
//       </a>
//       <Link to="/register">Créer un compte</Link>
//     </div>
//   );
// }



import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { loginUser, googleLoginUrl } from '../../api/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, devLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser(email, password);
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'admin') navigate('/admin');
      else if (res.data.user.role === 'technician') navigate('/technician');
      else navigate('/client');
    } catch (err) {
      setError('Backend non disponible - Utilise le mode démo');
    }
  };

  const handleDevLogin = (role) => {
    devLogin(role);
    if (role === 'admin') navigate('/admin');
    else if (role === 'technician') navigate('/technician');
    else navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">AM Info</h1>
        <p className="text-center text-gray-500 mb-6">Assistance & Maintenance Informatique</p>
        
        {error && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4 text-center text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
            Se connecter
          </button>
        </form>
        
        <div className="mt-4">
          <a href={googleLoginUrl()} className="block w-full text-center bg-white border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition">
            🔵 Se connecter avec Google
          </a>
        </div>
        
        {/* Mode développement */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500 mb-3">Mode démo (sans backend)</p>
          <div className="flex gap-2">
            <button onClick={() => handleDevLogin('client')} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 transition">
              👤 Client
            </button>
            <button onClick={() => handleDevLogin('admin')} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm hover:bg-purple-700 transition">
              ⚙️ Admin
            </button>
            <button onClick={() => handleDevLogin('technician')} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm hover:bg-teal-700 transition">
              🔧 Tech
            </button>
          </div>
        </div>
        
        <p className="text-center mt-4 text-gray-600">
          Pas encore de compte ? <Link to="/register" className="text-blue-600 hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}