import { Tabs } from "expo-router";
import { Home, ShoppingBag, ShoppingCart, Play, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CustomerTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#D1FAE5",
        tabBarStyle: {
          backgroundColor: "#1D5C45",
          borderTopWidth: 1,
          borderTopColor: "#16482F",
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
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, focused }) => (
            <ShoppingBag color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          title: "Reels",
          tabBarIcon: ({ color, focused }) => (
            <Play
              color={color}
              size={24}
              fill={focused ? color : "transparent"}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, focused }) => (
            <ShoppingCart color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => (
            <User color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      {/* Hidden tabs - still accessible but not in navbar */}
      <Tabs.Screen
        name="favorites"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
