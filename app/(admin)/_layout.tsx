import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { usePermissions } from "../../src/context/PermissionContext";

export default function AdminLayout() {
  const { isLoading, isAuthenticated } = useAuth();
  const { role, canAccessDashboard, canAccessBilling } = usePermissions();

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        router.replace("/(auth)/login");
        return;
      }

      // Customer trying to access admin area
      if (role === "customer") {
        router.replace("/(customer)/(tabs)");
        return;
      }

      // Only admin, manager, and cashier can access admin area
      if (!canAccessDashboard && !canAccessBilling) {
        router.replace("/(customer)/(tabs)");
        return;
      }
    }
  }, [isLoading, isAuthenticated, role, canAccessDashboard, canAccessBilling]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1D5A34" />
        <Text className="text-gray-500 mt-4">Loading...</Text>
      </View>
    );
  }

  // Don't render if not authenticated or wrong role
  if (!isAuthenticated || role === "customer") {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="orders/[id]" />
      <Stack.Screen name="products" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="printer" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="branches" />
      <Stack.Screen name="users" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="suppliers" />
      <Stack.Screen name="purchase-orders" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="offers" />
      <Stack.Screen name="reels" />
      <Stack.Screen name="whatsapp-orders" />
    </Stack>
  );
}
