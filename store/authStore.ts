// src/store/authStore.ts
import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import { AuthTokens, User } from '../types'; // Assuming you moved AuthTokens to types.ts or keep it here
import { secureStorage } from '../utils/secureStorage';

// Simple JWT decode (only for exp claim, no verification)
const decodeJwtExp = (token: string): number | null => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.exp ? decoded.exp * 1000 : null; // exp is in seconds
  } catch {
    return null;
  }
};

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

      // Destructure user fields directly from root
      const {
        user_id,
        name,
        username,
        store_id,
        store_name,
        role,
        tokens,
      } = response;

      const user: User = {
        user_id,
        name,
        email, // email was sent in request, but also returned — use returned one if preferred
        username,
        store_id,
        store_name,
        role,
      };

      const accessToken = tokens.access;
      const refreshToken = tokens.refresh;

      // Try to get expiration from access token, fallback to 4 minutes if unable to decode
      let expiresAt = decodeJwtExp(accessToken);
      if (!expiresAt) {
        console.warn('Could not decode JWT exp, using fallback expiration (4 minutes)');
        expiresAt = Date.now() + 60 * 4 * 1000; // 4 fallback
      }

      const authTokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresAt,
      };

      await Promise.all([
        secureStorage.saveTokens(authTokens),
        secureStorage.saveUser(user),
      ]);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please try again.';

      set({
        error: message,
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
        // Expired or missing → clear everything
        await secureStorage.clearAll();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      await secureStorage.clearAll();
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