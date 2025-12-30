// src/screens/owner/SalesScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useInvoicesStore } from '../../store/invoicesStore';
import { InvoiceCard } from '../../components/InvoiceCard';
import { EmptyState } from '../../components/EmptyState';
import { isToday } from 'date-fns';

type FilterType = 'all' | 'today';

export const OwnerSalesScreen = () => {
  const { invoices, isLoading, fetchInvoices } = useInvoicesStore();
  const [filter, setFilter] = useState<FilterType>('today');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = filter === 'today'
    ? invoices.filter(inv => isToday(new Date(inv.createdAt)))
    : invoices;

  if (isLoading && invoices.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon="📋"
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
                // Navigate to invoice detail
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
});