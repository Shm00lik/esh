import api from './axios';

// User API Calls
export const getUserStatus = () => api.get('/user/status');
export const loginUser = (username: string) => api.post('/user/login', { username });
export const sendChatMessage = (message: string) => api.post('/user/chat', { message });
export const transferCoins = (to_user_id: string, amount: number) => api.post('/user/transfer', { to_user_id, amount });
export const getAllUsers = () => api.get('/users');

// Admin API Calls
export const createQrCode = () => api.post('/admin/create_qr');
export const pinMessage = (message: string) => api.post('/admin/pin', { message });
export const removePinnedMessage = () => api.delete('/admin/pin');
export const updateUserBalance = (user_id: string, change: number) => api.post('/admin/update_balance', { user_id, change });
