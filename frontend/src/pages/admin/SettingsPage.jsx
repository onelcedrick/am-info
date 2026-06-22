// -*- coding: utf-8 -*-
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useSettings } from '../../hooks/useSettings';

export default function SettingsPage() {
  const { logoUrl, loading } = useSettings();
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const uploadLogo = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.put('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Logo mis à jour !');
      setPreview(null);
      fileInputRef.current.value = '';
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-6"><p>Chargement...</p></div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Paramètres du site</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-lg mb-4">Logo</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Logo actuel :</p>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo actuel" className="h-16 w-auto object-contain border rounded-lg p-2" />
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <span className="text-xl">📦</span>
              </div>
              <span>Logo par défaut</span>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-gray-500 mb-2">Nouveau logo :</p>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            id="logo-upload" 
          />
          <label 
            htmlFor="logo-upload" 
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg cursor-pointer text-sm inline-block mb-2"
          >
            Choisir une image
          </label>
          
          {preview && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Aperçu :</p>
              <img src={preview} alt="Preview" className="h-16 w-auto object-contain border rounded-lg p-2 mb-2" />
              <button 
                onClick={uploadLogo} 
                disabled={uploading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
              >
                {uploading ? 'Upload...' : '💾 Enregistrer le logo'}
              </button>
              <button 
                onClick={() => { setPreview(null); fileInputRef.current.value = ''; }}
                className="ml-2 text-gray-500 px-3 py-2 rounded-lg text-sm hover:text-red-500"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}