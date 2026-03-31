import { View, Text, ScrollView, Pressable, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, RotateCcw } from "lucide-react-native";
import { router } from "expo-router";

export default function RefundPolicyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      {/* Header */}
      <LinearGradient
        colors={["#2E7D32", "#1B5E20"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="text-xl font-bold text-white">
            Refund Policy
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-gray-500 text-sm mb-4">
            Last updated: January 2026
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            1. Return Eligibility
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            You may request a return or refund for products that are:{"\n"}
            {"\n"}- Damaged during delivery{"\n"}- Expired or close to expiry
            {"\n"}- Different from what was ordered{"\n"}- Missing from your
            order
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            2. Return Window
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            Returns must be requested within 24 hours of delivery for
            perishable items (fruits, vegetables, dairy) and within 7 days for
            non-perishable items. Please inspect your order upon delivery.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            3. Non-Returnable Items
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            The following items cannot be returned:{"\n"}
            {"\n"}- Opened or used products{"\n"}- Products damaged due to
            mishandling after delivery{"\n"}- Items on clearance or final sale
            {"\n"}- Personal care items for hygiene reasons
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            4. How to Request a Refund
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            To request a refund:{"\n"}
            {"\n"}1. Go to My Orders in the app{"\n"}2. Select the order with
            the issue{"\n"}3. Tap "Report Issue" and select the problem{"\n"}4.
            Upload photos if applicable{"\n"}5. Submit your request
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            5. Refund Processing
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            Once approved, refunds will be processed within 5-7 business days.
            The refund will be credited to your original payment method or as
            store credit, depending on your preference.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            6. Partial Refunds
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            If only some items in your order are affected, we will process a
            partial refund for those specific items. Delivery charges may be
            refunded if the entire order is returned.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            7. Contact Support
          </Text>
          <Text className="text-gray-600 leading-6">
            For refund-related queries, contact our support team at
            support@dhivadeva.com or call +91 98765 43210. Our team is available
            from 8 AM to 10 PM daily.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
