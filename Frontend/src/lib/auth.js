import api from './api';

export const login = async (email, password) => {
  const data = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
};

export const register = async (nombre, email, password) => {
  const data = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nombre, email, password }),
  });
  return data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getSession = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAdmin = () => {
  const user = getSession();
  return user?.rol === 'admin';
};