import { useState } from "react";
import { View, Text, Pressable, ScrollView, Image } from "react-native";
const Logo = require("../../../assets/images/logo.png");
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Package,
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Settings,
  Shield,
  FileText,
  Truck,
  RotateCcw,
} from "lucide-react-native";
import { router } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    {
      icon: Package,
      label: "My Orders",
      description: "View your order history",
      onPress: () => router.push("/(customer)/orders"),
    },
    {
      icon: MapPin,
      label: "Addresses",
      description: "Manage your addresses",
      onPress: () => router.push("/(customer)/addresses"),
    },
    {
      icon: CreditCard,
      label: "Payment Methods",
      description: "Manage payment options",
      onPress: () => {},
    },
    {
      icon: Bell,
      label: "Notifications",
      description: "Notification preferences",
      onPress: () => {},
    },
    {
      icon: Settings,
      label: "Settings",
      description: "App settings",
      onPress: () => router.push("/(customer)/settings"),
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      description: "Get help with your orders",
      onPress: () => router.push("/(customer)/support"),
    },
  ];

  const policyItems = [
    {
      icon: Shield,
      label: "Privacy Policy",
      description: "How we protect your data",
      onPress: () => router.push("/(customer)/policies/privacy"),
    },
    {
      icon: FileText,
      label: "Terms & Conditions",
      description: "Terms of service",
      onPress: () => router.push("/(customer)/policies/terms"),
    },
    {
      icon: RotateCcw,
      label: "Refund Policy",
      description: "Return and refund guidelines",
      onPress: () => router.push("/(customer)/policies/refund"),
    },
    {
      icon: Truck,
      label: "Shipping Policy",
      description: "Delivery information",
      onPress: () => router.push("/(customer)/policies/shipping"),
    },
  ];

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
            >
              <ChevronLeft size={24} color="#374151" />
            </Pressable>
            <Text className="text-2xl font-bold text-gray-800">My Account</Text>
          </View>
          <Image
            source={Logo}
            style={{ width: 45, height: 45 }}
            resizeMode="contain"
          />
        </View>

        {/* Profile Section */}
        <View className="bg-white mx-4 my-4 p-4 rounded-xl">
          <View className="flex-row items-center">
            <View className="w-16 h-16 bg-primary rounded-full items-center justify-center">
              {user?.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <Text className="text-white text-2xl font-bold">
                  {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                </Text>
              )}
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-bold text-gray-800">
                {user?.displayName || "User"}
              </Text>
              <Text className="text-gray-500">{user?.email}</Text>
            </View>
            <Pressable className="p-2">
              <ChevronRight size={20} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>

        {/* Menu Items */}
        <View className="bg-white mx-4 rounded-xl overflow-hidden">
          {menuItems.map((item, index) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              className={`flex-row items-center p-4 active:bg-gray-50 ${
                index < menuItems.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
                <item.icon size={20} color="#2E7D32" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-gray-800 font-semibold">{item.label}</Text>
                <Text className="text-gray-500 text-sm">{item.description}</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </Pressable>
          ))}
        </View>

        {/* Policies Section */}
        <Text className="text-gray-500 font-semibold text-sm ml-5 mt-4 mb-2">
          Legal & Policies
        </Text>
        <View className="bg-white mx-4 rounded-xl overflow-hidden">
          {policyItems.map((item, index) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              className={`flex-row items-center p-4 active:bg-gray-50 ${
                index < policyItems.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                <item.icon size={20} color="#3B82F6" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-gray-800 font-semibold">{item.label}</Text>
                <Text className="text-gray-500 text-sm">{item.description}</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </Pressable>
          ))}
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={handleLogout}
          className="flex-row items-center justify-center bg-white mx-4 my-4 p-4 rounded-xl"
        >
          <LogOut size={20} color="#EF4444" />
          <Text className="ml-2 text-red-500 font-semibold">Log Out</Text>
        </Pressable>

        {/* App Version */}
        <Text className="text-center text-gray-400 text-sm mb-8">
          Version 1.0.0
        </Text>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        visible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout from your account?"
        confirmText="Logout"
        cancelText="Cancel"
        type="logout"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </SafeAreaView>
  );
}
