import { View, Text, ScrollView, Pressable, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Truck } from "lucide-react-native";
import { router } from "expo-router";

export default function ShippingPolicyScreen() {
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
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="text-xl font-bold text-white">
            Shipping Policy
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
            1. Delivery Areas
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            We currently deliver to select areas within the city. Enter your
            pincode at checkout to verify if delivery is available in your
            area. We are continuously expanding our delivery network.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            2. Delivery Timings
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            Delivery slots available:{"\n"}
            {"\n"}- Morning: 7 AM - 10 AM{"\n"}- Afternoon: 12 PM - 3 PM{"\n"}-
            Evening: 5 PM - 8 PM{"\n"}- Night: 8 PM - 10 PM{"\n"}
            {"\n"}Select your preferred slot during checkout.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            3. Delivery Charges
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            {"\n"}- Orders above Rs. 500: FREE delivery{"\n"}- Orders below Rs.
            500: Rs. 30 delivery charge{"\n"}- Express delivery (within 2
            hours): Rs. 50 additional{"\n"}
            {"\n"}Delivery charges may vary during peak hours or special events.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            4. Order Processing
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            Orders placed before 8 PM are processed the same day. Orders placed
            after 8 PM will be processed the next morning. You will receive
            notifications when your order is being prepared and out for
            delivery.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            5. Delivery Attempts
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            Our delivery partner will attempt to deliver your order at the
            scheduled time. If you're unavailable, they will contact you. After
            2 failed delivery attempts, the order may be returned, and a refund
            will be processed minus delivery charges.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            6. Order Tracking
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            Track your order in real-time through the app. Go to "My Orders" to
            view the current status and estimated delivery time. You'll also
            receive SMS and push notifications for order updates.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            7. Contactless Delivery
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            We offer contactless delivery option. Select "Leave at door" during
            checkout. Our delivery partner will place your order at your
            doorstep and notify you upon delivery.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            8. Contact Us
          </Text>
          <Text className="text-gray-600 leading-6">
            For delivery-related queries, contact us at delivery@dhivadeva.com
            or call +91 98765 43210. Our support team is available from 7 AM to
            11 PM daily.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
