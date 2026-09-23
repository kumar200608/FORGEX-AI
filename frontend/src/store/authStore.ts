import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthSession } from '../types';
import * as authService from '../services/authService';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrateSession: () => Promise<void>;
  _setSession: (session: AuthSession) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      _setSession: (session: AuthSession) =>
        set({ user: session.user, token: session.token, isAuthenticated: true }),

      login: async (email, password) => {
        const session = await authService.login({ email, password });
        get()._setSession(session);
      },

      signup: async (name, email, password, confirmPassword) => {
        const session = await authService.signup({ name, email, password, confirmPassword });
        get()._setSession(session);
      },

      logout: async () => {
        await authService.logout();
        set({ user: null, token: null, isAuthenticated: false });
      },

      hydrateSession: async () => {
        const { token } = get();
        if (!token || token.startsWith('mock-jwt-')) {
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }
        try {
          const user = await authService.getCurrentUser(token);
          if (user) {
            set({ user, isAuthenticated: true });
          } else {
            set({ user: null, token: null, isAuthenticated: false });
          }
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'securenotes-v2-auth',
      partialize: (s) => ({ token: s.token, user: s.user, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state && state.token && state.token.startsWith('mock-jwt-')) {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      },
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });
}
