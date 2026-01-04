// src/screens/owner/ReportsScreen.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useInvoicesStore } from '../../store/invoicesStore';
import { format, startOfWeek, startOfMonth, isWithinInterval } from 'date-fns';
import { theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export const OwnerReportsScreen = () => {
  const { invoices } = useInvoicesStore();

  const reports = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    // Daily stats
    const today = invoices.filter(inv => 
      format(new Date(inv.created_at), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
    );
    const dailySales = today.reduce((sum, inv) => sum + Number(inv.total), 0);

    // Weekly stats
    const weekInvoices = invoices.filter(inv =>
      isWithinInterval(new Date(inv.created_at), { start: weekStart, end: now })
    );
    const weeklySales = weekInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    // Monthly stats
    const monthInvoices = invoices.filter(inv =>
      isWithinInterval(new Date(inv.created_at), { start: monthStart, end: now })
    );
    const monthlySales = monthInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    // Sales by salesperson
    const salesBySalesperson: Record<string, { name: string; total: number; count: number }> = {};
    invoices.forEach(inv => {
      if (!salesBySalesperson[inv.salesperson]) {
        salesBySalesperson[inv.salesperson] = {
          name: inv.salesperson_name,
          total: 0,
          count: 0,
        };
      }
      salesBySalesperson[inv.salesperson].total += Number(inv.total);
      salesBySalesperson[inv.salesperson].count += 1;
    });

    // Top products
    const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!productStats[item.product]) {
          productStats[item.product] = {
            name: item.product_name,
            quantity: 0,
            revenue: 0,
          };
        }
        productStats[item.product].quantity += item.quantity;
        productStats[item.product].revenue += item.total ? Number(item.total) : 0;
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      dailySales,
      dailyCount: today.length,
      weeklySales,
      weeklyCount: weekInvoices.length,
      monthlySales,
      monthlyCount: monthInvoices.length,
      salesBySalesperson: Object.values(salesBySalesperson).sort((a, b) => b.total - a.total),
      topProducts,
    };
  }, [invoices]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

       <SafeAreaView />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Sales analytics and insights</Text>
      </View>

      <View style={styles.content}>
        {/* Sales Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryPeriod}>Today</Text>
              <Text style={styles.summaryAmount}>UGX {reports.dailySales.toFixed(0)}</Text>
              <Text style={styles.summaryCount}>{reports.dailyCount} transactions</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryPeriod}>This Week</Text>
              <Text style={styles.summaryAmount}>UGX {reports.weeklySales.toFixed(0)}</Text>
              <Text style={styles.summaryCount}>{reports.weeklyCount} transactions</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryPeriod}>This Month</Text>
              <Text style={styles.summaryAmount}>UGX {reports.monthlySales.toFixed(0)}</Text>
              <Text style={styles.summaryCount}>{reports.monthlyCount} transactions</Text>
            </View>
          </View>
        </View>

        {/* Sales by Salesperson */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales by Salesperson</Text>
          {reports.salesBySalesperson.length === 0 ? (
            <Text style={styles.emptyText}>No sales data available</Text>
          ) : (
            <View style={styles.listContainer}>
              {reports.salesBySalesperson.map((person, index) => (
                <View key={person.name} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.listItemRank}>{index + 1}</Text>
                    </View>
                    <Text style={styles.listItemName}>{person.name}</Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={styles.listItemValue}>UGX {person.total.toFixed(0)}</Text>
                    <Text style={styles.listItemCount}>{person.count} sales</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Top Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Selling Products</Text>
          {reports.topProducts.length === 0 ? (
            <Text style={styles.emptyText}>No product data available</Text>
          ) : (
            <View style={styles.listContainer}>
              {reports.topProducts.map((product, index) => (
                <View key={product.name} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.listItemRank}>{index + 1}</Text>
                    </View>
                    <Text style={styles.listItemName} numberOfLines={2}>
                      {product.name}
                    </Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={styles.listItemValue}>UGX {product.revenue.toFixed(0)}</Text>
                    <Text style={styles.listItemCount}>{product.quantity} sold</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  summaryGrid: {
    gap: theme.spacing.sm,
  },
  summaryCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  summaryPeriod: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: theme.typography.weights.medium,
  },
  summaryAmount: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  summaryCount: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray600,
  },
  listContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listItem: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  listItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listItemRank: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  listItemName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.black,
    flex: 1,
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  listItemCount: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
  },
  emptyText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray400,
    textAlign: 'center',
    padding: theme.spacing.xl,
  },
});