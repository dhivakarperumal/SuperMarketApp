import { router } from "expo-router";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  IndianRupee,
  MessageCircle,
  Package,
  Plus,
  ShoppingCart,
  Tag,
  TrendingUp,
  Truck,
  XCircle
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../src/context/AuthContext";
import { useOrders } from "../../../src/hooks/useOrders";
import { useProducts } from "../../../src/hooks/useProducts";
import { useWhatsAppPendingCount } from "../../../src/hooks/useWhatsAppOrders";
import { formatCurrency } from "../../../src/utils/formatters";
const Logo = require("../../../assets/images/logo.png");

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const { orders, loading: ordersLoading } = useOrders();
  const { products, loading: productsLoading } = useProducts();
  const { user, userProfile } = useAuth();
  const { count: whatsappPendingCount, loading: whatsappLoading } = useWhatsAppPendingCount();
  const [refreshing, setRefreshing] = useState(false);

  // Get display name from userProfile or user object
  const displayName = userProfile?.displayName || user?.displayName || "Admin";

  // Calculate stats
  const today = new Date();
  const todayOrders = orders.filter((order) => {
    const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
    return orderDate.toDateString() === today.toDateString();
  });

  const thisMonthOrders = orders.filter((order) => {
    const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
    return (
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    );
  });

  const pendingOrders = orders.filter(
    (order) => order.status === "OrderPlaced"
  );

  const shippedOrders = orders.filter(
    (order) => order.status === "Shipped" || order.status === "OutofDelivery"
  );

  const completedOrders = orders.filter(
    (order) => order.status === "Delivered"
  );

  const cancelledOrders = orders.filter(
    (order) => order.status === "Cancelled"
  );

  const lowStockProducts = products.filter((product) => {
    const stock = product.stock || 0;
    const unit = product.stockUnit || "pcs";
    if (unit === "g" || unit === "ml") {
      return stock < 2000;
    }
    return stock < 3;
  });

  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + (order.totalAmount || 0),
    0
  );

  const todayRevenue = todayOrders
    .filter((order) => order.status === "Delivered")
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  const monthRevenue = thisMonthOrders
    .filter((order) => order.status === "Delivered")
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const recentOrders = [...orders]
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Delivered":
        return { icon: CheckCircle, color: "#66BB6A", bg: "#E8F5E9", label: "Delivered" };
      case "Cancelled":
        return { icon: XCircle, color: "#EF4444", bg: "#FEE2E2", label: "Cancelled" };
      case "Shipped":
        return { icon: Truck, color: "#8B5CF6", bg: "#EDE9FE", label: "Shipped" };
      case "OutofDelivery":
        return { icon: Truck, color: "#F59E0B", bg: "#FEF3C7", label: "Out for Delivery" };
      default:
        return { icon: Clock, color: "#3B82F6", bg: "#DBEAFE", label: "New Order" };
    }
  };

  const formatOrderDate = (createdAt: any) => {
    const date = createdAt?.toDate?.() || new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (ordersLoading || productsLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={["top","bottom"]}>
        <ActivityIndicator size="large" color="#1D5A34" />
        <Text className="text-gray-500 mt-4">Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Gradient */}
        <View
          className="px-5 pt-4 pb-24"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Image
                source={Logo}
                style={{ width: 45, height: 45, marginRight: 12 }}
                resizeMode="contain"
              />
              <View>
                <Text className="text-white/80 text-sm">Welcome back</Text>
                <Text className="text-white text-xl font-bold">{displayName}</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              {/* Low Stock Alert */}
              <Pressable
                onPress={() => router.push("/(admin)/inventory")}
                className="relative w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mr-2"
              >
                <Package size={22} color="#fff" />
                {lowStockProducts.length > 0 && (
                  <View className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full items-center justify-center border-2 border-white">
                    <Text className="text-white text-xs font-bold">
                      {lowStockProducts.length > 9 ? "9+" : lowStockProducts.length}
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* WhatsApp Orders */}
              <Pressable
                onPress={() => router.push("/(admin)/whatsapp-orders")}
                className="relative w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mr-2"
              >
                <MessageCircle size={22} color="#fff" />
                {whatsappPendingCount > 0 && (
                  <View className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full items-center justify-center border-2 border-white">
                    <Text className="text-white text-xs font-bold">
                      {whatsappPendingCount > 9 ? "9+" : whatsappPendingCount}
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Pending Orders Bell */}
              <Pressable
                onPress={() => router.push("/(admin)/(tabs)/orders?status=OrderPlaced")}
                className="relative w-12 h-12 bg-white/20 rounded-2xl items-center justify-center"
              >
                <Bell size={22} color="#fff" />
                {pendingOrders.length > 0 && (
                  <View className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full items-center justify-center border-2 border-white">
                    <Text className="text-white text-xs font-bold">
                      {pendingOrders.length > 9 ? "9+" : pendingOrders.length}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          {/* Date Badge */}
          <View className="flex-row items-center mt-4">
            <Calendar size={14} color="rgba(255,255,255,0.7)" />
            <Text className="text-white/70 text-sm ml-2">
              {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Stats Cards - Overlapping Header */}
        <View className="px-4 -mt-16">
          {/* Today's Summary Card */}
          <View
            className="bg-white rounded-3xl p-5 mb-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-green-100 rounded-md items-center justify-center">
                  <TrendingUp size={20} color="#1D5A34" />
                </View>
                <Text className="text-gray-800 font-bold text-lg ml-3">Today's Overview</Text>
              </View>
              <View className="bg-green-50 px-3 py-1 rounded-full">
                <Text className="text-green-600 text-xs font-semibold">LIVE</Text>
              </View>
            </View>

            <View className="flex-row">
              <View className="flex-1 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 mr-2">
                <Text className="text-green-600 text-sm font-medium">Orders</Text>
                <Text className="text-3xl font-bold text-gray-800 mt-1">{todayOrders.length}</Text>
                <Text className="text-gray-500 text-xs mt-1">
                  {pendingOrders.length} pending
                </Text>
              </View>
              <View className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 ml-2">
                <Text className="text-blue-600 text-sm font-medium">Revenue</Text>
                <Text className="text-2xl font-bold text-gray-800 mt-1" numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(todayRevenue)}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  From {todayOrders.filter(o => o.status === "Delivered").length} delivered
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View className="flex-row flex-wrap justify-between">
            {/* Total Orders */}
            <Pressable
              onPress={() => router.push("/(admin)/(tabs)/orders")}
              className="w-[48%] bg-white rounded-2xl p-4 mb-3"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}
            >
              <View
                className="w-11 h-11 rounded-md items-center justify-center mb-3"
              >
                <ShoppingCart size={22} color="#fff" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">{orders.length}</Text>
              <Text className="text-gray-500 text-sm">Total Orders</Text>
              <View className="flex-row items-center mt-2">
                <TrendingUp size={12} color="#1D5A34" />
                <Text className="text-green-600 text-xs ml-1">{thisMonthOrders.length} this month</Text>
              </View>
            </Pressable>

            {/* Products */}
            <Pressable
              onPress={() => router.push("/(admin)/(tabs)/products")}
              className="w-[48%] bg-white rounded-2xl p-4 mb-3"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}
            >
              <View
                className="w-11 h-11 rounded-md items-center justify-center mb-3"
              >
                <Package size={22} color="#fff" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">{products.length}</Text>
              <Text className="text-gray-500 text-sm">Products</Text>
              <View className="flex-row items-center mt-2">
                {lowStockProducts.length > 0 ? (
                  <>
                    <AlertTriangle size={12} color="#EF4444" />
                    <Text className="text-red-500 text-xs ml-1">{lowStockProducts.length} low stock</Text>
                  </>
                ) : (
                  <>
                    <CheckCircle size={12} color="#66BB6A" />
                    <Text className="text-green-600 text-xs ml-1">All stocked</Text>
                  </>
                )}
              </View>
            </Pressable>

            {/* Revenue */}
            <Pressable
              className="w-[48%] bg-white rounded-2xl p-4 mb-3"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}
            >
              <View
                className="w-11 h-11 rounded-md items-center justify-center mb-3"
              >
                <IndianRupee size={22} color="#fff" />
              </View>
              <Text className="text-xl font-bold text-gray-800" numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(totalRevenue)}
              </Text>
              <Text className="text-gray-500 text-sm">Total Revenue</Text>
              <View className="flex-row items-center mt-2">
                <TrendingUp size={12} color="#10B981" />
                <Text className="text-emerald-600 text-xs ml-1">{formatCurrency(monthRevenue)} this month</Text>
              </View>
            </Pressable>

            {/* WhatsApp Orders */}
            <Pressable
              onPress={() => router.push("/(admin)/whatsapp-orders")}
              className="w-[48%] bg-white rounded-2xl p-4 mb-3"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}
            >
              <View
                className="w-11 h-11 rounded-md items-center justify-center mb-3"
              >
                <MessageCircle size={22} color="#fff" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">
                {whatsappLoading ? "-" : whatsappPendingCount}
              </Text>
              <Text className="text-gray-500 text-sm">WhatsApp Orders</Text>
              <View className="flex-row items-center mt-2">
                {whatsappPendingCount > 0 ? (
                  <>
                    <AlertTriangle size={12} color="#F59E0B" />
                    <Text className="text-amber-600 text-xs ml-1">Needs attention</Text>
                  </>
                ) : (
                  <>
                    <CheckCircle size={12} color="#66BB6A" />
                    <Text className="text-green-600 text-xs ml-1">All processed</Text>
                  </>
                )}
              </View>
            </Pressable>
          </View>
        </View>

        {/* Order Status Pills */}
        <View className="px-4 mt-2">
          <View
            className="bg-white rounded-2xl p-4"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}
          >
            <Text className="font-bold text-gray-800 text-base mb-4">Order Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Pressable
                onPress={() => router.push("/(admin)/(tabs)/orders?status=OrderPlaced")}
                className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 mr-3 items-center min-w-[80px]"
              >
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mb-2">
                  <Clock size={20} color="#3B82F6" />
                </View>
                <Text className="text-2xl font-bold text-blue-600">{pendingOrders.length}</Text>
                <Text className="text-blue-600 text-xs font-medium">New</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/(admin)/(tabs)/orders?status=Shipped")}
                className="bg-purple-50 border border-purple-100 rounded-2xl px-5 py-3 mr-3 items-center min-w-[80px]"
              >
                <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mb-2">
                  <Truck size={20} color="#8B5CF6" />
                </View>
                <Text className="text-2xl font-bold text-purple-600">{shippedOrders.length}</Text>
                <Text className="text-purple-600 text-xs font-medium">Shipping</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/(admin)/(tabs)/orders?status=Delivered")}
                className="bg-green-50 border border-green-100 rounded-2xl px-5 py-3 mr-3 items-center min-w-[80px]"
              >
                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mb-2">
                  <CheckCircle size={20} color="#66BB6A" />
                </View>
                <Text className="text-2xl font-bold text-green-600">{completedOrders.length}</Text>
                <Text className="text-green-600 text-xs font-medium">Delivered</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/(admin)/(tabs)/orders?status=Cancelled")}
                className="bg-red-50 border border-red-100 rounded-2xl px-5 py-3 items-center min-w-[80px]"
              >
                <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mb-2">
                  <XCircle size={20} color="#EF4444" />
                </View>
                <Text className="text-2xl font-bold text-red-500">{cancelledOrders.length}</Text>
                <Text className="text-red-500 text-xs font-medium">Cancelled</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Pressable
            onPress={() => router.push("/(admin)/(tabs)/products")}
            className="mx-4 mt-4"
          >
            <View
              className="rounded-2xl p-4 border border-red-200"
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-red-500 rounded-2xl items-center justify-center">
                  <AlertTriangle size={26} color="#fff" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-red-800 font-bold text-lg">Low Stock Alert!</Text>
                  <Text className="text-red-600 text-sm mt-1">
                    {lowStockProducts.length} product{lowStockProducts.length > 1 ? "s" : ""} need restocking
                  </Text>
                </View>
                <View className="w-10 h-10 bg-red-500/20 rounded-full items-center justify-center">
                  <ChevronRight size={20} color="#EF4444" />
                </View>
              </View>
            </View>
          </Pressable>
        )}

        {/* Recent Orders */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">Recent Orders</Text>
            <Pressable
              onPress={() => router.push("/(admin)/(tabs)/orders")}
              className="flex-row items-center bg-green-50 px-4 py-2 rounded-full"
            >
              <Text className="text-green-600 font-semibold text-sm mr-1">View All</Text>
              <ChevronRight size={16} color="#1D5A34" />
            </Pressable>
          </View>

          {recentOrders.length > 0 ? (
            recentOrders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              return (
                <Pressable
                  key={order.id}
                  onPress={() => router.push(`/(admin)/orders/${order.id}`)}
                  className="bg-white rounded-2xl mb-3 overflow-hidden"
                  style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
                >
                  <View className="p-4">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="font-bold text-gray-800 text-lg">
                            #{order.orderId || order.id.slice(0, 8).toUpperCase()}
                          </Text>
                        </View>
                        <Text className="text-gray-500 text-sm mt-1">
                          {order.address?.firstname} {order.address?.lastname}
                        </Text>
                        <View className="flex-row items-center mt-2">
                          <View className="bg-gray-100 px-2 py-1 rounded-lg mr-2">
                            <Text className="text-gray-600 text-xs">
                              {order.items?.length || 0} items
                            </Text>
                          </View>
                          <Text className="text-gray-400 text-xs">
                            {formatOrderDate(order.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="font-bold text-xl text-gray-800">
                          {formatCurrency(order.totalAmount || 0)}
                        </Text>
                        <View
                          className="flex-row items-center px-3 py-1.5 rounded-full mt-2"
                          style={{ backgroundColor: statusConfig.bg }}
                        >
                          <StatusIcon size={14} color={statusConfig.color} />
                          <Text
                            className="text-xs font-semibold ml-1"
                            style={{ color: statusConfig.color }}
                          >
                            {statusConfig.label}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  {/* Progress Bar */}
                  <View className="h-1" style={{ backgroundColor: statusConfig.bg }}>
                    <View
                      className="h-full"
                      style={{
                        backgroundColor: statusConfig.color,
                        width: order.status === "Delivered" ? "100%" :
                          order.status === "OutofDelivery" ? "75%" :
                            order.status === "Shipped" ? "50%" :
                              order.status === "Cancelled" ? "100%" : "25%"
                      }}
                    />
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View className="bg-white p-10 rounded-3xl items-center" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <ShoppingCart size={36} color="#9CA3AF" />
              </View>
              <Text className="text-gray-800 font-semibold text-lg">No Orders Yet</Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">
                Orders will appear here once customers start ordering
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="px-4 mt-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            <Pressable
              onPress={() => router.push("/(admin)/(tabs)/billing")}
              className="w-[48%] bg-white rounded-2xl p-4 mb-3 flex-row items-center"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
            >
              <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center">
                <ShoppingCart size={20} color="#1D5A34" />
              </View>
              <Text className="text-gray-700 font-semibold ml-3">New Bill</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(admin)/products/add")}
              className="w-[48%] bg-white rounded-2xl p-4 mb-3 flex-row items-center"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
            >
              <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center">
                <Plus size={20} color="#3B82F6" />
              </View>
              <Text className="text-gray-700 font-semibold ml-3">Add Product</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(admin)/categories")}
              className="w-[48%] bg-white rounded-2xl p-4 mb-3 flex-row items-center"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
            >
              <View className="w-10 h-10 bg-purple-100 rounded-xl items-center justify-center">
                <Package size={20} color="#8B5CF6" />
              </View>
              <Text className="text-gray-700 font-semibold ml-3">Categories</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(admin)/offers")}
              className="w-[48%] bg-white rounded-2xl p-4 mb-3 flex-row items-center"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
            >
              <View className="w-10 h-10 bg-amber-100 rounded-xl items-center justify-center">
                <Tag size={20} color="#F59E0B" />
              </View>
              <Text className="text-gray-700 font-semibold ml-3">Offers</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
