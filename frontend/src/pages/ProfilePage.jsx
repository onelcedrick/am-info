// -*- coding: utf-8 -*-
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { IconUser, IconPhoto, IconTrash, IconEdit, IconEmail, IconCheck, IconClose } from '../components/Icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_URL + url;
}

export default function ProfilePage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [savingName, setSavingName] = useState(false);
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
      const res = await api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAvatarUrl(res.data.avatar_url);
      setPreview(null);
      fileInputRef.current.value = '';
      toast.success('Photo mise à jour');
      login({ ...user, avatar_url: res.data.avatar_url }, localStorage.getItem('token'));
    } catch (err) { toast.error('Erreur upload'); }
    finally { setUploading(false); }
  };

  const saveName = async () => {
    if (!fullName.trim()) return;
    setSavingName(true);
    try {
      const res = await api.put('/auth/profile', { full_name: fullName });
      toast.success('Nom mis à jour');
      login({ ...user, full_name: fullName }, localStorage.getItem('token'));
      setEditingName(false);
    } catch (err) { toast.error('Erreur'); }
    finally { setSavingName(false); }
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/auth/account');
      toast.success('Compte supprimé');
      logout();
      navigate('/');
    } catch (err) { toast.error('Erreur suppression'); }
    setShowDeleteConfirm(false);
  };

  const avatarDisplay = getImageUrl(preview || avatarUrl);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* En-tête profil */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-24 md:h-32 bg-gradient-to-r from-blue-500 to-indigo-600" />
        
        <div className="px-4 md:px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12 md:-mt-16">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {avatarDisplay ? (
                <img src={avatarDisplay} alt="" className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-100 border-4 border-white shadow-md flex items-center justify-center">
                  <IconUser size={36} />
                </div>
              )}
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-600 text-white w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition shadow">
                <IconEdit size={13} />
              </label>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="avatar-upload" />
            </div>

            {/* Nom + email */}
            <div className="flex-1 pt-2 md:pt-0 md:pb-2">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input value={fullName} onChange={e => setFullName(e.target.value)}
                    className="text-xl md:text-2xl font-bold bg-gray-50 border rounded-lg px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
                  <button onClick={saveName} disabled={savingName} className="text-green-500 hover:text-green-600 p-1">
                    <IconCheck size={20} />
                  </button>
                  <button onClick={() => { setEditingName(false); setFullName(user?.full_name || ''); }} className="text-gray-400 hover:text-gray-600 p-1">
                    <IconClose size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-800">{user?.full_name || 'Utilisateur'}</h1>
                  <button onClick={() => setEditingName(true)} className="text-gray-400 hover:text-blue-500 transition p-1">
                    <IconEdit size={16} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-500 text-sm mt-0.5">
                <IconEmail size={14} />
                <span>{user?.email}</span>
              </div>
              <span className="inline-block mt-2 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold capitalize">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview upload */}
      {preview && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-3">Aperçu de la nouvelle photo</p>
          <div className="flex items-center gap-4">
            <img src={preview} alt="" className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl" />
            <div className="flex gap-2">
              <button onClick={uploadAvatar} disabled={uploading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition">
                {uploading ? 'Envoi...' : 'Enregistrer'}
              </button>
              <button onClick={() => { setPreview(null); fileInputRef.current.value = ''; }}
                className="bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Changer photo */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="font-bold text-sm md:text-base mb-3">Photo de profil</h2>
        <label htmlFor="avatar-upload"
          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-lg cursor-pointer transition text-sm">
          <IconPhoto size={18} />
          Choisir une photo
        </label>
      </div>

      {/* Zone dangereuse */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="font-bold text-sm md:text-base text-red-600 mb-3">Zone dangereuse</h2>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg hover:bg-red-50 transition text-sm">
            <IconTrash size={18} />
            Supprimer mon compte
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm mb-3 font-semibold">Cette action est irréversible. Toutes vos données seront supprimées.</p>
            <div className="flex flex-col md:flex-row gap-2">
              <button onClick={deleteAccount}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition">Confirmer la suppression</button>
              <button onClick={() => setShowDeleteConfirm(false)}
                className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
