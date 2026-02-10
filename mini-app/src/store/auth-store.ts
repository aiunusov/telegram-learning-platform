import { create } from 'zustand';
import { TelegramAuth } from '../lib/telegram-auth';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  isLoading: boolean;
  error: string | null;
  authenticate: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: TelegramAuth.isAuthenticated(),
  user: TelegramAuth.getUser(),
  isLoading: false,
  error: null,

  authenticate: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await TelegramAuth.authenticate();
      set({
        isAuthenticated: true,
        user: data.user,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isAuthenticated: false,
        error: error.message,
        isLoading: false,
      });
    }
  },

  logout: () => {
    TelegramAuth.clearToken();
    set({ isAuthenticated: false, user: null });
  },
}));
