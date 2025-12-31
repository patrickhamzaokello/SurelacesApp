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

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const stats = useTodayStats(user?.id);
  const { pendingInvoices } = useSync();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name}!</Text>
        <Text style={styles.date}>{stats.date}</Text>
      </View>

      <SyncIndicator />

      {pendingInvoices > 0 && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            ⚠️ {pendingInvoices} invoice{pendingInvoices > 1 ? 's' : ''} pending sync
          </Text>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${stats.totalSales.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Sales Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.invoiceCount}</Text>
          <Text style={styles.statLabel}>Invoices Created</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.newSaleButton}
        onPress={() => router.push('/(salesperson)/products')}
      >
        <Text style={styles.newSaleButtonText}>➕ New Sale</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Invoices</Text>
        {stats.recentInvoices.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No sales yet"
            message="Start making sales to see them here"
          />
        ) : (
          stats.recentInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onPress={() => {}}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#2196F3',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  newSaleButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    marginTop: 0,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  newSaleButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
});