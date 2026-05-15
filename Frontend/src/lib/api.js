const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la petición');
  return data;
};

export default api;