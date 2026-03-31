import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Shield } from "lucide-react-native";
import { router } from "expo-router";

export default function PrivacyPolicyScreen() {
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
            Privacy Policy
          </Text>
        </View>
        <Shield size={24} color="#3B82F6" />
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
            1. Information We Collect
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            We collect information you provide directly to us, such as when you
            create an account, make a purchase, or contact us for support. This
            includes your name, email address, phone number, delivery address,
            and payment information.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            2. How We Use Your Information
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            We use the information we collect to:{"\n"}
            {"\n"}- Process and deliver your orders{"\n"}- Send order
            confirmations and updates{"\n"}- Respond to your questions and
            requests{"\n"}- Improve our services and user experience{"\n"}-
            Send promotional communications (with your consent)
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            3. Information Sharing
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            We do not sell your personal information. We may share your
            information with delivery partners to fulfill your orders and with
            payment processors to complete transactions securely.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            4. Data Security
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            We implement appropriate security measures to protect your personal
            information against unauthorized access, alteration, disclosure, or
            destruction. All payment transactions are encrypted using SSL
            technology.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            5. Your Rights
          </Text>
          <Text className="text-gray-600 mb-4 leading-6">
            You have the right to:{"\n"}
            {"\n"}- Access your personal data{"\n"}- Update or correct your
            information{"\n"}- Delete your account{"\n"}- Opt out of marketing
            communications
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">
            6. Contact Us
          </Text>
          <Text className="text-gray-600 leading-6">
            If you have any questions about this Privacy Policy, please contact
            us at support@dhivadeva.com or call us at +91 98765 43210.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
