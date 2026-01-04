// app/(salesperson)/invoices/index.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SalespersonInvoicesScreen } from '@/screens/salesperson/InvoicesScreen';
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function InvoicesIndex() {
  return (
    <View style={styles.container}>
       <StatusBar style="dark" />
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