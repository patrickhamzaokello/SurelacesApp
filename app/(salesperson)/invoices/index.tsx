// app/(salesperson)/invoices/index.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SalespersonInvoicesScreen } from '@/screens/salesperson/InvoicesScreen';

export default function InvoicesIndex() {
  return (
    <View style={styles.container}>
      <SalespersonInvoicesScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});