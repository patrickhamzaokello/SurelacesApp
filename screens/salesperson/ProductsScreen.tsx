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
import { ProductModal } from '../../components/ProductModal';
import { EmptyState } from '../../components/EmptyState';
import { Product } from '../../types';
import { theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ProductsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { products, isLoading, fetchProducts, searchProducts } = useProductsStore();
  const { addItem } = useCartStore();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Async search handler
  useEffect(() => {
    let cancelled = false;

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const results = await searchProducts(searchQuery);
        if (!cancelled) {
          setFilteredProducts(results);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    };

    performSearch();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, products]);

  const handleAddToCart = async (product: Product, event: any) => {
    event.stopPropagation();
    try {
      await addItem(product);
      Alert.alert('Added to Cart', `${product.name} added to cart`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedProduct(null);
  };

  // Dummy save handler for salesperson (read-only, shouldn't be called)
  const handleSaveProduct = async () => {
    // This won't be called since isEditable is false
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
      <SafeAreaView />
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

      {/* Product Modal (Read-only for salesperson) */}
      <ProductModal
        visible={isModalVisible}
        product={selectedProduct}
        isEditable={false}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
      />
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