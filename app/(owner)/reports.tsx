// app/(salesperson)/home.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTodayStats } from '@/hooks/useTodayStats';
import { useSync } from '@/hooks/useSync';
import { SyncIndicator } from '@/components/SyncIndicator';
import { InvoiceCard } from '@/components/InvoiceCard';
import { EmptyState } from '@/components/EmptyState';
import { CartScreen } from '@/screens/salesperson/CartScreen';
import { ProfileScreen } from '@/screens/shared/ProfileScreen';
import { OwnerSalesScreen } from '@/screens/owner/SalesScreen';
import { OwnerReportsScreen } from '@/screens/owner/ReportsScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from "expo-status-bar";


export default function ReportsMain() {
  return (
    <View style={styles.container}>
       <StatusBar style="dark" />
      <OwnerReportsScreen />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  }
})