import { api } from './ApiService';
export const registerUser = async (email: string, password: string) => {
  const res = await api.post('/auth/register', { email, password });
  return res.data;
};