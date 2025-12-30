// src/screens/salesperson/InvoicesScreen.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useInvoicesStore } from '../../store/invoicesStore';
import { InvoiceCard } from '../../components/InvoiceCard';
import { EmptyState } from '../../components/EmptyState';

export const SalespersonInvoicesScreen = () => {
  const { user } = useAuth();
  const { invoices, isLoading, fetchInvoices } = useInvoicesStore();

  const myInvoices = invoices.filter(
    (invoice) => invoice.salespersonId === user?.id
  );

  useEffect(() => {
    fetchInvoices({ salespersonId: user?.id });
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
              // Navigate to invoice detail
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