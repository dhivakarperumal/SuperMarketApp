import { useState, useMemo, useEffect } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { Search, Filter, ChevronRight } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useOrders } from "../../../src/hooks/useOrders";
import { formatCurrency, formatDate } from "../../../src/utils/formatters";

const statusFilters = [
  { id: "all", label: "All" },
  { id: "OrderPlaced", label: "New" },
  { id: "Shipped", label: "Shipped" },
  { id: "OutofDelivery", label: "Out for Delivery" },
  { id: "Delivered", label: "Delivered" },
  { id: "Cancelled", label: "Cancelled" },
];

export default function OrdersScreen() {
  const { orders, loading } = useOrders();
  const { status } = useLocalSearchParams<{ status?: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Set initial filter from URL parameter
  useEffect(() => {
    if (status) {
      setSelectedStatus(status);
    }
  }, [status]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((order) => order.status === selectedStatus);
    }

    return filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [orders, searchQuery, selectedStatus]);

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

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />
      {/* Header */}
      <LinearGradient
        colors={["#1D5A34", "#164829"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
        <Text className="text-2xl font-bold text-white mb-4">Orders</Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search orders..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-gray-800"
          />
        </View>
      </LinearGradient>

      {/* Status Filters */}
      <View className="bg-white py-3 border-b border-gray-100">
        <FlashList
          data={statusFilters}
          horizontal
          showsHorizontalScrollIndicator={false}
          estimatedItemSize={80}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedStatus(item.id)}
              className={`px-4 py-2 mr-2 rounded-full ${
                selectedStatus === item.id ? "bg-primary" : "bg-gray-100"
              }`}
            >
              <Text
                className={`font-medium ${
                  selectedStatus === item.id ? "text-white" : "text-gray-600"
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Orders List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D5A34" />
        </View>
      ) : (
        <FlashList
          data={filteredOrders}
          estimatedItemSize={120}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const statusColor = getStatusColor(item.status);
            const orderDate = item.createdAt?.toDate?.() || new Date(item.createdAt);

            return (
              <Pressable
                onPress={() => router.push(`/(admin)/orders/${item.id}`)}
                className="bg-white p-4 rounded-xl mb-3"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="font-bold text-gray-800 text-base">
                        #{item.orderId || item.id.slice(0, 8)}
                      </Text>
                      <View className={`ml-2 px-2 py-1 rounded ${statusColor.bg}`}>
                        <Text className={`text-xs font-medium ${statusColor.text}`}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-500 text-sm mt-1">
                      {item.address?.firstname} {item.address?.lastname}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      {formatDate(orderDate)} • {item.items?.length || 0} items
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-bold text-primary text-lg">
                      {formatCurrency(item.totalAmount || 0)}
                    </Text>
                    <ChevronRight size={20} color="#9CA3AF" className="mt-2" />
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-gray-500 text-lg">No orders found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
