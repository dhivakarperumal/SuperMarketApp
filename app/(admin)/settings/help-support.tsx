import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ChevronLeft,
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileQuestion,
  BookOpen,
  ExternalLink,
} from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: "1",
    question: "How do I add a new product?",
    answer: "Go to Products tab and tap the '+' button or 'Add Product' in the Quick Actions on the dashboard. Fill in the product details including name, price, category, and stock quantity, then save.",
  },
  {
    id: "2",
    question: "How do I process an order?",
    answer: "Go to Orders tab, select the order you want to process. You can update the status from 'Order Placed' to 'Shipped', 'Out for Delivery', or 'Delivered'. You can also cancel orders if needed.",
  },
  {
    id: "3",
    question: "How do I connect a thermal printer?",
    answer: "Go to Settings > Printer section. Make sure your Bluetooth printer is turned on and in pairing mode. Tap 'Scan for Printers' and select your printer from the list to connect.",
  },
  {
    id: "4",
    question: "How do I print a receipt?",
    answer: "After connecting a printer, you can print receipts from the Billing section or from individual order details. Tap the print button to send the receipt to your connected printer.",
  },
  {
    id: "5",
    question: "How do I manage delivery zones?",
    answer: "Go to Settings > Delivery Zones. Here you can add new delivery areas by pincode, set delivery charges, and minimum order amounts for each zone.",
  },
  {
    id: "6",
    question: "How do I update product stock?",
    answer: "Go to Products tab, find the product you want to update, and tap on it. You can edit the stock quantity and other details from the edit screen.",
  },
  {
    id: "7",
    question: "Can I accept online payments?",
    answer: "Go to Settings > Payment Methods to enable UPI, Cards, and other payment options. Note: Online payments require payment gateway integration.",
  },
  {
    id: "8",
    question: "How do I view sales reports?",
    answer: "The dashboard shows your daily, monthly, and total revenue. Detailed analytics and reports feature will be available in future updates.",
  },
];

export default function HelpSupportScreen() {
  const { colors, isDark } = useTheme();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleContact = (type: "phone" | "email" | "whatsapp") => {
    switch (type) {
      case "phone":
        Linking.openURL("tel:+918940450960");
        break;
      case "email":
        Linking.openURL("mailto:dhivakarp305@gmail.com");
        break;
      case "whatsapp":
        Linking.openURL("https://wa.me/918940450960");
        break;
    }
  };

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
          Help & Support
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Section */}
        <Text style={{ color: colors.textSecondary, fontWeight: "600", fontSize: 13, marginBottom: 12, marginLeft: 4 }}>
          CONTACT US
        </Text>
        <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
          <Pressable
            onPress={() => handleContact("phone")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: isDark ? "#14532D" : "#E8F5E9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Phone size={22} color="#66BB6A" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>Call Us</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                +91 89404 50960
              </Text>
            </View>
            <ExternalLink size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => handleContact("email")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: isDark ? "#1E3A8A" : "#DBEAFE",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mail size={22} color="#3B82F6" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>Email Support</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                dhivakarp305@gmail.com
              </Text>
            </View>
            <ExternalLink size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => handleContact("whatsapp")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: isDark ? "#14532D" : "#E8F5E9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageCircle size={22} color="#66BB6A" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>WhatsApp</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                Chat with us directly
              </Text>
            </View>
            <ExternalLink size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* FAQ Section */}
        <Text style={{ color: colors.textSecondary, fontWeight: "600", fontSize: 13, marginBottom: 12, marginLeft: 4 }}>
          FREQUENTLY ASKED QUESTIONS
        </Text>
        <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: "hidden" }}>
          {faqs.map((faq, index) => (
            <View key={faq.id}>
              <Pressable
                onPress={() => toggleFaq(faq.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: index < faqs.length - 1 && expandedFaq !== faq.id ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: isDark ? "#581C87" : "#F3E8FF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileQuestion size={18} color="#9333EA" />
                </View>
                <Text style={{ flex: 1, color: colors.text, fontWeight: "500", marginLeft: 12, fontSize: 14 }}>
                  {faq.question}
                </Text>
                {expandedFaq === faq.id ? (
                  <ChevronUp size={20} color={colors.textMuted} />
                ) : (
                  <ChevronDown size={20} color={colors.textMuted} />
                )}
              </Pressable>
              {expandedFaq === faq.id && (
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingBottom: 16,
                    paddingLeft: 64,
                    borderBottomWidth: index < faqs.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
                    {faq.answer}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Support Hours */}
        <View
          style={{
            backgroundColor: isDark ? "#7C2D1220" : "#FFF7ED",
            borderRadius: 12,
            padding: 16,
            marginTop: 24,
            borderWidth: 1,
            borderColor: isDark ? "#7C2D12" : "#FDBA74",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <HelpCircle size={20} color="#F97316" />
            <Text style={{ color: "#F97316", fontWeight: "600", marginLeft: 8 }}>Support Hours</Text>
          </View>
          <Text style={{ color: isDark ? "#FDBA74" : "#C2410C", fontSize: 13, marginTop: 8 }}>
            Monday - Saturday: 9:00 AM - 8:00 PM{"\n"}
            Sunday: 10:00 AM - 6:00 PM
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
