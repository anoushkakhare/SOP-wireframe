import { create } from 'zustand';
import { User, LayoutManifest, LoginResponse } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  layoutManifest: LayoutManifest | null;
  isAuthenticated: boolean;
  setAuth: (data: LoginResponse) => void;
  logout: () => void;
}

const savedToken = localStorage.getItem('sop_token');
const savedUser = localStorage.getItem('sop_user');
const savedManifest = localStorage.getItem('sop_layout');

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken,
  layoutManifest: savedManifest ? JSON.parse(savedManifest) : null,
  isAuthenticated: !!savedToken,

  setAuth: (data: LoginResponse) => {
    localStorage.setItem('sop_token', data.token);
    localStorage.setItem('sop_user', JSON.stringify(data.user));
    localStorage.setItem('sop_layout', JSON.stringify(data.layoutManifest));
    set({
      user: data.user,
      token: data.token,
      layoutManifest: data.layoutManifest,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('sop_token');
    localStorage.removeItem('sop_user');
    localStorage.removeItem('sop_layout');
    set({
      user: null,
      token: null,
      layoutManifest: null,
      isAuthenticated: false,
    });
  },
}));

