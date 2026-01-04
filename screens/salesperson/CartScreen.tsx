// src/screens/salesperson/CartScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '../../store/cartStore';
import { useInvoicesStore } from '../../store/invoicesStore';
import { useAuth } from '../../hooks/useAuth';
import { EmptyState } from '../../components/EmptyState';
import { InvoiceItem } from '../../types';
import { theme } from '../../constants/theme';

export const CartScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, getTax, getTotal } =
    useCartStore();
  const { createInvoice } = useInvoicesStore();

  const taxRate = 0.1; // 10% tax

  const handleCreateInvoice = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart first');
      return;
    }

    Alert.alert(
      'Create Invoice',
      'Are you sure you want to create this invoice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              const invoiceItems: InvoiceItem[] = items.map((item) => ({
                product: item.product.id,
                product_name: item.product.name,
                product_code: item.product.code,
                quantity: item.quantity,
                price: item.product.price,
                total: (parseFloat(item.product.price) * item.quantity).toString(),
              }));

              await createInvoice(invoiceItems, user!.user_id, user!.name);
              clearCart();
              
              Alert.alert('Success', 'Invoice created successfully', [
                { text: 'OK', onPress: () => router.push('/(salesperson)/invoices') },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to create invoice');
            }
          },
        },
      ]
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Cart</Text>
        </View>
        <EmptyState
          title="Cart is empty"
          message="Add products from the Products tab"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Cart</Text>
        <Text style={styles.itemCount}>{items.length} items</Text>
      </View>
      
      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.product.name}
              </Text>
              <Text style={styles.itemCode}>{item.product.code}</Text>
              <Text style={styles.itemPrice}>
                UGX {parseFloat(item.product.price).toFixed(0)} each
              </Text>
            </View>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.itemTotal}>
              <Text style={styles.itemTotalText}>
                UGX {(parseFloat(item.product.price) * item.quantity).toFixed(0)}
              </Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeItem(item.product.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>UGX {getSubtotal().toFixed(0)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (10%)</Text>
            <Text style={styles.totalValue}>UGX {getTax(taxRate).toFixed(0)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>UGX {getTotal(taxRate).toFixed(0)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateInvoice}
        >
          <Text style={styles.createButtonText}>Create Invoice</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            Alert.alert('Clear Cart', 'Remove all items from cart?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', onPress: clearCart, style: 'destructive' },
            ]);
          }}
        >
          <Text style={styles.clearButtonText}>Clear Cart</Text>
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
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
  },
  itemCount: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray500,
    fontWeight: theme.typography.weights.medium,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  cartItem: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  itemName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
  },
  itemCode: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
    marginBottom: theme.spacing.xs,
    fontFamily: 'monospace',
  },
  itemPrice: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray600,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.white,
    fontWeight: theme.typography.weights.semibold,
  },
  quantity: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
    marginHorizontal: theme.spacing.md,
    minWidth: 30,
    textAlign: 'center',
  },
  itemTotal: {
    alignItems: 'flex-end',
  },
  itemTotalText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
  removeButtonText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.error,
    fontWeight: theme.typography.weights.medium,
  },
  footer: {
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  totals: {
    marginBottom: theme.spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.gray600,
  },
  totalValue: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.black,
    fontWeight: theme.typography.weights.medium,
  },
  grandTotal: {
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  grandTotalLabel: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
  },
  grandTotalValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  clearButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
  clearButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.gray600,
  },
  createButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
});