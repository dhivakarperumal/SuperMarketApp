import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  FolderOpen,
  Receipt,
  Settings,
} from "lucide-react-native";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePermissions } from "../../../src/context/PermissionContext";

export default function AdminTabsLayout() {
  const insets = useSafeAreaInsets();
  const {
    role,
    hasPermission,
    canAccessDashboard,
    canAccessBilling
  } = usePermissions();

  // Cashier-only mode - show only billing
  const isCashierOnly = role === "cashier";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2E7D32",
        tabBarInactiveTintColor: "#cccccc",
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopWidth: 1,
          borderTopColor: "#333333",
          paddingBottom: Math.max(insets.bottom, 9),
          paddingTop: 8,
          height: 60 + Math.max(insets.bottom, 9),
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <LayoutDashboard color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
          ),
          // Hide for cashiers
          href: canAccessDashboard ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, focused }) => (
            <ClipboardList color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
          ),
          // Hide for cashiers
          href: hasPermission("orders.view") && !isCashierOnly ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, focused }) => (
            <Package color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
          ),
          // Hide for cashiers
          href: hasPermission("products.view") && !isCashierOnly ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          tabBarIcon: ({ color, focused }) => (
            <FolderOpen color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
          ),
          // Hide for cashiers
          href: hasPermission("categories.view") && !isCashierOnly ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: "Billing",
          tabBarIcon: ({ color, focused }) => (
            <Receipt color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
          ),
          // Show for admin and cashier, hide for manager
          href: canAccessBilling ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Settings color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
          ),
          // Hide for cashiers
          href: hasPermission("settings.view") && !isCashierOnly ? undefined : null,
        }}
      />
    </Tabs>
  );
}
