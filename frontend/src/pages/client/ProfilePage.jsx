// -*- coding: utf-8 -*-
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { IconUser, IconPhoto, IconTrash, IconEdit } from '../../components/Icons';

export default function ProfilePage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
      toast.success('Photo de profil mise a jour');
      // Mettre a jour l'utilisateur dans le contexte
      login({ ...user, avatar_url: res.data.avatar_url }, localStorage.getItem('token'));
    } catch (err) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/auth/account');
      toast.success('Compte supprime definitivement');
      logout();
      navigate('/');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mon Profil</h1>
      
      <div className="bg-white rounded-2xl shadow p-8">
        {/* Avatar */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            {avatarUrl || preview ? (
              <img
                src={preview || avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-100">
                <IconUser size={40} />
              </div>
            )}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="avatar-upload" />
            <label htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition shadow">
              <IconEdit size={14} />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.full_name || 'Utilisateur'}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold capitalize">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Upload photo */}
        {preview && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500 mb-2">Apercu :</p>
            <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
            <div className="flex gap-2 mt-3">
              <button onClick={uploadAvatar} disabled={uploading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {uploading ? 'Envoi...' : 'Enregistrer la photo'}
              </button>
              <button onClick={() => { setPreview(null); fileInputRef.current.value = ''; }}
                className="bg-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-300">Annuler</button>
            </div>
          </div>
        )}

        {/* Changer photo */}
        <div className="border-t pt-6 mb-6">
          <h3 className="font-bold mb-3">Photo de profil</h3>
          <label htmlFor="avatar-upload"
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-lg cursor-pointer transition text-sm">
            <IconPhoto size={18} />
            Choisir une photo
          </label>
        </div>

        {/* Supprimer le compte */}
        <div className="border-t pt-6">
          <h3 className="font-bold text-red-600 mb-3">Zone dangereuse</h3>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 border border-red-300 text-red-600 px-5 py-2.5 rounded-lg hover:bg-red-50 transition text-sm">
              <IconTrash size={18} />
              Supprimer mon compte
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm mb-3 font-semibold">
                Cette action est irreversible. Toutes vos donnees seront supprimees.
              </p>
              <div className="flex gap-2">
                <button onClick={deleteAccount}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">
                  Confirmer la suppression
                </button>
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
