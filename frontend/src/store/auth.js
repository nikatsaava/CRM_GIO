import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('tale_token') || null,
  user: JSON.parse(localStorage.getItem('tale_user') || 'null'),

  setAuth: (token, user) => {
    localStorage.setItem('tale_token', token);
    localStorage.setItem('tale_user', JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('tale_token');
    localStorage.removeItem('tale_user');
    set({ token: null, user: null });
  },
}));