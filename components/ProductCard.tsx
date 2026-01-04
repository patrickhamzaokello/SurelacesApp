// src/components/ProductCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Product } from '../types';
import { theme } from '../constants/theme';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onLongPress?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onLongPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.code}>{product.code}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>UGX {parseFloat(product.price).toFixed(2)}</Text>
          {product.stock !== undefined && (
            <Text style={styles.stock}>Stock: {product.stock}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  content: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  name: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
  },
  code: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
    fontFamily: 'monospace',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  stock: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray600,
    marginTop: theme.spacing.xs,
  },
});