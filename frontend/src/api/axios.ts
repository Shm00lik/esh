import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.50.161:8000',
});

api.interceptors.request.use((config) => {
  const userKey = localStorage.getItem('user_key');
  if (userKey) {
    config.headers['X-User-Key'] = userKey;
  }
  return config;
});

export default api;
