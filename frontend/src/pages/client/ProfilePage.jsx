// -*- coding: utf-8 -*-
import { useState, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatarUrl(res.data.avatar_url);
      setPreview(null);
      fileInputRef.current.value = '';
    } catch (err) {
      alert('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mon profil</h1>
      
      <div className="bg-white rounded-xl shadow p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            {avatarUrl || preview ? (
              <img
                src={preview || avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-100">
                <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              id="avatar-upload"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.full_name || 'Utilisateur'}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <p className="text-sm text-gray-400 mt-1 capitalize">{user?.role}</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-bold mb-4">Photo de profil</h3>
          
          {preview && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Apercu :</p>
              <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={uploadAvatar}
                  disabled={uploading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {uploading ? 'Envoi...' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => { setPreview(null); fileInputRef.current.value = ''; }}
                  className="bg-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <label
            htmlFor="avatar-upload"
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-lg cursor-pointer transition text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Choisir une photo
          </label>
          <p className="text-xs text-gray-400 mt-2">Formats acceptes : JPG, PNG, GIF. Taille max : 5 Mo</p>
        </div>
      </div>
    </div>
  );
}
