import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, Shield, Lock, Eye, Database, Share2, Trash2 } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";

export default function PrivacyScreen() {
  const { colors, isDark } = useTheme();

  const Section = ({
    icon: Icon,
    iconBg,
    iconColor,
    title,
    content,
  }: {
    icon: any;
    iconBg: string;
    iconColor: string;
    title: string;
    content: string;
  }) => (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={iconColor} />
        </View>
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16, marginLeft: 12 }}>
          {title}
        </Text>
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
        {content}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top","bottom"]}>
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
          Privacy Policy
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
            backgroundColor: isDark ? "#14532D" : "#E8F5E9",
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
              backgroundColor: isDark ? "#166534" : "#BBF7D0",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Shield size={28} color="#66BB6A" />
          </View>
          <Text style={{ color: isDark ? "#86EFAC" : "#15803D", fontWeight: "700", fontSize: 18 }}>
            Your Privacy Matters
          </Text>
          <Text style={{ color: isDark ? "#6EE7B7" : "#66BB6A", fontSize: 13, marginTop: 4, textAlign: "center" }}>
            Last updated: January 2026
          </Text>
        </View>

        {/* Introduction */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
            At Dhiva Deva Super Markets, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our admin application.
          </Text>
        </View>

        {/* Sections */}
        <Section
          icon={Database}
          iconBg={isDark ? "#1E3A8A" : "#DBEAFE"}
          iconColor="#3B82F6"
          title="Information We Collect"
          content="We collect information necessary for app functionality:
• Account information (email, name, phone number)
• Store data (products, orders, inventory)
• Device information for app optimization
• Usage analytics to improve our services

We do not collect unnecessary personal information."
        />

        <Section
          icon={Eye}
          iconBg={isDark ? "#581C87" : "#F3E8FF"}
          iconColor="#9333EA"
          title="How We Use Your Information"
          content="Your information is used to:
• Provide and maintain the admin services
• Process and manage orders
• Send important notifications
• Improve app performance and features
• Provide customer support

We never sell your personal information to third parties."
        />

        <Section
          icon={Lock}
          iconBg={isDark ? "#14532D" : "#E8F5E9"}
          iconColor="#66BB6A"
          title="Data Security"
          content="We implement robust security measures:
• Encrypted data transmission (SSL/TLS)
• Secure cloud storage with Firebase
• Regular security audits
• Access controls and authentication
• Automatic session timeouts

Your data security is our top priority."
        />

        <Section
          icon={Share2}
          iconBg={isDark ? "#7C2D12" : "#FFEDD5"}
          iconColor="#F97316"
          title="Information Sharing"
          content="We may share information only in these cases:
• With your explicit consent
• To comply with legal obligations
• To protect our rights and safety
• With service providers who assist our operations

All third parties are bound by confidentiality agreements."
        />

        <Section
          icon={Trash2}
          iconBg={isDark ? "#7F1D1D" : "#FEE2E2"}
          iconColor="#EF4444"
          title="Data Retention & Deletion"
          content="We retain your data only as long as necessary:
• Active account data is kept while you use the service
• Order history is kept for accounting purposes
• You can request data deletion at any time
• Deleted data is permanently removed within 30 days

Contact us to request data deletion."
        />

        {/* Contact */}
        <View
          style={{
            backgroundColor: isDark ? "#1E3A8A20" : "#EFF6FF",
            borderRadius: 12,
            padding: 16,
            marginTop: 12,
            borderWidth: 1,
            borderColor: isDark ? "#1E3A8A" : "#BFDBFE",
          }}
        >
          <Text style={{ color: isDark ? "#93C5FD" : "#1D4ED8", fontWeight: "600", marginBottom: 8 }}>
            Questions or Concerns?
          </Text>
          <Text style={{ color: isDark ? "#93C5FD" : "#3B82F6", fontSize: 13, lineHeight: 20 }}>
            If you have any questions about our Privacy Policy or how we handle your data, please contact us:{"\n\n"}
            Email: privacy@dhivadeva.com{"\n"}
            Phone: +91 98765 43210
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
