// src/screens/owner/ReportsScreen.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useInvoicesStore } from '../../store/invoicesStore';
import { format, startOfWeek, startOfMonth, isWithinInterval } from 'date-fns';

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
    const dailySales = today.reduce((sum, inv) => sum + inv.total, 0);

    // Weekly stats
    const weekInvoices = invoices.filter(inv =>
      isWithinInterval(new Date(inv.created_at), { start: weekStart, end: now })
    );
    const weeklySales = weekInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // Monthly stats
    const monthInvoices = invoices.filter(inv =>
      isWithinInterval(new Date(inv.created_at), { start: monthStart, end: now })
    );
    const monthlySales = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);

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
      salesBySalesperson[inv.salesperson].total += inv.total;
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
        productStats[item.product].revenue += item.total? item.total : 0;
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
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales Summary</Text>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryPeriod}>Today</Text>
          <Text style={styles.summaryAmount}>${reports.dailySales.toFixed(2)}</Text>
          <Text style={styles.summaryCount}>{reports.dailyCount} transactions</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryPeriod}>This Week</Text>
          <Text style={styles.summaryAmount}>${reports.weeklySales.toFixed(2)}</Text>
          <Text style={styles.summaryCount}>{reports.weeklyCount} transactions</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryPeriod}>This Month</Text>
          <Text style={styles.summaryAmount}>${reports.monthlySales.toFixed(2)}</Text>
          <Text style={styles.summaryCount}>{reports.monthlyCount} transactions</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales by Salesperson</Text>
        {reports.salesBySalesperson.length === 0 ? (
          <Text style={styles.emptyText}>No sales data available</Text>
        ) : (
          reports.salesBySalesperson.map((person, index) => (
            <View key={person.name} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <Text style={styles.listItemRank}>#{index + 1}</Text>
                <Text style={styles.listItemName}>{person.name}</Text>
              </View>
              <View style={styles.listItemRight}>
                <Text style={styles.listItemValue}>${person.total.toFixed(2)}</Text>
                <Text style={styles.listItemCount}>{person.count} sales</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Selling Products</Text>
        {reports.topProducts.length === 0 ? (
          <Text style={styles.emptyText}>No product data available</Text>
        ) : (
          reports.topProducts.map((product, index) => (
            <View key={product.name} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <Text style={styles.listItemRank}>#{index + 1}</Text>
                <Text style={styles.listItemName} numberOfLines={2}>
                  {product.name}
                </Text>
              </View>
              <View style={styles.listItemRight}>
                <Text style={styles.listItemValue}>${product.revenue.toFixed(2)}</Text>
                <Text style={styles.listItemCount}>{product.quantity} sold</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryPeriod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 14,
    color: '#666',
  },
  listItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemRank: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
    marginRight: 12,
    width: 30,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 2,
  },
  listItemCount: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    padding: 32,
  },
});