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
import { useProductsStore } from '../../store/productsStore';
import { ProductCard } from '../../components/ProductCard';
import { EmptyState } from '../../components/EmptyState';
import { Product } from '../../types';
import { format } from 'date-fns';

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
      `Code: ${product.code}\nPrice: $${product.price}${
        product.stock !== undefined ? `\nStock: ${product.stock}` : ''
      }${product.category ? `\nCategory: ${product.category}` : ''}`,
      [{ text: 'OK' }]
    );
  };

  if (isLoading && products.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
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
          <Text style={styles.refreshButtonText}>
            {isLoading ? 'Updating...' : '🔄 Update Products'}
          </Text>
        </TouchableOpacity>
      </View>

      {filteredProducts.length === 0 ? (
        <EmptyState
          icon="📦"
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
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
});