// components/CartIconWithBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/store/cartStore';
import { theme } from '@/constants/theme';

interface CartIconWithBadgeProps {
  color: string;
  size: number;
  focused: boolean;
}

export const CartIconWithBadge: React.FC<CartIconWithBadgeProps> = ({ color, size, focused }) => {
  const { items } = useCartStore();
  
  // Calculate total items in cart
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <View style={styles.container}>
      <Ionicons
        name={focused ? 'bag' : 'bag-outline'}
        size={size}
        color={color}
      />
      {itemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {itemCount > 99 ? '99+' : itemCount.toString()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});