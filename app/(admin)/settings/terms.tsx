import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, FileText } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";

export default function TermsScreen() {
  const { colors, isDark } = useTheme();

  const Section = ({ title, content }: { title: string; content: string }) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16, marginBottom: 10 }}>
        {title}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
        {content}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text, marginLeft: 12 }}>
          Terms of Service
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: isDark ? "#374151" : "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <FileText size={28} color={colors.textSecondary} />
          </View>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}>
            Terms of Service
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
            Last updated: January 2026
          </Text>
        </View>

        {/* Content */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20 }}>
          <Section
            title="1. Acceptance of Terms"
            content="By accessing and using the Dhiva Deva Super Markets admin application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application."
          />

          <Section
            title="2. Use of Service"
            content="This application is designed for authorized administrators and staff of Dhiva Deva Super Markets. You agree to use the service only for lawful purposes and in accordance with these terms. You are responsible for maintaining the confidentiality of your account credentials."
          />

          <Section
            title="3. User Responsibilities"
            content="As an admin user, you are responsible for:
• Maintaining accurate product information and pricing
• Processing customer orders in a timely manner
• Protecting customer data and privacy
• Using the application in accordance with applicable laws
• Keeping your login credentials secure"
          />

          <Section
            title="4. Data Management"
            content="You agree to handle all customer data responsibly and in compliance with applicable data protection laws. Customer information collected through orders should only be used for order fulfillment and communication purposes."
          />

          <Section
            title="5. Product Information"
            content="You are responsible for ensuring that all product information, including descriptions, prices, and availability, is accurate and up-to-date. Misleading or false product information is prohibited."
          />

          <Section
            title="6. Order Processing"
            content="You agree to process orders promptly and accurately. Any changes to order status should be communicated to customers in a timely manner. Cancellations should be handled according to store policies."
          />

          <Section
            title="7. Intellectual Property"
            content="The application, including its design, features, and content, is the property of Dhiva Deva Super Markets. You may not copy, modify, or distribute any part of the application without authorization."
          />

          <Section
            title="8. Limitation of Liability"
            content="Dhiva Deva Super Markets is not liable for any indirect, incidental, or consequential damages arising from the use of this application. The application is provided 'as is' without warranties of any kind."
          />

          <Section
            title="9. Modifications"
            content="We reserve the right to modify these terms at any time. Continued use of the application after changes constitutes acceptance of the new terms."
          />

          <Section
            title="10. Contact"
            content="For questions about these Terms of Service, please contact us at support@dhivadeva.com or call +91 98765 43210."
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
