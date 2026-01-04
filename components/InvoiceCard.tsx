// src/components/InvoiceCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Invoice } from '../types';
import { format } from 'date-fns';
import { theme } from '../constants/theme';

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
    switch (invoice.sync_status) {
      case 'SYNCED':
        return theme.colors.success;
      case 'PENDING':
        return theme.colors.primary;
      case 'FAILED':
        return theme.colors.error;
      default:
        return theme.colors.gray400;
    }
  };

  const getStatusLabel = () => {
    switch (invoice.sync_status) {
      case 'SYNCED':
        return 'Synced';
      case 'PENDING':
        return 'Pending';
      case 'FAILED':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          <Text style={styles.date}>
            {format(new Date(invoice.created_at), 'MMM d, yyyy h:mm a')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusLabel()}</Text>
        </View>
      </View>

      {showSalesperson && (
        <Text style={styles.salesperson}>By: {invoice.salesperson_name}</Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.itemsCount}>
          {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.total}>UGX {parseFloat(invoice.total).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
  },
  date: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
    textTransform: 'uppercase',
  },
  salesperson: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray600,
    marginBottom: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  itemsCount: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray600,
  },
  total: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
  },
});