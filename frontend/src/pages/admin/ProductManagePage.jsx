// -*- coding: utf-8 -*-
import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';

export default function ProductManagePage() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('0');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = () => {
    api.get('/admin/products/').then(r => setProducts(r.data));
  };

  const toggleVisibility = async (id) => {
    await api.patch(`/admin/products/${id}/visibility`);
    loadProducts();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const addProduct = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('stock_quantity', stock);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    try {
      await api.post('/admin/products/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setName(''); setPrice(''); setCategory(''); setDescription(''); setStock('0');
      setImageFile(null); setPreview(null); setShowForm(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadProducts();
    } catch (err) {
      alert('Erreur lors de l\'ajout du produit');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestion des produits</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
          + Ajouter un produit
        </button>
      </div>

      {showForm && (
        <form onSubmit={addProduct} className="bg-white rounded-xl shadow p-6 mb-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-3">
              <input placeholder="Nom du produit" value={name} onChange={e => setName(e.target.value)} required
                className="w-full px-4 py-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Prix (Ar)" type="number" value={price} onChange={e => setPrice(e.target.value)} required
                  className="px-4 py-2 border rounded-lg" />
                <input placeholder="Stock" type="number" value={stock} onChange={e => setStock(e.target.value)}
                  className="px-4 py-2 border rounded-lg" />
              </div>
              <input placeholder="Categorie" value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg" />
              <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg" rows={3} />
            </div>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4">
              {preview ? (
                <div className="text-center">
                  <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg mb-2" />
                  <button type="button" onClick={() => { setPreview(null); setImageFile(null); }}
                    className="text-red-500 text-sm">Supprimer</button>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Photo du produit</p>
                </div>
              )}
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect}
                className="hidden" id="product-image" />
              <label htmlFor="product-image"
                className="mt-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm cursor-pointer transition">
                Choisir une image
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={uploading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition">
              {uploading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-gray-300 px-6 py-2 rounded-lg text-sm hover:bg-gray-400 transition">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 bg-white rounded-xl shadow overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-3">Photo</th>
                <th className="text-left p-3">Produit</th>
                <th className="text-left p-3">Categorie</th>
                <th className="text-right p-3">Prix</th>
                <th className="text-center p-3">Stock</th>
                <th className="text-center p-3">Visible</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-500">{p.category || '-'}</td>
                  <td className="p-3 text-right">{p.price?.toLocaleString()} Ar</td>
                  <td className="p-3 text-center">{p.stock_quantity}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggleVisibility(p.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                        p.is_visible 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}>
                      {p.is_visible ? 'Visible' : 'Masque'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
