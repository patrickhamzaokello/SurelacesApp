// app/(owner)/sales/_layout.tsx
import { Stack } from 'expo-router';

export default function SalesLayout() {
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
          title: 'Sales',
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