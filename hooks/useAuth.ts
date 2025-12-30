// src/hooks/useAuth.ts
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, error, login, logout, loadStoredAuth, clearError } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    loadStoredAuth,
    clearError,
    isSalesperson: user?.role === 'salesperson',
    isOwner: user?.role === 'owner',
  };
};