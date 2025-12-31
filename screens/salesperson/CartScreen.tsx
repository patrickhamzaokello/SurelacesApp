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
                productId: item.product.id,
                productName: item.product.name,
                productCode: item.product.code,
                quantity: item.quantity,
                price: item.product.price,
                total: item.product.price * item.quantity,
              }));

              await createInvoice(invoiceItems, user!.id, user!.name);
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
      <EmptyState
        icon="🛒"
        title="Cart is empty"
        message="Add products from the Products tab"
      />
    );
  }

  return (
    <View style={styles.container}>
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
                ${item.product.price.toFixed(2)} each
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
                ${(item.product.price * item.quantity).toFixed(2)}
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
      />

      <View style={styles.footer}>
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${getSubtotal().toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (10%)</Text>
            <Text style={styles.totalValue}>${getTax(taxRate).toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>${getTotal(taxRate).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.actions}>
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
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateInvoice}
          >
            <Text style={styles.createButtonText}>Create Invoice</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  quantity: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  itemTotal: {
    alignItems: 'flex-end',
  },
  itemTotalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    fontSize: 12,
    color: '#F44336',
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
  },
  totals: {
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    color: '#333',
  },
  grandTotal: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  grandTotalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  createButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});