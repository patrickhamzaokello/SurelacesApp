// src/components/ProductModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product, Category } from '../types';
import { theme } from '../constants/theme';
import { useCategoriesStore } from '../store/categoriesStore';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ProductModalProps {
  visible: boolean;
  product: Product | null;
  isEditable: boolean; // true for owner, false for salesperson
  onClose: () => void;
  onSave: (data: Partial<Product>) => Promise<void>;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  visible,
  product,
  isEditable,
  onClose,
  onSave,
}) => {
  const { categories, fetchCategories } = useCategoriesStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!product); // true if creating new product

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    low_stock_threshold: '',
    barcode: '',
    image_url: '',
  });

  // Load categories when modal opens
  useEffect(() => {
    if (visible && categories.length === 0) {
      fetchCategories();
    }
  }, [visible]);

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        code: product.code || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price || '',
        cost: product.cost || '',
        stock: product.stock?.toString() || '',
        low_stock_threshold: product.low_stock_threshold?.toString() || '',
        barcode: product.barcode || '',
        image_url: product.image_url || '',
      });
      setIsEditing(false);
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        code: '',
        description: '',
        category: '',
        price: '',
        cost: '',
        stock: '',
        low_stock_threshold: '5',
        barcode: '',
        image_url: '',
      });
      setIsEditing(true);
    }
  }, [product, visible]);

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Product name is required');
      return;
    }
    if (!formData.code.trim()) {
      Alert.alert('Validation Error', 'Product code is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Validation Error', 'Valid price is required');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare data for API
      const dataToSave: Partial<Product> = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim(),
        category: formData.category || undefined,
        price: parseFloat(formData.price).toFixed(2),
        cost: formData.cost ? parseFloat(formData.cost).toFixed(2) : undefined,
        stock: formData.stock ? parseInt(formData.stock) : undefined,
        low_stock_threshold: formData.low_stock_threshold
          ? parseInt(formData.low_stock_threshold)
          : 5,
        barcode: formData.barcode.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
      };

      await onSave(dataToSave);
      setIsEditing(false);
      Alert.alert('Success', product ? 'Product updated successfully' : 'Product created successfully');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (product) {
      // Reset to original data
      setIsEditing(false);
      setFormData({
        name: product.name || '',
        code: product.code || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price || '',
        cost: product.cost || '',
        stock: product.stock?.toString() || '',
        low_stock_threshold: product.low_stock_threshold?.toString() || '',
        barcode: product.barcode || '',
        image_url: product.image_url || '',
      });
    } else {
      // Close modal if creating new product
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} >
        <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {product ? (isEditing ? 'Edit Product' : 'Product Details') : 'New Product'}
          </Text>
          {isEditable && product && !isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
              <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          {!isEditable && <View style={{ width: 24 }} />}
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter product name"
              editable={isEditing}
            />
          </View>

          {/* Code */}
          <View style={styles.field}>
            <Text style={styles.label}>Product Code *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={formData.code}
              onChangeText={(text) => setFormData({ ...formData, code: text })}
              placeholder="Enter product code"
              editable={isEditing}
              autoCapitalize="characters"
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, !isEditing && styles.inputDisabled]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter product description"
              editable={isEditing}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            {isEditing ? (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  enabled={isEditing}
                >
                  <Picker.Item label="Select a category" value="" />
                  {categories.map((cat) => (
                    <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                  ))}
                </Picker>
              </View>
            ) : (
              <Text style={styles.valueText}>
                {product?.category_name || 'No category'}
              </Text>
            )}
          </View>

          {/* Price and Cost */}
          <View style={styles.row}>
            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>Price (UGX) *</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
                editable={isEditing}
              />
            </View>

            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>Cost (UGX)</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={formData.cost}
                onChangeText={(text) => setFormData({ ...formData, cost: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
                editable={isEditing}
              />
            </View>
          </View>

          {/* Stock and Threshold */}
          <View style={styles.row}>
            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>Stock</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={formData.stock}
                onChangeText={(text) => setFormData({ ...formData, stock: text })}
                placeholder="0"
                keyboardType="number-pad"
                editable={isEditing}
              />
            </View>

            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>Low Stock Alert</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={formData.low_stock_threshold}
                onChangeText={(text) =>
                  setFormData({ ...formData, low_stock_threshold: text })
                }
                placeholder="5"
                keyboardType="number-pad"
                editable={isEditing}
              />
            </View>
          </View>

          {/* Barcode */}
          <View style={styles.field}>
            <Text style={styles.label}>Barcode</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={formData.barcode}
              onChangeText={(text) => setFormData({ ...formData, barcode: text })}
              placeholder="Enter barcode"
              editable={isEditing}
              keyboardType="number-pad"
            />
          </View>

          {/* Image URL */}
          <View style={styles.field}>
            <Text style={styles.label}>Image URL</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={formData.image_url}
              onChangeText={(text) => setFormData({ ...formData, image_url: text })}
              placeholder="https://example.com/image.jpg"
              editable={isEditing}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Product Info (View Mode) */}
          {product && !isEditing && (
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Product ID</Text>
              <Text style={styles.infoValue}>{product.id}</Text>

              {product.created_at && (
                <>
                  <Text style={styles.infoLabel}>Created</Text>
                  <Text style={styles.infoValue}>
                    {new Date(product.created_at).toLocaleDateString()}
                  </Text>
                </>
              )}

              {product.is_low_stock && (
                <View style={styles.lowStockBadge}>
                  <Ionicons name="warning" size={16} color={theme.colors.error} />
                  <Text style={styles.lowStockText}>Low Stock Alert</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        {isEditing && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {product ? 'Save Changes' : 'Create Product'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  editButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.gray700,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.black,
  },
  inputDisabled: {
    backgroundColor: theme.colors.gray50,
    color: theme.colors.gray600,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  valueText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.gray600,
    paddingVertical: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfField: {
    flex: 1,
  },
  infoSection: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.borderRadius.md,
  },
  infoLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.gray500,
    marginTop: theme.spacing.sm,
  },
  infoValue: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray700,
    marginTop: theme.spacing.xs,
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.error + '20',
    borderRadius: theme.borderRadius.sm,
  },
  lowStockText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.error,
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  button: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.gray600,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
});
