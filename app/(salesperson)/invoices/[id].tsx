// app/(salesperson)/invoices/[id].tsx
import React from 'react';
import { InvoiceDetailsScreen } from '@/screens/shared/InvoiceDetailsScreen';
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { View,StyleSheet } from 'react-native';

export default function InvoiceDetails() {
  return   <View style={styles.container}>
        <StatusBar style="dark" />
        <InvoiceDetailsScreen />
      </View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  }
})