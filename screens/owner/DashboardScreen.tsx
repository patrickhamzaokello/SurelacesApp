// src/screens/owner/DashboardScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useTodayStats } from '../../hooks/useTodayStats';
import { useSync } from '../../hooks/useSync';
import { SyncIndicator } from '../../components/SyncIndicator';
import { useInvoicesStore } from '../../store/invoicesStore';
import { theme } from '../../constants/theme';

const { width } = Dimensions.get('window');

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
      .filter(inv => new Date(inv.created_at).toDateString() === new Date().toDateString())
      .map(inv => inv.salesperson)
  ).size;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>{stats.date}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Sync Status */}
        <SyncIndicator />

        {/* Warning Card */}
        {status !== 'online' && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              Data may be incomplete - sync to see latest
            </Text>
          </View>
        )}

        {/* Key Metrics - Full Width Cards */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Today's Performance</Text>
          
          {/* Primary Metric */}
          <View style={styles.primaryMetricCard}>
            <Text style={styles.primaryMetricLabel}>Total Sales Today</Text>
            <Text style={styles.primaryMetricValue}>UGX {stats.totalSales.toFixed(0)}</Text>
            <Text style={styles.primaryMetricSubtext}>{stats.invoiceCount} transactions completed</Text>
          </View>

          {/* Secondary Metrics Grid */}
          <View style={styles.secondaryMetricsGrid}>
            <View style={styles.secondaryMetricCard}>
              <Text style={styles.secondaryMetricValue}>{stats.invoiceCount}</Text>
              <Text style={styles.secondaryMetricLabel}>Invoices</Text>
            </View>

            <View style={styles.secondaryMetricCard}>
              <Text style={styles.secondaryMetricValue}>{activeSalespeople}</Text>
              <Text style={styles.secondaryMetricLabel}>Active Staff</Text>
            </View>

            <View style={styles.secondaryMetricCard}>
              <Text style={styles.secondaryMetricValue}>
                {stats.invoiceCount > 0 ? (stats.totalSales / stats.invoiceCount).toFixed(0) : '0'}
              </Text>
              <Text style={styles.secondaryMetricLabel}>Avg. Invoice (Ugx)</Text>
            </View>
          </View>
        </View>

        {/* Top Product - Full Width */}
        <View style={styles.topProductSection}>
          <Text style={styles.sectionTitle}>Top Selling Product</Text>
          <View style={styles.topProductCard}>
            {stats.topProduct ? (
              <>
                <Text style={styles.topProductName}>{stats.topProduct}</Text>
                <Text style={styles.topProductSubtext}>Most sold item today</Text>
              </>
            ) : (
              <>
                <Text style={styles.topProductName}>No sales data</Text>
                <Text style={styles.topProductSubtext}>Start making sales to see top products</Text>
              </>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatLabel}>Revenue Target</Text>
              <Text style={styles.quickStatValue}>Coming Soon</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatLabel}>Monthly Growth</Text>
              <Text style={styles.quickStatValue}>Coming Soon</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  content: {
    padding: theme.spacing.md,
  },
  warningCard: {
    backgroundColor: theme.colors.gray50,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    marginBottom: theme.spacing.lg,
  },
  warningText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.error,
    fontWeight: theme.typography.weights.medium,
  },
  metricsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  primaryMetricCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  primaryMetricLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: theme.typography.weights.medium,
  },
  primaryMetricValue: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  primaryMetricSubtext: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.white,
    opacity: 0.8,
  },
  secondaryMetricsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  secondaryMetricCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryMetricValue: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  secondaryMetricLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
    textAlign: 'center',
    fontWeight: theme.typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topProductSection: {
    marginBottom: theme.spacing.xl,
  },
  topProductCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  topProductName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    lineHeight: 24,
  },
  topProductSubtext: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray500,
    textAlign: 'center',
  },
  quickStatsSection: {
    marginBottom: theme.spacing.xl,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickStatItem: {
    flex: 1,
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickStatLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: theme.typography.weights.medium,
  },
  quickStatValue: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.gray600,
    textAlign: 'center',
  },
});