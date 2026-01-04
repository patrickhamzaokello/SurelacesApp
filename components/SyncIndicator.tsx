// src/components/SyncIndicator.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSync } from "../hooks/useSync";
import { format } from "date-fns";
import { theme } from "@/constants/theme";

export const SyncIndicator: React.FC = () => {
  const { lastSyncTime, isSyncing, startSync, getSyncIndicator } = useSync();
  const indicator = getSyncIndicator();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={startSync}
      disabled={isSyncing}
    >
      <View style={styles.content}>
        {isSyncing ? (
          <ActivityIndicator size="small" color="#666" />
        ) : (
          <Text style={styles.icon}>{indicator.icon}</Text>
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.statusText, { color: indicator.color }]}>
            {indicator.text}
          </Text>
          {lastSyncTime && !isSyncing && (
            <Text style={styles.timeText}>
              {format(new Date(lastSyncTime), "h:mm a")}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});
