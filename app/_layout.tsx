// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useInvoicesStore } from '@/store/invoicesStore';

export default function RootLayout() {
  const { loadStoredAuth } = useAuthStore();
  const { loadLocalInvoices } = useInvoicesStore();

  useEffect(() => {
    loadStoredAuth();
    loadLocalInvoices();
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