// src/screens/salesperson/InvoicesScreen.tsx
import React, { useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { EmptyState } from '../../components/EmptyState';
import { InvoiceCard } from '../../components/InvoiceCard';
import { useAuth } from '../../hooks/useAuth';
import { useInvoicesStore } from '../../store/invoicesStore';

export const SalespersonInvoicesScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { invoices, isLoading, fetchInvoices, loadLocalInvoices } = useInvoicesStore();

  const myInvoices = invoices.filter(
    (invoice) => invoice.salesperson === user?.user_id
  );
  
  useEffect(() => {
    // Load local invoices first (instant)
    loadLocalInvoices();
    
    // Then try to fetch from server (will merge with local)
    fetchInvoices({ salespersonId: user?.user_id });
  }, []);

  if (isLoading && invoices.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (myInvoices.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No invoices yet"
        message="Your created invoices will appear here"
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={myInvoices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InvoiceCard
            invoice={item}
            onPress={() => {
              router.push(`/(salesperson)/invoices/${item.id}`);
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
});