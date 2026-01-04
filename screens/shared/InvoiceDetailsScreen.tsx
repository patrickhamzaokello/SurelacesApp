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

export const InvoiceDetailsScreen = () => {
  const router = useRouter();
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const { getInvoiceById } = useInvoicesStore();
  const viewShotRef = useRef<any>(null);

  const invoice = getInvoiceById(invoiceId!);

  if (!invoice) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
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
        message: `Invoice ${invoice.invoice_number}\nTotal: UGX ${parseFloat(invoice.total).toFixed(2)}\nDate: ${format(new Date(invoice.created_at), 'MMM d, yyyy')}`,
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
        return { backgroundColor: '#E8F5E8', color: '#4CAF50' };
      case 'PENDING':
        return { backgroundColor: '#FFF3E0', color: '#FF9800' };
      case 'FAILED':
        return { backgroundColor: '#FFEBEE', color: '#F44336' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#999' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2196F3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleExport}>
            <Ionicons name="download-outline" size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.invoiceContainer}>
          {/* Invoice Header */}
          <View style={styles.invoiceHeader}>
            <View style={styles.invoiceHeaderLeft}>
              <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
              <Text style={styles.invoiceDate}>
                {format(new Date(invoice.created_at), 'EEEE, MMMM d, yyyy')}
              </Text>
              <Text style={styles.invoiceTime}>
                {format(new Date(invoice.created_at), 'h:mm a')}
              </Text>
            </View>
            <View style={[styles.statusBadge, getStatusStyle(invoice.sync_status)]}>
              <Text style={[styles.statusText, { color: getStatusStyle(invoice.sync_status).color }]}>
                {invoice.sync_status}
              </Text>
            </View>
          </View>

          {/* Store Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Store Information</Text>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{invoice.store_name || 'Surelaces Store'}</Text>
              <Text style={styles.storeDetails}>Point of Sale System</Text>
            </View>
          </View>

          {/* Salesperson Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Salesperson</Text>
            <View style={styles.salespersonInfo}>
              <Ionicons name="person-circle" size={24} color="#2196F3" />
              <Text style={styles.salespersonName}>{invoice.salesperson_name}</Text>
            </View>
          </View>

          {/* Customer Information (if available) */}
          {(invoice.customer_name || invoice.customer_phone || invoice.customer_email) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <View style={styles.customerInfo}>
                {invoice.customer_name && (
                  <View style={styles.customerRow}>
                    <Ionicons name="person" size={16} color="#666" />
                    <Text style={styles.customerText}>{invoice.customer_name}</Text>
                  </View>
                )}
                {invoice.customer_phone && (
                  <View style={styles.customerRow}>
                    <Ionicons name="call" size={16} color="#666" />
                    <Text style={styles.customerText}>{invoice.customer_phone}</Text>
                  </View>
                )}
                {invoice.customer_email && (
                  <View style={styles.customerRow}>
                    <Ionicons name="mail" size={16} color="#666" />
                    <Text style={styles.customerText}>{invoice.customer_email}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Items List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items ({invoice.items.length})</Text>
            {invoice.items.map((item: InvoiceItem, index: number) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemCode}>{item.product_code}</Text>
                </View>
                <View style={styles.itemQuantity}>
                  <Text style={styles.quantityText}>{item.quantity}x</Text>
                </View>
                <View style={styles.itemPricing}>
                  <Text style={styles.itemPrice}>
                    UGX {parseFloat(item.price).toFixed(2)}
                  </Text>
                  <Text style={styles.itemTotal}>
                    UGX {item.total ? parseFloat(item.total).toFixed(2) : (parseFloat(item.price) * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Notes (if available) */}
          {invoice.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          )}

          {/* Totals */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>UGX {parseFloat(invoice.subtotal).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>UGX {parseFloat(invoice.tax).toFixed(2)}</Text>
            </View>
            {invoice.discount && parseFloat(invoice.discount) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={[styles.totalValue, { color: '#4CAF50' }]}>
                  -UGX {parseFloat(invoice.discount).toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Payment Method</Text>
              <Text style={styles.totalValue}>Cash</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>UGX {parseFloat(invoice.total).toFixed(2)}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for your business!</Text>
            <Text style={styles.footerSubtext}>
              Invoice ID: {invoice.id}
            </Text>
            {invoice.synced_at && (
              <Text style={styles.footerSubtext}>
                Synced: {format(new Date(invoice.synced_at), 'MMM d, yyyy h:mm a')}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#2196F3" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
          <Ionicons name="download-outline" size={20} color="#2196F3" />
          <Text style={styles.actionButtonText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.printButton]} onPress={handlePrint}>
          <Ionicons name="print-outline" size={20} color="#fff" />
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>Print</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  invoiceContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#e9ecef',
  },
  invoiceHeaderLeft: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2196F3',
    marginBottom: 8,
  },
  invoiceDate: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  invoiceTime: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  storeInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
  },
  storeDetails: {
    fontSize: 14,
    color: '#666',
  },
  salespersonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  salespersonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  customerInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerText: {
    fontSize: 14,
    color: '#333',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 12,
    color: '#666',
  },
  itemQuantity: {
    flex: 0.5,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemPricing: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    fontStyle: 'italic',
  },
  totalsSection: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#dee2e6',
    paddingTop: 12,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2196F3',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  printButton: {
    backgroundColor: '#2196F3',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});