import { create } from 'zustand';
import { User, LayoutManifest, LoginResponse } from '../types';

// ── Store version: bump this whenever the shape of persisted auth data changes.
// On mismatch the stored token/user/layout are cleared so a fresh login is forced.
const STORE_VERSION = 3;
const VERSION_KEY = 'sop_store_version';

function loadPersistedAuth() {
  const storedVersion = Number(localStorage.getItem(VERSION_KEY) || '0');
  if (storedVersion !== STORE_VERSION) {
    // Stale state from before a restyle/rename – clear everything
    localStorage.removeItem('sop_token');
    localStorage.removeItem('sop_user');
    localStorage.removeItem('sop_layout');
    localStorage.setItem(VERSION_KEY, String(STORE_VERSION));
    return { token: null, user: null, layoutManifest: null };
  }
  const savedToken = localStorage.getItem('sop_token');
  const savedUser = localStorage.getItem('sop_user');
  const savedManifest = localStorage.getItem('sop_layout');
  return {
    token: savedToken,
    user: savedUser ? (JSON.parse(savedUser) as User) : null,
    layoutManifest: savedManifest ? (JSON.parse(savedManifest) as LayoutManifest) : null,
  };
}

const persisted = loadPersistedAuth();

interface AuthState {
  user: User | null;
  token: string | null;
  layoutManifest: LayoutManifest | null;
  isAuthenticated: boolean;
  setAuth: (data: LoginResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: persisted.user,
  token: persisted.token,
  layoutManifest: persisted.layoutManifest,
  isAuthenticated: !!persisted.token,

  setAuth: (data: LoginResponse) => {
    localStorage.setItem(VERSION_KEY, String(STORE_VERSION));
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
    localStorage.setItem(VERSION_KEY, String(STORE_VERSION));
    set({
      user: null,
      token: null,
      layoutManifest: null,
      isAuthenticated: false,
    });
  },
}));

