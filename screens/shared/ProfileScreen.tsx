// src/screens/shared/ProfileScreen.tsx
import { useInvoicesStore } from '@/store/invoicesStore';
import { format } from 'date-fns';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SyncIndicator } from '../../components/SyncIndicator';
import { useAuth } from '../../hooks/useAuth';
import { useSync } from '../../hooks/useSync';

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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{user?.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {isSalesperson ? '👤 Salesperson' : '👑 Store Owner'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store Information</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Store Name</Text>
          <Text style={styles.infoValue}>{user?.store_name}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Status</Text>
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
            {isSyncing ? 'Syncing...' : '🔄 Sync Now'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={[styles.buttonText, styles.logoutButtonText]}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Sales App</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  syncTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  syncButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#F44336',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  logoutButtonText: {
    color: '#F44336',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});