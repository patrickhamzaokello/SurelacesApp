// src/screens/owner/DashboardScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTodayStats } from '../../hooks/useTodayStats';
import { useSync } from '../../hooks/useSync';
import { SyncIndicator } from '../../components/SyncIndicator';
import { useInvoicesStore } from '../../store/invoicesStore';

export const OwnerDashboardScreen = () => {
  const stats = useTodayStats(); // No filter, shows all sales
  const { status } = useSync();
  const { invoices, fetchInvoices } = useInvoicesStore();

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Get active salespeople count
  const activeSalespeople = new Set(
    invoices
      .filter(inv => new Date(inv.createdAt).toDateString() === new Date().toDateString())
      .map(inv => inv.salespersonId)
  ).size;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>{stats.date}</Text>
      </View>

      <SyncIndicator />

      {status !== 'online' && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            ⚠️ Data may be incomplete - sync to see latest
          </Text>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>💰</Text>
          <Text style={styles.statValue}>${stats.totalSales.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Sales Today</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📋</Text>
          <Text style={styles.statValue}>{stats.invoiceCount}</Text>
          <Text style={styles.statLabel}>Invoices Today</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {stats.topProduct || 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Top Product</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statValue}>{activeSalespeople}</Text>
          <Text style={styles.statLabel}>Active Salespeople</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Overview</Text>
        <View style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Average Invoice Value</Text>
            <Text style={styles.overviewValue}>
              ${stats.invoiceCount > 0 ? (stats.totalSales / stats.invoiceCount).toFixed(2) : '0.00'}
            </Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Total Transactions</Text>
            <Text style={styles.overviewValue}>{stats.invoiceCount}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#2196F3',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  overviewLabel: {
    fontSize: 16,
    color: '#666',
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});