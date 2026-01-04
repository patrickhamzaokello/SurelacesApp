// src/screens/salesperson/ProductsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProductsStore } from '../../store/productsStore';
import { useCartStore } from '../../store/cartStore';
import { EmptyState } from '../../components/EmptyState';
import { Product } from '../../types';
import { theme } from '../../constants/theme';

export const ProductsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { products, isLoading, fetchProducts, searchProducts } = useProductsStore();
  const { addItem } = useCartStore();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const results = searchProducts(searchQuery);
    setFilteredProducts(results);
  }, [searchQuery, products]);

  const handleAddToCart = (product: Product, event: any) => {
    event.stopPropagation();
    addItem(product);
    Alert.alert('Added to Cart', `${product.name} added to cart`);
  };

  const handleProductPress = (product: Product) => {
    Alert.alert(
      product.name,
      `Code: ${product.code}\nPrice: UGX ${parseFloat(product.price).toFixed(0)}${
        product.stock !== undefined ? `\nStock: ${product.stock}` : ''
      }${product.category_name ? `\nCategory: ${product.category_name}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add to Cart', 
          onPress: () => addItem(product),
          style: 'default'
        }
      ]
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productContent}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={24} color={theme.colors.gray400} />
            </View>
          )}
        </View>
        
        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productCode}>{item.code}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>
              UGX {parseFloat(item.price).toFixed(0)}
            </Text>
            {item.stock !== undefined && (
              <Text style={styles.stockText}>
                Stock: {item.stock}
              </Text>
            )}
          </View>
          {item.category_name && (
            <Text style={styles.categoryText}>{item.category_name}</Text>
          )}
        </View>
        
        {/* Add to Cart Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={(e) => handleAddToCart(item, e)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
      <View style={styles.searchContainer}>
        <Text style={styles.screenTitle}>Products</Text>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or code..."
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
      </View>

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
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          numColumns={1}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  searchContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  screenTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
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
  listContent: {
    padding: theme.spacing.md,
  },
  separator: {
    height: theme.spacing.sm,
  },
  productCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  productContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  imageContainer: {
    marginRight: theme.spacing.md,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.gray50,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  productInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  productName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  productCode: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray500,
    fontFamily: 'monospace',
    marginBottom: theme.spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  productPrice: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  stockText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
    fontWeight: theme.typography.weights.medium,
  },
  categoryText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});