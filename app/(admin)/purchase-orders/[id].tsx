import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Building2, Calendar, Package, Check, X, Send } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import { usePurchaseOrders } from "../../../src/hooks/usePurchaseOrders";
import { PurchaseOrder } from "../../../src/types";

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#F3F4F6", text: "#6B7280" },
  sent: { bg: "#FEF3C7", text: "#D97706" },
  partial: { bg: "#DBEAFE", text: "#2563EB" },
  received: { bg: "#D1FAE5", text: "#059669" },
  cancelled: { bg: "#FEE2E2", text: "#DC2626" },
};

export default function PurchaseOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { purchaseOrders, updatePOStatus, receiveItems, cancelPurchaseOrder, loading } = usePurchaseOrders();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!loading && id) {
      const po = purchaseOrders.find(p => p.id === id);
      setOrder(po || null);
    }
  }, [purchaseOrders, id, loading]);

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleSend = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await updatePOStatus(id, "sent");
      Toast.show({ type: "success", text1: "Success", text2: "Purchase order sent to supplier" });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message || "Failed to update" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await cancelPurchaseOrder(id);
      Toast.show({ type: "success", text1: "Cancelled", text2: "Purchase order has been cancelled" });
      router.back();
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message || "Failed to cancel" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceive = async () => {
    if (!id || !order) return;
    setActionLoading(true);
    try {
      // Mark all items as received
      const receivedItems = order.items.map(item => ({
        productId: item.productId,
        receivedQty: item.pendingQty,
      }));
      await receiveItems(id, receivedItems);
      Toast.show({ type: "success", text1: "Received", text2: "Items have been added to inventory" });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message || "Failed to receive" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#1D5A34" />
        <Text className="text-gray-500 mt-4">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
        <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-800">Order Not Found</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Package size={48} color="#9CA3AF" />
          <Text className="text-gray-500 mt-4">Purchase order not found</Text>
        </View>
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
            <Text className="text-xl font-bold text-gray-800">{order.poNumber}</Text>
            <View
              className="px-2 py-0.5 rounded-full mt-1 self-start"
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
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Order Info */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <Building2 size={18} color="#1D5A34" />
            <Text className="text-gray-800 font-semibold ml-2">{order.supplierName}</Text>
          </View>
          <View className="flex-row items-center">
            <Calendar size={16} color="#9CA3AF" />
            <Text className="text-gray-500 ml-2">{formatDate(order.createdAt)}</Text>
          </View>
          {order.expectedDate && (
            <View className="flex-row items-center mt-2">
              <Calendar size={16} color="#1D5A34" />
              <Text className="text-gray-500 ml-2">Expected: {formatDate(order.expectedDate)}</Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-gray-800 font-semibold mb-4">Order Items</Text>

          {order.items?.map((item, index) => (
            <View
              key={index}
              className={`flex-row items-center justify-between py-3 ${
                index < order.items.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center">
                  <Package size={16} color="#9CA3AF" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-800 font-medium">{item.productName}</Text>
                  <Text className="text-gray-500 text-sm">
                    {item.orderedQty} qty × ₹{item.unitPrice}
                  </Text>
                  {item.receivedQty > 0 && (
                    <Text className="text-green-600 text-xs">
                      Received: {item.receivedQty} | Pending: {item.pendingQty}
                    </Text>
                  )}
                </View>
              </View>
              <Text className="text-gray-800 font-semibold">₹{item.totalAmount?.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View className="bg-white rounded-2xl p-4">
          <Text className="text-gray-800 font-semibold mb-4">Order Summary</Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Subtotal</Text>
            <Text className="text-gray-800">₹{order.subtotal?.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Tax</Text>
            <Text className="text-gray-800">₹{order.taxAmount?.toLocaleString()}</Text>
          </View>
          {order.discountAmount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">Discount</Text>
              <Text className="text-green-600">-₹{order.discountAmount?.toLocaleString()}</Text>
            </View>
          )}
          <View className="flex-row justify-between pt-3 border-t border-gray-100">
            <Text className="text-gray-800 font-bold text-lg">Total</Text>
            <Text className="text-primary font-bold text-lg">₹{order.totalAmount?.toLocaleString()}</Text>
          </View>

          {order.paidAmount > 0 && (
            <View className="flex-row justify-between mt-2">
              <Text className="text-gray-500">Paid</Text>
              <Text className="text-green-600">₹{order.paidAmount?.toLocaleString()}</Text>
            </View>
          )}
          {order.dueAmount > 0 && (
            <View className="flex-row justify-between mt-2">
              <Text className="text-gray-500">Due</Text>
              <Text className="text-red-600 font-semibold">₹{order.dueAmount?.toLocaleString()}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Actions */}
      {order.status === "draft" && (
        <View className="flex-row px-4 py-4 bg-white border-t border-gray-100">
          <Pressable
            onPress={handleCancel}
            disabled={actionLoading}
            className="flex-1 flex-row items-center justify-center bg-red-50 py-4 rounded-xl mr-2"
          >
            <X size={18} color="#EF4444" />
            <Text className="text-red-500 font-semibold ml-2">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSend}
            disabled={actionLoading}
            className="flex-1 flex-row items-center justify-center bg-primary py-4 rounded-xl ml-2"
          >
            <Send size={18} color="#fff" />
            <Text className="text-white font-semibold ml-2">Send to Supplier</Text>
          </Pressable>
        </View>
      )}

      {order.status === "sent" && (
        <View className="flex-row px-4 py-4 bg-white border-t border-gray-100">
          <Pressable
            onPress={handleCancel}
            disabled={actionLoading}
            className="flex-1 flex-row items-center justify-center bg-red-50 py-4 rounded-xl mr-2"
          >
            <X size={18} color="#EF4444" />
            <Text className="text-red-500 font-semibold ml-2">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleReceive}
            disabled={actionLoading}
            className="flex-1 flex-row items-center justify-center bg-primary py-4 rounded-xl ml-2"
          >
            <Check size={18} color="#fff" />
            <Text className="text-white font-semibold ml-2">Mark Received</Text>
          </Pressable>
        </View>
      )}

      {order.status === "partial" && (
        <View className="px-4 py-4 bg-white border-t border-gray-100">
          <Pressable
            onPress={handleReceive}
            disabled={actionLoading}
            className="flex-row items-center justify-center bg-primary py-4 rounded-xl"
          >
            <Package size={18} color="#fff" />
            <Text className="text-white font-semibold ml-2">Receive Remaining Items</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
