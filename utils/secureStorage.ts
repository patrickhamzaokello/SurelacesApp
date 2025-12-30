// src/utils/secureStorage.ts
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_tokens';
const USER_KEY = 'user_data';

export const secureStorage = {
  async saveTokens(tokens: { accessToken: string; refreshToken: string; expiresAt: number }) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
      return true;
    } catch (error) {
      console.error('Error saving tokens:', error);
      return false;
    }
  },

  async getTokens(): Promise<{ accessToken: string; refreshToken: string; expiresAt: number } | null> {
    try {
      const tokens = await SecureStore.getItemAsync(TOKEN_KEY);
      return tokens ? JSON.parse(tokens) : null;
    } catch (error) {
      console.error('Error getting tokens:', error);
      return null;
    }
  },

  async deleteTokens() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      return true;
    } catch (error) {
      console.error('Error deleting tokens:', error);
      return false;
    }
  },

  async saveUser(user: any) {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Error saving user:', error);
      return false;
    }
  },

  async getUser() {
    try {
      const user = await SecureStore.getItemAsync(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  async deleteUser() {
    try {
      await SecureStore.deleteItemAsync(USER_KEY);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  },

  async clearAll() {
    await this.deleteTokens();
    await this.deleteUser();
  }
};