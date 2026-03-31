import { View, Text, Pressable, ScrollView, Image, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Bell,
  Package,
  Tag,
  Truck,
  CheckCircle,
  Gift,
  AlertCircle,
} from "lucide-react-native";
import { router } from "expo-router";

const Logo = require("../../assets/images/logo.png");

const notifications = [
  {
    id: 1,
    type: "order",
    title: "Order Delivered",
    message: "Your order #ORD123456 has been delivered successfully.",
    time: "2 hours ago",
    read: false,
    icon: CheckCircle,
    color: "#66BB6A",
  },
  {
    id: 2,
    type: "promo",
    title: "Weekend Special!",
    message: "Get 20% off on all fruits and vegetables. Use code FRESH20.",
    time: "5 hours ago",
    read: false,
    icon: Tag,
    color: "#F59E0B",
  },
  {
    id: 3,
    type: "shipping",
    title: "Out for Delivery",
    message: "Your order #ORD123455 is out for delivery.",
    time: "Yesterday",
    read: true,
    icon: Truck,
    color: "#3B82F6",
  },
  {
    id: 4,
    type: "order",
    title: "Order Confirmed",
    message: "Your order #ORD123455 has been confirmed.",
    time: "Yesterday",
    read: true,
    icon: Package,
    color: "#1D5A34",
  },
  {
    id: 5,
    type: "promo",
    title: "New Arrivals!",
    message: "Check out fresh organic products now available.",
    time: "2 days ago",
    read: true,
    icon: Gift,
    color: "#8B5CF6",
  },
];

export default function NotificationsScreen() {
  const unreadCount = notifications.filter((n) => !n.read).length;

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
              className="p-2 -ml-2 bg-white/20 rounded-full active:bg-white/30"
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </Pressable>
            <Text className="text-xl font-bold text-white ml-2">
              Notifications
            </Text>
            {unreadCount > 0 && (
              <View className="bg-white/20 px-2 py-1 rounded-full ml-2">
                <Text className="text-white font-semibold text-xs">
                  {unreadCount} new
                </Text>
              </View>
            )}
          </View>
          <Image
            source={Logo}
            style={{ width: 40, height: 40, tintColor: '#FFFFFF' }}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>

      {notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-5"
            style={{ backgroundColor: "#F3F4F6" }}
          >
            <Bell size={40} color="#9CA3AF" />
          </View>
          <Text className="text-lg font-bold text-gray-800 mb-2">
            No notifications
          </Text>
          <Text className="text-gray-500 text-center">
            You're all caught up! Check back later.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Today */}
          <Text className="text-gray-500 font-semibold text-sm px-4 pt-4 pb-2">
            Recent
          </Text>
          {notifications.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Pressable
                key={item.id}
                className={`flex-row px-4 py-4 ${
                  !item.read ? "bg-primary/5" : "bg-white"
                } ${index < notifications.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: item.color + "15" }}
                >
                  <IconComponent size={22} color={item.color} />
                </View>
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`font-semibold ${
                        !item.read ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {item.title}
                    </Text>
                    {!item.read && (
                      <View className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </View>
                  <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                    {item.message}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-2">{item.time}</Text>
                </View>
              </Pressable>
            );
          })}

          {/* Mark All Read */}
          <Pressable className="mx-4 my-4 py-3 border border-gray-200 rounded-xl">
            <Text className="text-gray-600 font-semibold text-center">
              Mark all as read
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
