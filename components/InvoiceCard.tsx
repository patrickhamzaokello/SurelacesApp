// src/components/InvoiceCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Invoice } from '../types';
import { format } from 'date-fns';

interface InvoiceCardProps {
  invoice: Invoice;
  onPress: () => void;
  showSalesperson?: boolean;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  onPress,
  showSalesperson = false,
}) => {
  const getStatusColor = () => {
    switch (invoice.syncStatus) {
      case 'SYNCED':
        return '#4CAF50';
      case 'PENDING':
        return '#FF9800';
      case 'FAILED':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusIcon = () => {
    switch (invoice.syncStatus) {
      case 'SYNCED':
        return '🟢';
      case 'PENDING':
        return '🟡';
      case 'FAILED':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <Text style={styles.date}>
            {format(new Date(invoice.createdAt), 'MMM d, yyyy h:mm a')}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {invoice.syncStatus}
          </Text>
        </View>
      </View>

      {showSalesperson && (
        <Text style={styles.salesperson}>By: {invoice.salespersonName}</Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.itemsCount}>
          {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.total}>${invoice.total.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  salesperson: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  itemsCount: {
    fontSize: 14,
    color: '#666',
  },
  total: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
  },
});