// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { IconUser, IconPlus, IconClose } from '../../components/Icons';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('technician');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    api.get('/admin/clients/').then(r => {
      // Cette route retourne tous les clients, on filtre
      // On va plutôt utiliser une nouvelle route ou adapter
    }).catch(() => {});
    
    // Pour l'instant, on utilise les clients comme liste d'utilisateurs
    api.get('/admin/clients/').then(r => setUsers(r.data || [])).finally(() => setLoading(false));
  };

  const createUser = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error('Tous les champs sont requis');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/auth/admin/create-user', {
        full_name: fullName,
        email: email,
        password: password,
        role: role
      });
      toast.success(res.data.message);
      setFullName(''); setEmail(''); setPassword(''); setRole('technician');
      setShowForm(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1">
          <IconPlus size={16} /> Créer un compte
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">Créer un compte technicien</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <IconClose size={20} />
            </button>
          </div>
          <form onSubmit={createUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom complet</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Nom du technicien" required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="technicien@aminfo.mg" required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mot de passe" required minLength={6}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rôle</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="technician">Technicien</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
              {submitting ? 'Création...' : 'Créer le compte'}
            </button>
          </form>
        </div>
      )}

      {/* Liste des utilisateurs */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Chargement...</div>
      ) : (
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-3">Nom</th>
                <th className="text-left p-3">Email</th>
                <th className="text-center p-3">Rôle</th>
                <th className="text-center p-3">Statut</th>
                <th className="text-center p-3">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{u.full_name}</td>
                  <td className="p-3 text-gray-500">{u.email}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                      u.role === 'technician' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="p-3 text-center text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Aucun utilisateur</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
