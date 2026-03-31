import { Tabs } from "expo-router";
import { Home, Play, ShoppingBag, ShoppingCart, User } from "lucide-react-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../../../src/context/CartContext";

export default function CustomerTabsLayout() {
  const insets = useSafeAreaInsets();
  const { cartCount } = useCart();

  return (
    <View style={{ flex: 1, backgroundColor: "#1D5A34" }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#86efac",
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: "#1D5A34",
            borderTopWidth: 1,
            borderTopColor: "#164829",
            paddingBottom: Math.max(insets.bottom, 10),
            paddingTop: 8,
            height: 60 + Math.max(insets.bottom, 10),
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
          },
          sceneStyle: {
            backgroundColor: "#F8FAF8",
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
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
            <Home color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, focused }) => (
            <ShoppingBag color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

       <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 28,
                height: 28,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingCart color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
              {cartCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -10,
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                    borderRadius: 9,
                    backgroundColor: "#EF4444",
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700" }}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </Text>
                </View>
              )}
            </View>
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
              size={22}
              fill={focused ? color : "transparent"}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
     
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => (
            <User color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </View>
  );
}
