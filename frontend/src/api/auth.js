import api from './axios';

export const loginUser = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const registerUser = (full_name, email, password) => {
  return api.post('/auth/register', { full_name, email, password });
};

export const getMe = () => {
  return api.get('/auth/me');
};

export const googleLoginUrl = () => {
  return 'http://localhost:8000/auth/google/login';
};
