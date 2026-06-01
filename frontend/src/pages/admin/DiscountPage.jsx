// -*- coding: utf-8 -*-
import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function DiscountPage() {
  const [discounts, setDiscounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [targetType, setTargetType] = useState('global');
  const [targetId, setTargetId] = useState('');

  useEffect(() => { loadDiscounts(); loadCategories(); }, []);

  const loadDiscounts = () => api.get('/admin/discounts').then(r => setDiscounts(r.data));
  const loadCategories = () => api.get('/admin/categories/').then(r => setCategories(r.data));

  const createDiscount = async (e) => {
    e.preventDefault();
    await api.post('/admin/discounts', {
      name, discount_type: type, value: parseFloat(value),
      target_type: targetType,
      target_id: targetId || null
    });
    setName(''); setValue(''); setTargetId(''); setShowForm(false);
    loadDiscounts();
  };

  const toggleDiscount = async (id) => {
    await api.patch(`/admin/discounts/${id}/toggle`);
    loadDiscounts();
  };

  const deleteDiscount = async (id) => {
    if (!confirm('Supprimer cette promotion ?')) return;
    await api.delete(`/admin/discounts/${id}`);
    loadDiscounts();
  };

  const getTargetLabel = (discount) => {
    if (discount.target_type === 'global') return 'Tous les produits';
    if (discount.target_type === 'category') {
      const cat = categories.find(c => c.name === discount.target_id);
      return cat ? `Categorie: ${cat.name}` : discount.target_id;
    }
    return discount.target_id;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
          + Nouvelle promotion
        </button>
      </div>

      {showForm && (
        <form onSubmit={createDiscount} className="bg-white rounded-xl shadow p-6 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Nom de la promotion" value={name} onChange={e => setName(e.target.value)} required
              className="px-4 py-2 border rounded-lg" />
            
            <select value={type} onChange={e => setType(e.target.value)}
              className="px-4 py-2 border rounded-lg">
              <option value="percentage">Pourcentage (%)</option>
              <option value="fixed_amount">Montant fixe (Ar)</option>
            </select>
            
            <input placeholder={type === 'percentage' ? 'Valeur en % (ex: 15)' : 'Montant en Ar (ex: 5000)'} 
              type="number" value={value} onChange={e => setValue(e.target.value)} required
              className="px-4 py-2 border rounded-lg" />
            
            <select value={targetType} onChange={e => { setTargetType(e.target.value); setTargetId(''); }}
              className="px-4 py-2 border rounded-lg">
              <option value="global">Tous les produits</option>
              <option value="category">Par categorie</option>
              <option value="product">Produit specifique (ID)</option>
            </select>

            {targetType === 'category' && (
              <select value={targetId} onChange={e => setTargetId(e.target.value)} required
                className="px-4 py-2 border rounded-lg">
                <option value="">Choisir une categorie</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            )}

            {targetType === 'product' && (
              <input placeholder="ID du produit" value={targetId} onChange={e => setTargetId(e.target.value)} required
                className="px-4 py-2 border rounded-lg" />
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm">Creer</button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-gray-300 px-6 py-2 rounded-lg text-sm">Annuler</button>
          </div>
        </form>
      )}

      <div className="flex-1 bg-white rounded-xl shadow overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-3">Nom</th>
                <th className="text-center p-3">Type</th>
                <th className="text-center p-3">Valeur</th>
                <th className="text-center p-3">Cible</th>
                <th className="text-center p-3">Active</th>
                <th className="text-center p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map(d => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{d.name}</td>
                  <td className="p-3 text-center">
                    {d.discount_type === 'percentage' ? '% Pourcentage' : 'Ar Fixe'}
                  </td>
                  <td className="p-3 text-center font-bold">
                    {d.discount_type === 'percentage' ? `${d.value}%` : `${d.value} Ar`}
                  </td>
                  <td className="p-3 text-center text-gray-500">{getTargetLabel(d)}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggleDiscount(d.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                        d.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}>
                      {d.is_active ? 'Oui' : 'Non'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => deleteDiscount(d.id)}
                      className="text-red-500 hover:text-red-700 text-sm">Supprimer</button>
                  </td>
                </tr>
              ))}
              {discounts.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-gray-400">Aucune promotion</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
