import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  ChevronLeft,
  Package,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingBag,
  Phone,
  Star,
  RotateCcw,
  ChevronRight,
} from "lucide-react-native";
import { doc, getDoc } from "firebase/firestore";
import { Linking } from "react-native";
import { db } from "../../../src/services/firebase/config";
import { formatCurrency, formatDate } from "../../../src/utils/formatters";
import { checkReturnEligibility, ReturnEligibility } from "../../../src/utils/returnUtils";
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
  items: OrderItem[];
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  status: string;
  createdAt: any;
  updatedAt?: any;
  deliveredAt?: any;
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

const statusSteps = [
  { key: "OrderPlaced", label: "Order Placed", icon: Package },
  { key: "Shipped", label: "Shipped", icon: Truck },
  { key: "OutofDelivery", label: "Out for Delivery", icon: Truck },
  { key: "Delivered", label: "Delivered", icon: CheckCircle },
];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [returnEligibility, setReturnEligibility] = useState<ReturnEligibility>({ eligible: false });

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const docRef = doc(db, "orders", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const orderData = docSnap.data();
        const orderObj = {
          id: docSnap.id,
          items: orderData.items || [],
          totalAmount: orderData.totalAmount || 0,
          subtotal: orderData.subtotal || 0,
          deliveryFee: orderData.deliveryFee || 0,
          status: orderData.status || "OrderPlaced",
          createdAt: orderData.createdAt,
          updatedAt: orderData.updatedAt,
          deliveredAt: orderData.deliveredAt,
          address: orderData.address || {},
          paymentMethod: orderData.paymentMethod || "cod",
          orderId: orderData.orderId,
          hasReturnRequest: orderData.hasReturnRequest,
          returnRequestId: orderData.returnRequestId,
          partiallyReturned: orderData.partiallyReturned,
          returnedItems: orderData.returnedItems,
        } as Order;
        setOrder(orderObj);

        // Check return eligibility
        const eligibility = checkReturnEligibility(orderObj as any);
        setReturnEligibility(eligibility);
      } else {
        console.log("Order not found:", id);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status: string) => {
    const index = statusSteps.findIndex((s) => s.key === status);
    return index >= 0 ? index : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "#66BB6A";
      case "Cancelled":
        return "#EF4444";
      default:
        return "#1D5A34";
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1D5A34" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
        <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-200">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
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

  const getOrderDate = () => {
    if (!order.createdAt) return new Date();
    if (order.createdAt?.toDate) return order.createdAt.toDate();
    if (order.createdAt?.seconds) return new Date(order.createdAt.seconds * 1000);
    if (typeof order.createdAt === "string") return new Date(order.createdAt);
    return new Date();
  };

  const orderDate = getOrderDate();
  const currentStatusIndex = getStatusIndex(order.status || "OrderPlaced");
  const orderItems = order.items || [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />
      {/* Header */}
      <LinearGradient
        colors={["#1D5A34", "#164829"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
            <View>
              <Text className="text-xl font-bold text-white">Order Details</Text>
              <Text className="text-white/80 text-sm">
                #{order.orderId || order.id.slice(0, 8).toUpperCase()}
              </Text>
            </View>
          </View>
          <Image source={Logo} style={{ width: 40, height: 40, tintColor: '#FFFFFF' }} resizeMode="contain" />
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Order Status */}
        {order.status !== "Cancelled" ? (
          <View className="bg-white m-4 p-4 rounded-xl">
            <Text className="font-bold text-gray-800 mb-4">Order Status</Text>

            {/* Progress Line */}
            <View className="flex-row items-center justify-between mb-2 px-4">
              {statusSteps.map((_, index) => (
                <View key={`line-${index}`} className="flex-row items-center flex-1">
                  {index > 0 && (
                    <View
                      className={`flex-1 h-1 ${
                        index <= currentStatusIndex ? "bg-primary" : "bg-gray-200"
                      }`}
                    />
                  )}
                </View>
              ))}
            </View>

            {/* Status Icons */}
            <View className="flex-row items-start justify-between">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const IconComponent = step.icon;

                return (
                  <View key={step.key} className="items-center" style={{ width: 70 }}>
                    <View
                      className={`w-12 h-12 rounded-full items-center justify-center ${
                        isCompleted ? "bg-primary" : "bg-gray-200"
                      }`}
                      style={isCurrent ? {
                        shadowColor: "#1D5A34",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 4,
                      } : {}}
                    >
                      <IconComponent size={22} color={isCompleted ? "#fff" : "#9CA3AF"} />
                    </View>
                    <Text
                      className={`text-xs mt-2 text-center ${
                        isCompleted ? "text-primary font-semibold" : "text-gray-400"
                      }`}
                      numberOfLines={2}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View className="bg-red-50 m-4 p-4 rounded-xl flex-row items-center">
            <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center">
              <XCircle size={28} color="#EF4444" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-bold text-red-700 text-lg">Order Cancelled</Text>
              <Text className="text-red-600 text-sm">This order has been cancelled</Text>
            </View>
          </View>
        )}

        {/* Order Date */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-4">
          <View className="flex-row items-center">
            <Clock size={20} color="#6B7280" />
            <Text className="ml-3 text-gray-600">
              Ordered on {formatDate(orderDate)}
            </Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-4">
          <View className="flex-row items-center mb-3">
            <MapPin size={20} color="#1D5A34" />
            <Text className="ml-2 font-bold text-gray-800">Delivery Address</Text>
          </View>
          <Text className="text-gray-800 font-medium">
            {order.address?.firstname || ""} {order.address?.lastname || ""}
          </Text>
          <Text className="text-gray-500 mt-1">
            {order.address?.street || ""}
          </Text>
          <Text className="text-gray-500">
            {order.address?.city || ""}{order.address?.city && order.address?.state ? ", " : ""}{order.address?.state || ""}{order.address?.pincode ? ` - ${order.address.pincode}` : ""}
          </Text>
          {order.address?.phone && (
            <View className="flex-row items-center mt-2">
              <Phone size={16} color="#6B7280" />
              <Text className="ml-2 text-gray-600">{order.address.phone}</Text>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-4">
          <View className="flex-row items-center">
            <CreditCard size={20} color="#1D5A34" />
            <Text className="ml-2 font-bold text-gray-800">Payment Method</Text>
          </View>
          <Text className="text-gray-600 mt-2">
            {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
          </Text>
        </View>

        {/* Order Items */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-4">
          <Text className="font-bold text-gray-800 mb-4">
            Items ({orderItems.length})
          </Text>
          {orderItems.map((item, index) => (
            <View
              key={`${item.productId || index}-${index}`}
              className={`py-3 ${
                index < orderItems.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <View className="flex-row items-center">
                <View className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <ShoppingBag size={20} color="#9CA3AF" />
                    </View>
                  )}
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-800 font-medium" numberOfLines={2}>
                    {item.name || "Product"}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {item.selectedWeight ? `${item.selectedWeight} • ` : ""}
                    Qty: {item.quantity || 1}
                  </Text>
                </View>
                <Text className="font-bold text-primary">
                  {formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 1))}
                </Text>
              </View>
              {/* Review Button - Only show for delivered orders */}
              {order.status === "Delivered" && (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(customer)/orders/review",
                      params: {
                        productId: item.productId,
                        productName: item.name,
                        productImage: item.image || "",
                        orderId: order.id,
                      },
                    })
                  }
                  className="flex-row items-center justify-center mt-3 py-2 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <Star size={16} color="#F59E0B" />
                  <Text className="ml-2 text-yellow-700 font-semibold text-sm">
                    Write a Review
                  </Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-4">
          <Text className="font-bold text-gray-800 mb-4">Order Summary</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Subtotal</Text>
            <Text className="font-medium">
              {formatCurrency(Number(order.subtotal) || Number(order.totalAmount) || 0)}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Delivery Fee</Text>
            <Text className="font-medium text-primary">
              {Number(order.deliveryFee) > 0 ? formatCurrency(Number(order.deliveryFee)) : "Free"}
            </Text>
          </View>
          <View className="flex-row justify-between pt-3 border-t border-gray-100">
            <Text className="text-lg font-bold text-gray-800">Total</Text>
            <Text className="text-lg font-bold text-primary">
              {formatCurrency(Number(order.totalAmount) || 0)}
            </Text>
          </View>
        </View>

        {/* Return Section - Only show for Delivered orders */}
        {order.status === "Delivered" && (
          <View className="bg-white mx-4 p-4 rounded-xl mb-8">
            {returnEligibility.eligible ? (
              <>
                <View className="flex-row items-center mb-3">
                  <RotateCcw size={20} color="#1D5A34" />
                  <Text className="ml-2 font-bold text-gray-800">Need to Return?</Text>
                </View>
                <Text className="text-gray-600 text-sm mb-3">
                  You have {returnEligibility.daysRemaining} day{returnEligibility.daysRemaining !== 1 ? 's' : ''} left to request a return
                </Text>
                <Pressable
                  onPress={() => router.push({
                    pathname: "/(customer)/orders/return",
                    params: { orderId: order.id }
                  })}
                  className="bg-orange-500 py-3 rounded-xl flex-row items-center justify-center"
                >
                  <RotateCcw size={18} color="#fff" />
                  <Text className="ml-2 text-white font-semibold">Request Return</Text>
                </Pressable>
              </>
            ) : order.hasReturnRequest ? (
              <>
                <View className="flex-row items-center mb-2">
                  <Clock size={20} color="#F59E0B" />
                  <Text className="ml-2 font-bold text-gray-800">Return Requested</Text>
                </View>
                <Pressable
                  onPress={() => router.push({
                    pathname: "/(customer)/orders/return-status",
                    params: { returnId: order.returnRequestId }
                  })}
                  className="flex-row items-center"
                >
                  <Text className="text-primary font-medium">View Return Status</Text>
                  <ChevronRight size={16} color="#1D5A34" />
                </Pressable>
              </>
            ) : (
              <View className="flex-row items-center">
                <XCircle size={20} color="#9CA3AF" />
                <Text className="ml-2 text-gray-500 flex-1">
                  {returnEligibility.reason || "Return not available"}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Return Status for Returned orders */}
        {order.status === "Returned" && order.returnRequestId && (
          <View className="bg-green-50 mx-4 p-4 rounded-xl mb-8">
            <View className="flex-row items-center mb-2">
              <CheckCircle size={20} color="#66BB6A" />
              <Text className="ml-2 font-bold text-green-700">Return Completed</Text>
            </View>
            <Pressable
              onPress={() => router.push({
                pathname: "/(customer)/orders/return-status",
                params: { returnId: order.returnRequestId }
              })}
              className="flex-row items-center"
            >
              <Text className="text-green-600 font-medium">View Return Details</Text>
              <ChevronRight size={16} color="#66BB6A" />
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View className="bg-white px-4 py-4 border-t border-gray-100">
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push("/(customer)/orders")}
            className="flex-1 flex-row items-center justify-center py-3 bg-gray-100 rounded-xl"
          >
            <Package size={18} color="#374151" />
            <Text className="ml-2 text-gray-700 font-semibold">All Orders</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              try {
                const phoneNumber = "tel:+918940450960";
                const canOpen = await Linking.canOpenURL(phoneNumber);
                if (canOpen) {
                  await Linking.openURL(phoneNumber);
                } else {
                  Toast.show({
                    type: "info",
                    text1: "Contact Us",
                    text2: "Call us at: 8940450960",
                  });
                }
              } catch (error) {
                Toast.show({
                  type: "info",
                  text1: "Contact Us",
                  text2: "Call us at: 8940450960",
                });
              }
            }}
            className="flex-1 flex-row items-center justify-center py-3 bg-primary rounded-xl"
          >
            <Phone size={18} color="#fff" />
            <Text className="ml-2 text-white font-semibold">Need Help?</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
