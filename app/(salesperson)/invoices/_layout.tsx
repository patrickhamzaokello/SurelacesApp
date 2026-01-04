// app/(salesperson)/invoices/_layout.tsx
import { Stack } from 'expo-router';

export default function InvoicesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Invoices',
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Invoice Details',
          presentation: 'card',
        }} 
      />
    </Stack>
  );
}