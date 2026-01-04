// screens/shared/InvoiceDetailsScreen.tsx
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
// import ViewShot from 'react-native-view-shot'; // For future screenshot functionality
import { useInvoicesStore } from '@/store/invoicesStore';
import { Invoice, InvoiceItem } from '@/types';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export const InvoiceDetailsScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getInvoiceById } = useInvoicesStore();
  const viewShotRef = useRef<any>(null);

  const invoice = getInvoiceById(id!);

  if (!invoice) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Invoice Not Found</Text>
        <Text style={styles.errorMessage}>The requested invoice could not be found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Invoice ${invoice.invoice_number}\nTotal: UGX ${parseFloat(invoice.total).toFixed(0)}\nDate: ${format(new Date(invoice.created_at), 'MMM d, yyyy')}`,
        title: `Invoice ${invoice.invoice_number}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share invoice');
    }
  };

  const handleExport = async () => {
    Alert.alert(
      'Export Invoice',
      'Export functionality will be available in a future update with screenshot capabilities.',
      [{ text: 'OK' }]
    );
  };

  const handlePrint = async () => {
    Alert.alert(
      'Print Invoice',
      'Print functionality will be available with printer integration in a future update.',
      [{ text: 'OK' }]
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
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

  const getStatusLabel = (status: string) => {
    switch (status) {
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
    <View style={styles.container}>
       <SafeAreaView />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color={theme.colors.gray600} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleExport}>
            <Ionicons name="download-outline" size={24} color={theme.colors.gray600} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Invoice Header */}
        <View style={styles.invoiceHeader}>
          <View style={styles.headerInfo}>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.invoiceDate}>
              {format(new Date(invoice.created_at), 'MMM d, yyyy • h:mm a')}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(invoice.sync_status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(invoice.sync_status)}</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Basic Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Store</Text>
              <Text style={styles.infoValue}>{invoice.store_name || 'Surelaces'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Salesperson</Text>
              <Text style={styles.infoValue}>{invoice.salesperson_name}</Text>
            </View>
          </View>

          {/* Customer Info (if available) */}
          {(invoice.customer_name || invoice.customer_phone || invoice.customer_email) && (
            <View style={styles.customerSection}>
              <Text style={styles.sectionTitle}>Customer</Text>
              <View style={styles.customerDetails}>
                {invoice.customer_name && <Text style={styles.customerText}>{invoice.customer_name}</Text>}
                {invoice.customer_phone && <Text style={styles.customerText}>{invoice.customer_phone}</Text>}
                {invoice.customer_email && <Text style={styles.customerText}>{invoice.customer_email}</Text>}
              </View>
            </View>
          )}

          {/* Items */}
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Items ({invoice.items.length})</Text>
            <View style={styles.itemsList}>
              {invoice.items.map((item: InvoiceItem, index: number) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                    <Text style={styles.itemCode}>{item.product_code}</Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                    <Text style={styles.itemTotal}>
                      UGX {item.total ? parseFloat(item.total).toFixed(0) : (parseFloat(item.price) * item.quantity).toFixed(0)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Notes (if available) */}
          {invoice.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          )}

          {/* Summary */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>UGX {parseFloat(invoice.subtotal).toFixed(0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>UGX {parseFloat(invoice.tax).toFixed(0)}</Text>
            </View>
            {invoice.discount && parseFloat(invoice.discount) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                  -UGX {parseFloat(invoice.discount).toFixed(0)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>UGX {parseFloat(invoice.total).toFixed(0)}</Text>
            </View>
          </View>

          {/* Footer Info */}
          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>Payment Method: Cash</Text>
            {invoice.synced_at && (
              <Text style={styles.footerText}>
                Synced: {format(new Date(invoice.synced_at), 'MMM d, h:mm a')}
              </Text>
            )}
            <Text style={styles.invoiceId}>ID: {invoice.id}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
          <Text style={styles.actionButtonText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.printButton]} onPress={handlePrint}>
          <Text style={[styles.actionButtonText, { color: theme.colors.white }]}>Print</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  invoiceDate: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray600,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
    textTransform: 'uppercase',
  },
  content: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
    marginBottom: theme.spacing.sm,
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  infoItem: {
    flex: 1,
    backgroundColor: theme.colors.gray50,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
  },
  customerSection: {
    marginBottom: theme.spacing.md,
  },
  customerDetails: {
    backgroundColor: theme.colors.gray50,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  customerText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
  },
  itemsSection: {
    marginBottom: theme.spacing.md,
  },
  itemsList: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
  },
  itemCode: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
    fontFamily: 'monospace',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray600,
    marginBottom: theme.spacing.xs,
  },
  itemTotal: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
  },
  notesSection: {
    marginBottom: theme.spacing.md,
  },
  notesText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray700,
    backgroundColor: theme.colors.gray50,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontStyle: 'italic',
  },
  summarySection: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  summaryLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray600,
  },
  summaryValue: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.black,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
  },
  totalValue: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  footerInfo: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
    marginBottom: theme.spacing.xs,
  },
  invoiceId: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray400,
    fontFamily: 'monospace',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.gray50,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButtonText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
  },
  printButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  errorTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.gray500,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  backButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  backButtonText: {
    color: theme.colors.white,
    fontWeight: theme.typography.weights.semibold,
    fontSize: theme.typography.sizes.sm,
  },
});