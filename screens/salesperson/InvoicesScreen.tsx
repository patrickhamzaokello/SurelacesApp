// src/screens/salesperson/InvoicesScreen.tsx
import React, { useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { EmptyState } from '../../components/EmptyState';
import { InvoiceCard } from '../../components/InvoiceCard';
import { useAuth } from '../../hooks/useAuth';
import { useInvoicesStore } from '../../store/invoicesStore';
import { theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (myInvoices.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Invoices</Text>
        </View>
        <EmptyState
          title="No invoices yet"
          message="Your created invoices will appear here"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView />
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Invoices</Text>
        <Text style={styles.invoiceCount}>{myInvoices.length} invoices</Text>
      </View>
      
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
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
  },
  invoiceCount: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray500,
    fontWeight: theme.typography.weights.medium,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.md,
  },
});