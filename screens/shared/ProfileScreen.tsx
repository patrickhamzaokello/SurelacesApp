// src/screens/shared/ProfileScreen.tsx
import { useInvoicesStore } from '@/store/invoicesStore';
import { format } from 'date-fns';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SyncIndicator } from '../../components/SyncIndicator';
import { useAuth } from '../../hooks/useAuth';
import { useSync } from '../../hooks/useSync';
import { theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ProfileScreen = () => {
  const { user, logout, isSalesperson, isOwner } = useAuth();
  const { lastSyncTime, startSync, isSyncing } = useSync();
  const handleLogout = async () => {
    const invoicesStore = useInvoicesStore.getState();
    const pendingCount = invoicesStore.getPendingInvoices().length;
    
    if (pendingCount > 0) {
      Alert.alert(
        'Unsynced Invoices',
        `You have ${pendingCount} invoice(s) that haven't been synced to the server. They will be lost if you log out now.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Try Sync',
            onPress: async () => {
              try {
                await invoicesStore.syncPendingInvoices();
                // Check again after sync
                const stillPending = invoicesStore.getPendingInvoices().length;
                if (stillPending === 0) {
                  await logout();
                } else {
                  Alert.alert('Sync Failed', 'Unable to sync invoices. Try again later or logout anyway?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Logout Anyway', onPress: logout, style: 'destructive' },
                  ]);
                }
              } catch (error) {
                Alert.alert('Sync Failed', 'Unable to sync invoices');
              }
            },
          },
          {
            text: 'Logout Anyway',
            onPress: logout,
            style: 'destructive',
          },
        ]
      );
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ]);
    }
  };

  const handleSync = async () => {
    try {
      await startSync();
      Alert.alert('Success', 'Data synced successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
       <SafeAreaView />
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{user?.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {isSalesperson ? 'Salesperson' : 'Store Owner'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Store Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Store Name</Text>
            <Text style={styles.infoValue}>{user?.store_name}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>User Role</Text>
            <Text style={styles.infoValue}>{isSalesperson ? 'Salesperson' : 'Store Owner'}</Text>
          </View>
        </View>

        {/* Sync Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Status</Text>
          <View style={styles.syncContainer}>
            <SyncIndicator />
            {lastSyncTime && (
              <Text style={styles.syncTime}>
                Last synced: {format(new Date(lastSyncTime), 'MMM d, yyyy h:mm a')}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.button, styles.syncButton]}
              onPress={handleSync}
              disabled={isSyncing}
            >
              <Text style={styles.buttonText}>
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>Surelaces POS</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Surelaces</Text>
          <Text style={styles.footerSubtext}>Point of Sale System</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatar: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  userDetails: {
    flex: 1,
  },
  name: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray500,
    marginBottom: theme.spacing.sm,
  },
  roleBadge: {
    backgroundColor: theme.colors.gray50,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: theme.typography.weights.medium,
  },
  infoValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.black,
  },
  syncContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  syncTime: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  button: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  syncButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  logoutButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.error,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoutButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.error,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: theme.spacing.xl,
  },
  footerText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray400,
    marginBottom: theme.spacing.xs,
  },
  footerSubtext: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray400,
  },
});