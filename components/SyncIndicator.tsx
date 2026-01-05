// src/components/SyncIndicator.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSync } from "../hooks/useSync";
import { useSyncStore } from "../store/syncStore";
import { format, formatDistanceToNow } from "date-fns";
import { theme } from "@/constants/theme";

export const SyncIndicator: React.FC = () => {
  const { lastSyncTime, pendingInvoices, isSyncing, status, startSync } = useSync();
  const { syncProgress } = useSyncStore();

  const getStatusConfig = () => {
    if (isSyncing) {
      return {
        color: theme.colors.warning,
        bgColor: '#FEF3C7',
        icon: 'sync' as const,
        label: 'Syncing',
        showProgress: true,
      };
    }

    if (status === 'offline' || pendingInvoices > 0) {
      return {
        color: theme.colors.error,
        bgColor: '#FEE2E2',
        icon: 'cloud-offline' as const,
        label: pendingInvoices > 0 ? `${pendingInvoices} Pending` : 'Offline',
        showProgress: false,
      };
    }

    return {
      color: theme.colors.success,
      bgColor: '#D1FAE5',
      icon: 'checkmark-circle' as const,
      label: 'Synced',
      showProgress: false,
    };
  };

  const statusConfig = getStatusConfig();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: statusConfig.bgColor }]}
      onPress={startSync}
      disabled={isSyncing}
      activeOpacity={0.7}
    >
      {/* Status Row */}
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          {isSyncing ? (
            <ActivityIndicator size="small" color={statusConfig.color} />
          ) : (
            <Ionicons name={statusConfig.icon} size={20} color={statusConfig.color} />
          )}
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        {!isSyncing && (
          <View style={styles.actionHint}>
            <Text style={styles.actionText}>Tap to sync</Text>
            <Ionicons name="refresh" size={14} color={theme.colors.gray500} />
          </View>
        )}
      </View>

      {/* Progress Bar (when syncing) */}
      {isSyncing && syncProgress.stage !== 'idle' && (
        <View style={styles.progressSection}>
          <Text style={styles.progressMessage}>{syncProgress.message}</Text>
          {syncProgress.productsTotal > 0 && (
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(syncProgress.productsLoaded / syncProgress.productsTotal) * 100}%`,
                    backgroundColor: statusConfig.color,
                  },
                ]}
              />
            </View>
          )}
        </View>
      )}

      {/* Info Row */}
      {!isSyncing && (
        <View style={styles.infoRow}>
          {lastSyncTime ? (
            <>
              <Ionicons name="time-outline" size={12} color={theme.colors.gray500} />
              <Text style={styles.infoText}>
                Last synced {formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })}
              </Text>
            </>
          ) : (
            <Text style={styles.infoText}>Not synced yet</Text>
          )}
        </View>
      )}

      {/* Pending Invoices Badge */}
      {pendingInvoices > 0 && !isSyncing && (
        <View style={styles.pendingBadge}>
          <Ionicons name="warning" size={14} color={theme.colors.error} />
          <Text style={styles.pendingText}>
            {pendingInvoices} {pendingInvoices === 1 ? 'invoice' : 'invoices'} waiting to sync
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statusLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray600,
    fontWeight: theme.typography.weights.medium,
  },
  progressSection: {
    gap: theme.spacing.xs,
  },
  progressMessage: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray700,
    fontWeight: theme.typography.weights.medium,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gray500,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
  },
  pendingText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.error,
    fontWeight: theme.typography.weights.semibold,
  },
});
