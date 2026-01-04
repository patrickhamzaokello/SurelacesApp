// app/(salesperson)/invoices/_layout.tsx
import { theme } from "@/constants/theme";
import { Stack } from "expo-router";

export default function InvoicesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.white,
        },
        headerTintColor: theme.colors.black,
        headerTitleStyle: {
          fontWeight: theme.typography.weights.semibold,
          fontSize: theme.typography.sizes.lg,
        },
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Invoices",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Invoice Details",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
