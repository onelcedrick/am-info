// -*- coding: utf-8 -*-
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { SkeletonRow, EmptyState } from '../../components/Skeleton';

export default function ProductManagePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('0');
  const [isCable, setIsCable] = useState(false);
  const [cableLength, setCableLength] = useState('1');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editCatId, setEditCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/admin/products/').then(r => setProducts(r.data)),
      api.get('/admin/categories/').then(r => setCategories(r.data))
    ]).finally(() => setLoading(false));
  }, []);

  const loadProducts = () => api.get('/admin/products/').then(r => setProducts(r.data));
  const loadCategories = () => api.get('/admin/categories/').then(r => setCategories(r.data));

  const resetForm = () => {
    setName(''); setPrice(''); setCategory(''); setDescription(''); setStock('0');
    setCableLength('1'); setIsCable(false); setImageFile(null); setPreview(null);
    setEditId(null); setShowForm(false);
  };

  const handleEdit = (product) => {
    setEditId(product.id); setName(product.name); setPrice(product.price);
    setCategory(product.category || ''); setDescription(product.description || '');
    setStock(product.stock_quantity); setImageFile(null); setPreview(product.image_url);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce produit ?')) return;
    await api.delete(`/admin/products/${id}`);
    toast.success('Produit supprime');
    loadProducts();
  };

  const handleRestock = async (id, qty) => {
    const newQty = prompt('Nouvelle quantite :', qty);
    if (newQty === null) return;
    await api.patch(`/admin/products/${id}/stock?quantity=${parseInt(newQty)}`);
    toast.success('Stock mis a jour');
    loadProducts();
  };

  const toggleVisibility = async (id) => { await api.patch(`/admin/products/${id}/visibility`); loadProducts(); };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    let productName = name;
    let productDesc = description;
    let productPrice = parseFloat(price);
    if (isCable) { const l = parseFloat(cableLength)||1; productName = `${name} - ${l}m`; productDesc = `${description}\nLongueur: ${l}m`; productPrice *= l; }
    try {
      if (editId) {
        await api.put(`/admin/products/${editId}`, { name: productName, price: productPrice, category, description: productDesc, stock_quantity: parseInt(stock) });
        toast.success('Produit modifie');
      } else {
        const fd = new FormData();
        fd.append('name', productName); fd.append('price', productPrice); fd.append('category', category);
        fd.append('description', productDesc); fd.append('stock_quantity', stock);
        if (imageFile) fd.append('image', imageFile);
        await api.post('/admin/products/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Produit ajoute');
      }
      resetForm(); loadProducts();
    } catch (err) { toast.error('Erreur'); }
    finally { setUploading(false); }
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    await api.post('/admin/categories/', { name: newCategory });
    setNewCategory(''); loadCategories();
  };

  const updateCategory = async (id) => { await api.put(`/admin/categories/${id}`, { name: editCatName }); setEditCatId(null); loadCategories(); };
  const deleteCategory = async (id) => { if (!confirm('Supprimer ?')) return; await api.delete(`/admin/categories/${id}`); loadCategories(); };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Gestion des produits</h1>
        </div>
        <SkeletonRow cols={6} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestion des produits</h1>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
          {showForm ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-4">
          <h3 className="font-bold mb-3">{editId ? 'Modifier' : 'Nouveau produit'}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <input placeholder="Nom" value={name} onChange={e => setName(e.target.value)} required className="flex-1 px-4 py-2 border rounded-lg" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isCable} onChange={e => setIsCable(e.target.checked)} /> Cable</label>
              </div>
              {isCable && (
                <div className="flex items-center gap-2 bg-yellow-50 p-3 rounded-lg">
                  <span className="text-sm">Longueur:</span>
                  <input type="number" value={cableLength} onChange={e => setCableLength(e.target.value)} min="0.5" step="0.5" className="w-20 px-3 py-1 border rounded" />
                  <span className="text-sm">m</span>
                  <span className="text-sm ml-auto">Total: {(parseFloat(price)*parseFloat(cableLength||1)).toLocaleString()} Ar</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Prix (Ar)" type="number" value={price} onChange={e => setPrice(e.target.value)} required className="px-4 py-2 border rounded-lg" />
                <input placeholder="Stock" type="number" value={stock} onChange={e => setStock(e.target.value)} className="px-4 py-2 border rounded-lg" />
              </div>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                <option value="">Choisir categorie</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border rounded-lg" rows={2} />
            </div>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4">
              {preview ? (
                <div className="text-center"><img src={preview} alt="" className="w-full h-40 object-cover rounded-lg mb-2" /><button type="button" onClick={() => { setPreview(null); setImageFile(null); }} className="text-red-500 text-sm">Supprimer</button></div>
              ) : (
                <div className="text-center text-gray-400"><svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p className="text-sm">Photo</p></div>
              )}
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="product-image" />
              <label htmlFor="product-image" className="mt-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm cursor-pointer">Choisir</label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={uploading} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm disabled:opacity-50">{uploading ? '...' : editId ? 'Modifier' : 'Enregistrer'}</button>
            <button type="button" onClick={resetForm} className="bg-gray-300 px-6 py-2 rounded-lg text-sm">Annuler</button>
          </div>
        </form>
      )}

      {/* Categories */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h3 className="font-bold text-sm mb-3">Categories</h3>
        <div className="flex gap-2 mb-3">
          <input placeholder="Nouvelle categorie" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
          <button onClick={addCategory} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">Ajouter</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <div key={c.id} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
              {editCatId === c.id ? (
                <><input value={editCatName} onChange={e => setEditCatName(e.target.value)} className="w-24 px-2 py-0.5 text-xs border rounded" /><button onClick={() => updateCategory(c.id)} className="text-green-600 text-xs">OK</button></>
              ) : (
                <><span className="text-sm">{c.name}</span><button onClick={() => { setEditCatId(c.id); setEditCatName(c.name); }} className="text-blue-500 text-xs ml-1">Modifier</button><button onClick={() => deleteCategory(c.id)} className="text-red-500 text-xs ml-1">&times;</button></>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tableau */}
      {products.length === 0 ? (
        <EmptyState icon="📦" title="Aucun produit" description="Ajoutez votre premier produit." />
      ) : (
        <div className="flex-1 bg-white rounded-xl shadow overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr><th className="text-left p-3">Photo</th><th className="text-left p-3">Produit</th><th className="text-left p-3">Categorie</th><th className="text-right p-3">Prix</th><th className="text-center p-3">Stock</th><th className="text-center p-3">Visible</th><th className="text-center p-3">Actions</th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className={`border-t hover:bg-gray-50 ${p.stock_quantity === 0 ? 'bg-red-50' : ''}`}>
                    <td className="p-3">{p.image_url ? <img src={p.image_url} alt="" className="w-10 h-10 object-cover rounded" /> : <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">-</div>}</td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-gray-500">{p.category || '-'}</td>
                    <td className="p-3 text-right">{p.price?.toLocaleString()} Ar</td>
                    <td className="p-3 text-center"><button onClick={() => handleRestock(p.id, p.stock_quantity)} className={`font-bold cursor-pointer hover:underline ${p.stock_quantity === 0 ? 'text-red-600' : ''}`}>{p.stock_quantity}</button></td>
                    <td className="p-3 text-center"><button onClick={() => toggleVisibility(p.id)} className={`px-3 py-1 rounded-full text-xs font-semibold ${p.is_visible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.is_visible ? 'Visible' : 'Masque'}</button></td>
                    <td className="p-3 text-center"><div className="flex justify-center gap-2"><button onClick={() => handleEdit(p)} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200">Modifier</button><button onClick={() => handleDelete(p.id)} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200">Supprimer</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
