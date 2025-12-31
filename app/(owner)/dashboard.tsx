// app/(salesperson)/home.tsx
import { OwnerDashboardScreen } from '@/screens/owner/DashboardScreen';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function DashboardMain() {
  return (
    <View style={styles.container}>
      <OwnerDashboardScreen />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  }
})