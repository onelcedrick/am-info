import api from './axios';

export const getLogo = () => api.get('/settings/logo');
export const updateLogo = (formData) => api.put('/settings/logo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});