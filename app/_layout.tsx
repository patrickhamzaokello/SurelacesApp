// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useProductsStore } from '@/store/productsStore';
import { useCartStore } from '@/store/cartStore';
import { useSyncStore } from '@/store/syncStore';
import { dbManager } from '@/database';

export default function RootLayout() {
  const { loadStoredAuth } = useAuthStore();
  const { loadProductsFromDB } = useProductsStore();
  const { loadCartFromDB } = useCartStore();
  const { initNetworkListener } = useSyncStore();

  useEffect(() => {
    async function initialize() {
      try {
        // 1. Initialize database FIRST
        console.log('Initializing database...');
        await dbManager.initialize();

        // 2. Restore authentication
        await loadStoredAuth();

        // 3. Load data from SQLite
        await Promise.all([loadProductsFromDB(), loadCartFromDB()]);

        // 4. Initialize network listener for auto-sync
        initNetworkListener();

        console.log('App initialization completed');
      } catch (error) {
        console.error('App initialization failed:', error);
      }
    }

    initialize();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(salesperson)" />
        <Stack.Screen name="(owner)" />
      </Stack>
    </SafeAreaProvider>
  );
}