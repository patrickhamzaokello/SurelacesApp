// src/screens/owner/SalesScreen.tsx
import { isToday } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { InvoiceCard } from '../../components/InvoiceCard';
import { useInvoicesStore } from '../../store/invoicesStore';
import { theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterType = 'all' | 'today';

export const OwnerSalesScreen = () => {
  const router = useRouter();
  const { invoices, isLoading, fetchInvoices, loadInvoicesFromDB } = useInvoicesStore();
  const [filter, setFilter] = useState<FilterType>('today');

  useEffect(() => {
    const loadInvoices = async () => {
      // Load from SQLite database first (instant, offline-ready)
      await loadInvoicesFromDB();

      // Then try to fetch from server
      try {
        await fetchInvoices();
      } catch (error) {
        console.error('Failed to fetch invoices from server:', error);
      }
    };

    loadInvoices();
  }, []);

  const filteredInvoices = filter === 'today'
    ? invoices.filter(inv => isToday(new Date(inv.created_at)))
    : invoices;

  if (isLoading && invoices.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading sales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
       <SafeAreaView />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sales</Text>
        <Text style={styles.subtitle}>Invoice history and transactions</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'today' && styles.filterButtonActive]}
          onPress={() => setFilter('today')}
        >
          <Text
            style={[styles.filterText, filter === 'today' && styles.filterTextActive]}
          >
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[styles.filterText, filter === 'all' && styles.filterTextActive]}
          >
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          title="No sales found"
          message={filter === 'today' ? 'No sales made today' : 'No sales records available'}
        />
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <InvoiceCard
              invoice={item}
              showSalesperson
              onPress={() => {
               router.push(`/(owner)/sales/${item.id}`);
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.gray500,
    fontWeight: theme.typography.weights.medium,
  },
  header: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray500,
    fontWeight: theme.typography.weights.medium,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.gray600,
  },
  filterTextActive: {
    color: theme.colors.white,
  },
  listContent: {
    padding: theme.spacing.md,
  },
});