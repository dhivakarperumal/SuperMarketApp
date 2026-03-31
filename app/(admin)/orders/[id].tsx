import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  ChevronLeft,
  Package,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  ShoppingBag,
  Phone,
  Printer,
  User,
  RotateCcw,
  Clock,
  AlertCircle,
} from "lucide-react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../src/services/firebase/config";
import { usePrinter } from "../../../src/context/PrinterContext";
import { formatCurrency, formatDate } from "../../../src/utils/formatters";
import { useReturns, useReturnRequest } from "../../../src/hooks/useReturns";
import { useReceiptSettings } from "../../../src/hooks/useReceiptSettings";
import { getReturnStatusColor } from "../../../src/utils/returnUtils";
import { RETURN_REASONS, ReturnRequest } from "../../../src/types";
import Toast from "react-native-toast-message";

const Logo = require("../../../assets/images/logo.png");

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedWeight?: string;
  image?: string;
}

interface Order {
  id: string;
  orderId?: string;
  userId?: string;
  userEmail?: string;
  items: OrderItem[];
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  status: string;
  createdAt: any;
  address: {
    firstname: string;
    lastname: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: string;
  // Return tracking fields
  hasReturnRequest?: boolean;
  returnRequestId?: string;
  partiallyReturned?: boolean;
  returnedItems?: string[];
}

const statusOptions = [
  { key: "OrderPlaced", label: "Order Placed", color: "#3B82F6" },
  { key: "Shipped", label: "Shipped", color: "#8B5CF6" },
  { key: "OutofDelivery", label: "Out for Delivery", color: "#F59E0B" },
  { key: "Delivered", label: "Delivered", color: "#66BB6A" },
  { key: "Cancelled", label: "Cancelled", color: "#EF4444" },
];

export default function AdminOrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isConnected, printReceipt } = usePrinter();
  const { settings: receiptSettings } = useReceiptSettings();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      const docRef = doc(db, "orders", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!order || !id) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, "orders", id), {
        status: newStatus,
        updatedAt: new Date(),
      });
      setOrder({ ...order, status: newStatus });
      Toast.show({
        type: "success",
        text1: "Status Updated",
        text2: `Order status changed to ${statusOptions.find(s => s.key === newStatus)?.label}`,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update status",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!isConnected) {
      Toast.show({
        type: "error",
        text1: "Printer Not Connected",
        text2: "Please connect a printer in settings",
      });
      return;
    }

    if (!order) return;

    try {
      await printReceipt(
        {
          orderId: order.orderId || order.id.slice(0, 8).toUpperCase(),
          items: order.items,
          totals: {
            subtotal: order.subtotal || order.totalAmount,
            discount: 0,
            tax: 0,
            total: order.totalAmount,
          },
          paymentMethod: order.paymentMethod === "cod" ? "Cash on Delivery" : "Online",
          address: order.address,
        },
        receiptSettings
      );
      Toast.show({
        type: "success",
        text1: "Receipt Printed",
        text2: "Order receipt printed successfully",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Print Failed",
        text2: "Failed to print receipt",
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <View className="flex-row items-center px-4 py-4 bg-gray-100 border-b border-gray-200">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-800">Order Details</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Package size={64} color="#9CA3AF" />
          <Text className="text-gray-500 mt-4">Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
  const currentStatus = statusOptions.find(s => s.key === order.status);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-gray-100 border-b border-gray-200">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <View>
            <Text className="text-xl font-bold text-gray-800">Order Details</Text>
            <Text className="text-gray-500 text-sm">
              #{order.orderId || order.id.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={handlePrintReceipt}
          className={`p-2 rounded-lg ${isConnected ? "bg-green-100" : "bg-gray-200"}`}
        >
          <Printer size={22} color={isConnected ? "#66BB6A" : "#9CA3AF"} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 100) }}>
        {/* Current Status */}
        <View className="bg-white m-4 p-4 rounded-xl">
          <Text className="font-bold text-gray-800 mb-3">Current Status</Text>
          <View
            className="flex-row items-center p-3 rounded-xl"
            style={{ backgroundColor: `${currentStatus?.color}15` }}
          >
            {order.status === "Delivered" ? (
              <CheckCircle size={24} color={currentStatus?.color} />
            ) : order.status === "Cancelled" ? (
              <XCircle size={24} color={currentStatus?.color} />
            ) : (
              <Truck size={24} color={currentStatus?.color} />
            )}
            <Text
              className="ml-3 font-bold text-lg"
              style={{ color: currentStatus?.color }}
            >
              {currentStatus?.label}
            </Text>
          </View>
        </View>

        {/* Update Status */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-4">
          <Text className="font-bold text-gray-800 mb-3">Update Status</Text>
          <View className="flex-row flex-wrap">
            {statusOptions.map((status) => (
              <Pressable
                key={status.key}
                onPress={() => updateStatus(status.key)}
                disabled={updating || order.status === status.key}
                className={`px-4 py-2 rounded-xl mr-2 mb-2 border-2 ${
                  order.status === status.key
                    ? "border-primary bg-primary/10"
                    : "border-gray-200"
                }`}
                style={order.status === status.key ? { borderColor: status.color } : {}}
              >
                <Text
                  className={`font-medium ${
                    order.status === status.key ? "text-primary" : "text-gray-600"
                  }`}
                  style={order.status === status.key ? { color: status.color } : {}}
                >
                  {status.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {updating && (
            <ActivityIndicator size="small" color="#2E7D32" className="mt-2" />
          )}
        </View>

        {/* Customer Info */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-4">
          <View className="flex-row items-center mb-3">
            <User size={20} color="#2E7D32" />
            <Text className="ml-2 font-bold text-gray-800">Customer</Text>
          </View>
          <Text className="text-gray-800 font-medium">
            {order.address?.firstname} {order.address?.lastname}
          </Text>
          <Text className="text-gray-500 text-sm">{order.userEmail}</Text>
          <View className="flex-row items-center mt-2">
            <Phone size={16} color="#6B7280" />
            <Text className="ml-2 text-gray-600">{order.address?.phone}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-4">
          <View className="flex-row items-center mb-3">
            <MapPin size={20} color="#2E7D32" />
            <Text className="ml-2 font-bold text-gray-800">Delivery Address</Text>
          </View>
          <Text className="text-gray-600">
            {order.address?.street}
          </Text>
          <Text className="text-gray-600">
            {order.address?.city}, {order.address?.state} - {order.address?.pincode}
          </Text>
        </View>

        {/* Payment Info */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <CreditCard size={20} color="#2E7D32" />
              <Text className="ml-2 font-bold text-gray-800">Payment</Text>
            </View>
            <View className="px-3 py-1 bg-gray-100 rounded-full">
              <Text className="text-gray-600 font-medium">
                {order.paymentMethod === "cod" ? "COD" : "Online"}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-4">
          <Text className="font-bold text-gray-800 mb-4">
            Items ({order.items?.length || 0})
          </Text>
          {order.items?.map((item, index) => (
            <View
              key={index}
              className={`flex-row items-center py-3 ${
                index < order.items.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <View className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden">
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <ShoppingBag size={18} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-gray-800 font-medium" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {formatCurrency(item.price)} x {item.quantity}
                </Text>
              </View>
              <Text className="font-bold text-primary">
                {formatCurrency(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-4">
          <Text className="font-bold text-gray-800 mb-3">Summary</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Subtotal</Text>
            <Text className="font-medium">
              {formatCurrency(order.subtotal || order.totalAmount)}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Delivery</Text>
            <Text className="font-medium text-primary">
              {order.deliveryFee ? formatCurrency(order.deliveryFee) : "Free"}
            </Text>
          </View>
          <View className="flex-row justify-between pt-3 border-t border-gray-100">
            <Text className="text-lg font-bold text-gray-800">Total</Text>
            <Text className="text-lg font-bold text-primary">
              {formatCurrency(order.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Order Time */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-8">
          <Text className="text-gray-500 text-center">
            Order placed on {formatDate(orderDate)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
