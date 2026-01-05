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
      const invoiceText = `
━━━━━━━━━━━━━━━━━━━━━━━━━
       INVOICE
━━━━━━━━━━━━━━━━━━━━━━━━━

Invoice: ${invoice.invoice_number}
Date: ${format(new Date(invoice.created_at), 'MMM dd, yyyy h:mm a')}
Salesperson: ${invoice.salesperson_name}

━━━━━━━━━━━━━━━━━━━━━━━━━
ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━

${invoice.items.map((item: InvoiceItem, i: number) =>
  `${i + 1}. ${item.product_name}
   Code: ${item.product_code}
   ${item.quantity}x @ UGX ${parseFloat(item.price).toFixed(0)}
   Total: UGX ${item.total ? parseFloat(item.total).toFixed(0) : (parseFloat(item.price) * item.quantity).toFixed(0)}`
).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal: UGX ${parseFloat(invoice.subtotal).toFixed(0)}
Tax: UGX ${parseFloat(invoice.tax).toFixed(0)}
${invoice.discount && parseFloat(invoice.discount) > 0 ? `Discount: -UGX ${parseFloat(invoice.discount).toFixed(0)}` : ''}
TOTAL: UGX ${parseFloat(invoice.total).toFixed(0)}

━━━━━━━━━━━━━━━━━━━━━━━━━
Thank you for your business!
      `;

      await Share.share({
        message: invoiceText.trim(),
        title: `Invoice ${invoice.invoice_number}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share invoice');
    }
  };

  const handleSavePDF = async () => {
    Alert.alert(
      'Save as PDF',
      'PDF export functionality will be available in a future update.',
      [{ text: 'Got it' }]
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
        <Text style={styles.screenTitle}>Inovice Details</Text>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Invoice Header Card */}
        <View style={styles.invoiceHeaderCard}>
          <View style={styles.invoiceNumberSection}>
            <Text style={styles.invoiceNumberLabel}>Invoice Number</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          </View>

          <View style={styles.invoiceMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.gray500} />
              <Text style={styles.metaText}>
                {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={theme.colors.gray500} />
              <Text style={styles.metaText}>
                {format(new Date(invoice.created_at), 'h:mm a')}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(invoice.sync_status) + '20', borderColor: getStatusStyle(invoice.sync_status) }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusStyle(invoice.sync_status) }]} />
            <Text style={[styles.statusText, { color: getStatusStyle(invoice.sync_status) }]}>
              {getStatusLabel(invoice.sync_status)}
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Details</Text>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color={theme.colors.gray600} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Salesperson</Text>
                <Text style={styles.infoValue}>{invoice.salesperson_name}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="storefront-outline" size={18} color={theme.colors.gray600} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Store</Text>
                <Text style={styles.infoValue}>{invoice.store_name || 'Surelaces'}</Text>
              </View>
            </View>
          </View>

          {/* Customer Info (if available) */}
          {(invoice.customer_name || invoice.customer_phone || invoice.customer_email) && (
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Customer</Text>
              {invoice.customer_name && (
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={18} color={theme.colors.gray600} />
                  <Text style={styles.infoValue}>{invoice.customer_name}</Text>
                </View>
              )}
              {invoice.customer_phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={18} color={theme.colors.gray600} />
                  <Text style={styles.infoValue}>{invoice.customer_phone}</Text>
                </View>
              )}
              {invoice.customer_email && (
                <View style={styles.infoRow}>
                  <Ionicons name="mail" size={18} color={theme.colors.gray600} />
                  <Text style={styles.infoValue}>{invoice.customer_email}</Text>
                </View>
              )}
            </View>
          )}

          {/* Items Card */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Items ({invoice.items.length})</Text>
            {invoice.items.map((item: InvoiceItem, index: number) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemQuantityBadge}>{item.quantity}x</Text>
                </View>
                <Text style={styles.itemCode}>Code: {item.product_code}</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>
                    UGX {parseFloat(item.price).toFixed(0)} each
                  </Text>
                  <Text style={styles.itemTotal}>
                    UGX {item.total ? parseFloat(item.total).toFixed(0) : (parseFloat(item.price) * item.quantity).toFixed(0)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Notes (if available) */}
          {invoice.notes && (
            <View style={styles.notesCard}>
              <Ionicons name="document-text-outline" size={20} color={theme.colors.gray600} />
              <View style={styles.notesContent}>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </View>
            </View>
          )}

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Summary</Text>
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
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>UGX {parseFloat(invoice.total).toFixed(0)}</Text>
            </View>
          </View>

          {/* Payment Info */}
          <View style={styles.paymentInfo}>
            <View style={styles.paymentRow}>
              <Ionicons name="cash-outline" size={18} color={theme.colors.gray500} />
              <Text style={styles.paymentText}>Payment Method: Cash</Text>
            </View>
            {invoice.synced_at && (
              <View style={styles.paymentRow}>
                <Ionicons name="cloud-done-outline" size={18} color={theme.colors.success} />
                <Text style={styles.paymentText}>
                  Synced: {format(new Date(invoice.synced_at), 'MMM dd, h:mm a')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social" size={20} color={theme.colors.white} />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pdfButton} onPress={handleSavePDF}>
          <Ionicons name="document-text" size={20} color={theme.colors.primary} />
          <Text style={styles.pdfButtonText}>Save PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  screenTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
  },
  scrollView: {
    flex: 1,
  },
  invoiceHeaderCard: {
    backgroundColor: theme.colors.gray50,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  invoiceNumberSection: {
    gap: theme.spacing.xs,
  },
  invoiceNumberLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  invoiceNumber: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  invoiceMeta: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray600,
    fontWeight: theme.typography.weights.medium,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  infoCard: {
    backgroundColor: theme.colors.gray50,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  infoContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  infoLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
    fontWeight: theme.typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
  },
  itemCard: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    gap: theme.spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
    marginRight: theme.spacing.sm,
  },
  itemQuantityBadge: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  itemCode: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
    fontFamily: 'monospace',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  itemPrice: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray600,
  },
  itemTotal: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
  },
  notesCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.warning + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
    gap: theme.spacing.md,
  },
  notesContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  notesLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.gray700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray700,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.gray600,
    fontWeight: theme.typography.weights.medium,
  },
  summaryValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
  },
  totalLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
  },
  totalValue: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  paymentInfo: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  paymentText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray600,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
  },
  shareButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  pdfButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  pdfButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
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