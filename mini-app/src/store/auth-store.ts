import { create } from 'zustand';
import { TelegramAuth } from '../lib/telegram-auth';

interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  role: 'ADMIN' | 'USER';
  onboardingCompleted: boolean;
  createdAt: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  authenticate: () => Promise<void>;
  setUser: (user: User) => void;
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

  setUser: (user: User) => {
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    TelegramAuth.clearToken();
    set({ isAuthenticated: false, user: null });
  },
}));
