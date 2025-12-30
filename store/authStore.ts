// src/store/authStore.ts
import { create } from 'zustand';
import { User, AuthTokens } from '../types';
import { secureStorage } from '../utils/secureStorage';
import { apiClient } from '../api/apiClient';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.login(email, password);
      const { user, accessToken, refreshToken, expiresIn } = response;

      const expiresAt = Date.now() + expiresIn * 1000;

      await secureStorage.saveTokens({
        accessToken,
        refreshToken,
        expiresAt,
      });

      await secureStorage.saveUser(user);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: async () => {
    await secureStorage.clearAll();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  loadStoredAuth: async () => {
    try {
      set({ isLoading: true });

      const [tokens, user] = await Promise.all([
        secureStorage.getTokens(),
        secureStorage.getUser(),
      ]);

      if (tokens && user && tokens.expiresAt > Date.now()) {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        await secureStorage.clearAll();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user: User) => {
    set({ user });
  },

  clearError: () => {
    set({ error: null });
  },
}));