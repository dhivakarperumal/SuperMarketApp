import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, FileText } from "lucide-react-native";
import { router } from "expo-router";

export default function TermsConditionsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-800">
            Terms & Conditions
          </Text>
        </View>
        <FileText size={24} color="#3B82F6" />
      </View>

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
            1. Acceptance of Terms
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            By accessing and using the Dhiva Deva Super Markets app, you accept
            and agree to be bound by these Terms and Conditions. If you do not
            agree to these terms, please do not use our services.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            2. Account Registration
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            To use our services, you must create an account with accurate and
            complete information. You are responsible for maintaining the
            confidentiality of your account credentials and for all activities
            under your account.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            3. Orders and Payments
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            {"\n"}- All prices are in Indian Rupees (INR){"\n"}- Prices are
            subject to change without notice{"\n"}- Payment must be completed
            at the time of order{"\n"}- We accept various payment methods
            including UPI, cards, and cash on delivery
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            4. Product Information
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            We strive to display accurate product information including prices,
            descriptions, and images. However, we do not warrant that product
            descriptions or other content is accurate, complete, or error-free.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            5. Order Cancellation
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            You may cancel your order before it is dispatched. Once an order is
            out for delivery, cancellation may not be possible. We reserve the
            right to cancel orders due to stock unavailability or pricing
            errors.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            6. Intellectual Property
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            All content on this app, including text, graphics, logos, and
            software, is the property of Dhiva Deva Super Markets and is
            protected by intellectual property laws.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            7. Limitation of Liability
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            Dhiva Deva Super Markets shall not be liable for any indirect,
            incidental, or consequential damages arising from the use of our
            services.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            8. Contact Information
          </Text>
          <Text className="text-gray-600 leading-6">
            For questions regarding these Terms & Conditions, please contact us
            at legal@dhivadeva.com or call +91 98765 43210.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
