// app/(salesperson)/invoice-details.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { InvoiceDetailsScreen } from '@/screens/shared/InvoiceDetailsScreen';

export default function SalespersonInvoiceDetails() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Invoice Details',
          headerShown: false, // We handle our own header in the screen
        }} 
      />
      <InvoiceDetailsScreen />
    </>
  );
}