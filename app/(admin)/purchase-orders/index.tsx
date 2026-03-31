import { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Plus, Search, Package, Calendar, Building2 } from "lucide-react-native";
import { router } from "expo-router";
import { usePurchaseOrders } from "../../../src/hooks/usePurchaseOrders";

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#F3F4F6", text: "#6B7280" },
  sent: { bg: "#FEF3C7", text: "#D97706" },
  partial: { bg: "#DBEAFE", text: "#2563EB" },
  received: { bg: "#D1FAE5", text: "#059669" },
  cancelled: { bg: "#FEE2E2", text: "#DC2626" },
};

export default function PurchaseOrdersScreen() {
  const { purchaseOrders, loading } = usePurchaseOrders();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = purchaseOrders.filter((o) =>
    o.poNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.supplierName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text className="text-gray-500 mt-4">Loading purchase orders...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <View>
            <Text className="text-xl font-bold text-gray-800">Purchase Orders</Text>
            <Text className="text-gray-500 text-sm">{purchaseOrders.length} orders</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/(admin)/purchase-orders/add")}
          className="bg-primary p-2.5 rounded-full"
        >
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Search */}
      <View className="px-4 py-3 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search orders..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-gray-800"
          />
        </View>
      </View>

      {/* Orders List */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {filteredOrders.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Package size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-center">
              {searchQuery ? "No orders found" : "No purchase orders yet.\nTap + to create one."}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <Pressable
              key={order.id}
              onPress={() => router.push(`/(admin)/purchase-orders/${order.id}`)}
              className="bg-white rounded-2xl p-4 mb-3"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                    <Package size={20} color="#3B82F6" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-gray-800 font-semibold">{order.poNumber}</Text>
                    <View className="flex-row items-center mt-1">
                      <Building2 size={12} color="#9CA3AF" />
                      <Text className="text-gray-500 text-sm ml-1">{order.supplierName}</Text>
                    </View>
                  </View>
                </View>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: statusColors[order.status]?.bg || "#F3F4F6" }}
                >
                  <Text
                    className="text-xs font-semibold capitalize"
                    style={{ color: statusColors[order.status]?.text || "#6B7280" }}
                  >
                    {order.status}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                <View className="flex-row items-center">
                  <Calendar size={14} color="#9CA3AF" />
                  <Text className="text-gray-500 text-sm ml-1">{formatDate(order.createdAt)}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-gray-500 text-sm">{order.items?.length || 0} items</Text>
                  <Text className="text-gray-300 mx-2">|</Text>
                  <Text className="text-primary font-bold">₹{order.totalAmount?.toLocaleString() || 0}</Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
