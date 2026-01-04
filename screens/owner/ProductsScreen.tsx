// src/screens/owner/ProductsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProductsStore } from '../../store/productsStore';
import { ProductCard } from '../../components/ProductCard';
import { EmptyState } from '../../components/EmptyState';
import { Product } from '../../types';
import { format } from 'date-fns';
import { theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export const OwnerProductsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { products, isLoading, lastUpdated, fetchProducts, searchProducts } = useProductsStore();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const results = searchProducts(searchQuery);
    setFilteredProducts(results);
  }, [searchQuery, products]);

  const handleRefresh = async () => {
    try {
      await fetchProducts();
      Alert.alert('Success', 'Products updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update products');
    }
  };

  const handleProductPress = (product: Product) => {
    Alert.alert(
      product.name,
      `Code: ${product.code}\nPrice: UGX ${parseFloat(product.price).toFixed(0)}${
        product.stock !== undefined ? `\nStock: ${product.stock}` : ''
      }${product.category_name ? `\nCategory: ${product.category_name}` : ''}`,
      [{ text: 'OK' }]
    );
  };

  if (isLoading && products.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
       <SafeAreaView />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <Text style={styles.subtitle}>Inventory and product management</Text>
      </View>

      {/* Search and Actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={theme.colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
        
        {lastUpdated && (
          <Text style={styles.lastUpdated}>
            Last updated: {format(new Date(lastUpdated), 'h:mm a')}
          </Text>
        )}
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isLoading}
        >
          <Ionicons 
            name={isLoading ? "refresh" : "refresh-outline"} 
            size={18} 
            color={theme.colors.white} 
            style={styles.refreshIcon}
          />
          <Text style={styles.refreshButtonText}>
            {isLoading ? 'Updating...' : 'Update Products'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No products found' : 'No products available'}
          message={
            searchQuery
              ? 'Try a different search term'
              : 'Products will appear here once loaded'
          }
        />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => handleProductPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.gray500,
    fontWeight: theme.typography.weights.medium,
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
  actionsContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    padding: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.black,
  },
  clearButton: {
    marginLeft: theme.spacing.sm,
  },
  lastUpdated: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  refreshIcon: {
    marginRight: theme.spacing.sm,
  },
  refreshButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  listContent: {
    padding: theme.spacing.md,
  },
});