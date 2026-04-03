import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  ShoppingBag,
} from "lucide-react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../src/services/firebase/config";
import { useAuth } from "../../../src/context/AuthContext";
import { formatCurrency, formatDate } from "../../../src/utils/formatters";

const Logo = require("../../../assets/images/logo.png");

interface Order {
  id: string;
  orderId?: string;
  items: any[];
  totalAmount: number;
  status: string;
  createdAt: any;
  address: any;
}

export default function CustomerOrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      // Sort locally by createdAt descending to avoid composite index requirement
      const getDate = (createdAt: any) => {
        if (!createdAt) return new Date(0);
        if (createdAt?.toDate) return createdAt.toDate();
        if (createdAt?.seconds) return new Date(createdAt.seconds * 1000);
        if (typeof createdAt === "string") return new Date(createdAt);
        return new Date(0);
      };
      ordersData.sort((a, b) => {
        const dateA = getDate(a.createdAt);
        const dateB = getDate(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return { bg: "bg-green-100", text: "text-green-700" };
      case "Cancelled":
        return { bg: "bg-red-100", text: "text-red-700" };
      case "OrderPlaced":
        return { bg: "bg-blue-100", text: "text-blue-700" };
      case "Shipped":
        return { bg: "bg-purple-100", text: "text-purple-700" };
      case "OutofDelivery":
        return { bg: "bg-yellow-100", text: "text-yellow-700" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700" };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OrderPlaced":
        return "Order Placed";
      case "OutofDelivery":
        return "Out for Delivery";
      default:
        return status;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]" edges={["top","bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />
      {/* Header */}
      <View}}
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </Pressable>
            <Text className="text-xl font-bold text-white">My Orders</Text>
          </View>
          <Image source={Logo} style={{ width: 40, height: 40, tintColor: '#FFFFFF' }} resizeMode="contain" />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D5A34" />
        </View>
      ) : orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <View className="bg-gray-100 p-6 rounded-full mb-4">
            <Package size={48} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-semibold text-gray-800 mb-2">No orders yet</Text>
          <Text className="text-gray-500 text-center mb-6">
            Your order history will appear here once you place an order
          </Text>
          <Pressable
            onPress={() => router.push("/(customer)/(tabs)/shop")}
            className="bg-primary px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Start Shopping</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={orders}
          estimatedItemSize={150}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const statusColor = getStatusColor(item.status || "OrderPlaced");
            const getOrderDate = (createdAt: any) => {
              if (!createdAt) return new Date();
              if (createdAt?.toDate) return createdAt.toDate();
              if (createdAt?.seconds) return new Date(createdAt.seconds * 1000);
              if (typeof createdAt === "string") return new Date(createdAt);
              return new Date();
            };
            const orderDate = getOrderDate(item.createdAt);
            const firstItem = item.items?.[0];

            return (
              <Pressable
                onPress={() => router.push(`/(customer)/orders/${item.id}`)}
                className="bg-white rounded-xl mb-4 overflow-hidden"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                {/* Order Header */}
                <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                  <View>
                    <Text className="font-bold text-gray-800">
                      #{item.orderId || item.id.slice(0, 8).toUpperCase()}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      {formatDate(orderDate)}
                    </Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${statusColor.bg}`}>
                    <Text className={`text-sm font-medium ${statusColor.text}`}>
                      {getStatusLabel(item.status || "OrderPlaced")}
                    </Text>
                  </View>
                </View>

                {/* Order Items Preview */}
                <View className="flex-row items-center p-4">
                  <View className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                    {firstItem?.image ? (
                      <Image
                        source={{ uri: firstItem.image }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <ShoppingBag size={24} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-gray-800 font-medium" numberOfLines={1}>
                      {firstItem?.name || "Order Items"}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      {item.items?.length === 1
                        ? "1 item"
                        : `${item.items?.length || 0} items`}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-bold text-primary text-lg">
                      {formatCurrency(Number(item.totalAmount) || 0)}
                    </Text>
                    <ChevronRight size={20} color="#9CA3AF" style={{ marginTop: 4 }} />
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
