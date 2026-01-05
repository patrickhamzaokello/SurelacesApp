// src/store/authStore.ts
import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import { AuthTokens, User } from '../types';
import { secureStorage } from '../utils/secureStorage';
import { dbManager } from '../database/index';
import { useSyncStore } from './syncStore';

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

  login: (email: string, password: string) => Promise<User>;
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

  // src/store/authStore.ts
login: async (email: string, password: string) => {
  try {
    set({ isLoading: true, error: null });

    const response = await apiClient.login(email, password);

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
      email,
      username,
      store_id,
      store_name,
      role,
      is_verified: true, // User must be verified to login per API docs
    };

    const accessToken = tokens.access;
    const refreshToken = tokens.refresh;

    let expiresAt = decodeJwtExp(accessToken);
    if (!expiresAt) {
      expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours as per API docs
    }

    const authTokens: AuthTokens = {
      access: accessToken,
      refresh: refreshToken,
      expiresAt,
      loginTimestamp: Date.now(),
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

    // Trigger initial sync (non-blocking)
    setTimeout(() => {
      useSyncStore.getState().startInitialSync();
    }, 500);

    return user; // Return the user object
  } catch (error: any) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.error ||
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
    try {
      // 1. Clear database FIRST (most important)
      await dbManager.clearAllData();

      // 2. Clear secure storage (tokens, user data)
      await secureStorage.clearAll();

      // 3. Reset store state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still reset state even if clearing fails
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  loadStoredAuth: async () => {
    try {
      set({ isLoading: true });

      const [tokens, user] = await Promise.all([
        secureStorage.getTokens(),
        secureStorage.getUser(),
      ]);

      if (tokens && user && tokens.loginTimestamp) {
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const isWithinSevenDays = Date.now() - tokens.loginTimestamp < sevenDays;

        if (isWithinSevenDays) {
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // 7 days expired → clear everything
          await secureStorage.clearAll();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        // Missing tokens or user → clear everything
        await secureStorage.clearAll();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
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