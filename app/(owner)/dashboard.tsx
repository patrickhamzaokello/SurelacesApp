// app/(salesperson)/home.tsx
import { OwnerDashboardScreen } from "@/screens/owner/DashboardScreen";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardMain() {
  return (
    <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <OwnerDashboardScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});
