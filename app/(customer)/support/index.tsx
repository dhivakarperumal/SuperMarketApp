import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Linking,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Phone,
  Mail,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Package,
  CreditCard,
  Truck,
  RotateCcw,
  User,
  HelpCircle,
  Search,
  Clock,
  Send,
} from "lucide-react-native";
import { WhatsAppIcon } from "../../../src/components/icons/WhatsAppIcon";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

const faqs = [
  {
    id: 1,
    category: "Orders",
    icon: Package,
    questions: [
      {
        q: "How do I track my order?",
        a: "Go to 'My Orders' in your account and tap on the order you want to track. You'll see real-time status updates and estimated delivery time.",
      },
      {
        q: "Can I cancel my order?",
        a: "Yes, you can cancel your order before it's dispatched. Go to 'My Orders', select the order, and tap 'Cancel Order'. Once dispatched, cancellation may not be possible.",
      },
      {
        q: "How do I modify my order?",
        a: "Unfortunately, orders cannot be modified once placed. You can cancel the order (if not dispatched) and place a new one with the correct items.",
      },
    ],
  },
  {
    id: 2,
    category: "Payments",
    icon: CreditCard,
    questions: [
      {
        q: "What payment methods are accepted?",
        a: "We accept UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery (COD). All online payments are secured with industry-standard encryption.",
      },
      {
        q: "Why was my payment declined?",
        a: "Payments can be declined due to insufficient funds, incorrect card details, or bank security measures. Please verify your details or try a different payment method.",
      },
      {
        q: "When will I receive my refund?",
        a: "Refunds are processed within 5-7 business days after approval. The amount will be credited to your original payment method.",
      },
    ],
  },
  {
    id: 3,
    category: "Delivery",
    icon: Truck,
    questions: [
      {
        q: "What are the delivery timings?",
        a: "We deliver from 7 AM to 10 PM daily. You can choose your preferred delivery slot during checkout.",
      },
      {
        q: "Is there a minimum order value for free delivery?",
        a: "Yes, orders above ₹500 qualify for free delivery. Orders below ₹500 have a delivery charge of ₹30.",
      },
      {
        q: "What if I'm not available during delivery?",
        a: "Our delivery partner will contact you. You can also use 'Leave at door' option for contactless delivery.",
      },
    ],
  },
  {
    id: 4,
    category: "Returns & Refunds",
    icon: RotateCcw,
    questions: [
      {
        q: "How do I return a product?",
        a: "Go to 'My Orders', select the order, tap 'Report Issue', choose the items to return, and submit. Our team will process your request.",
      },
      {
        q: "What is the return policy for perishable items?",
        a: "Perishable items (fruits, vegetables, dairy) must be reported within 24 hours of delivery. Non-perishable items can be returned within 7 days.",
      },
      {
        q: "Can I exchange a product?",
        a: "Currently, we don't offer direct exchanges. You can return the product for a refund and place a new order.",
      },
    ],
  },
  {
    id: 5,
    category: "Account",
    icon: User,
    questions: [
      {
        q: "How do I change my password?",
        a: "Go to Account > Settings > Change Password. Enter your current password and set a new one.",
      },
      {
        q: "How do I update my phone number?",
        a: "Go to Account > Settings > Edit Profile. Update your phone number and save changes.",
      },
      {
        q: "How do I delete my account?",
        a: "Go to Account > Settings > Delete Account. Please note this action is permanent and all your data will be removed.",
      },
    ],
  },
];

export default function SupportScreen() {
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCall = () => {
    Linking.openURL("tel:+918940450960");
  };

  const handleEmail = () => {
    Linking.openURL("mailto:dhivakarp305@gmail.com?subject=Support Request");
  };

  const handleWhatsApp = () => {
    Linking.openURL("https://wa.me/918940450960?text=Hi, I need help with");
  };

  const filteredFaqs = searchQuery
    ? faqs.map((category) => ({
        ...category,
        questions: category.questions.filter(
          (q) =>
            q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((category) => category.questions.length > 0)
    : faqs;

  const ContactCard = ({ icon: Icon, title, subtitle, onPress, color }: any) => (
    <Pressable
      onPress={onPress}
      className="flex-1 bg-white rounded-xl p-4 items-center mx-1"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: color + "15" }}
      >
        <Icon size={24} color={color} />
      </View>
      <Text className="text-gray-800 font-semibold text-sm">{title}</Text>
      <Text className="text-gray-500 text-xs mt-0.5">{subtitle}</Text>
    </Pressable>
  );

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
            Help & Support
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Search */}
        <View className="px-4 pt-4">
          <View
            className="flex-row items-center bg-white rounded-xl px-4 border border-gray-200"
            style={{ height: 48 }}
          >
            <Search size={20} color="#9CA3AF" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for help..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 text-gray-800"
              style={{ fontSize: 15 }}
            />
          </View>
        </View>

        {/* Contact Options */}
        <View className="px-3 py-4">
          <Text className="text-gray-500 font-semibold text-sm ml-1 mb-3">
            Contact Us
          </Text>
          <View className="flex-row">
            <ContactCard
              icon={Phone}
              title="Call Us"
              subtitle="9 AM - 9 PM"
              onPress={handleCall}
              color="#2E7D32"
            />
            <ContactCard
              icon={Mail}
              title="Email"
              subtitle="24/7 Support"
              onPress={handleEmail}
              color="#3B82F6"
            />
            <Pressable
              onPress={handleWhatsApp}
              className="flex-1 bg-white rounded-xl p-4 items-center mx-1"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: "#25D36615" }}
              >
                <WhatsAppIcon size={24} color="#25D366" />
              </View>
              <Text className="text-gray-800 font-semibold text-sm">WhatsApp</Text>
              <Text className="text-gray-500 text-xs mt-0.5">Quick Chat</Text>
            </Pressable>
          </View>
        </View>

        {/* Support Hours */}
        <View className="mx-4 mb-4 bg-primary/10 rounded-xl p-4 flex-row items-center">
          <Clock size={20} color="#2E7D32" />
          <View className="ml-3">
            <Text className="text-gray-800 font-semibold">Support Hours</Text>
            <Text className="text-gray-600 text-sm">
              Monday - Sunday: 9:00 AM - 9:00 PM
            </Text>
          </View>
        </View>

        {/* FAQs */}
        <View className="px-4">
          <Text className="text-gray-500 font-semibold text-sm mb-3">
            Frequently Asked Questions
          </Text>

          {filteredFaqs.length === 0 ? (
            <View className="bg-white rounded-xl p-6 items-center">
              <HelpCircle size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-3 text-center">
                No results found for "{searchQuery}"
              </Text>
            </View>
          ) : (
            filteredFaqs.map((category) => (
              <View
                key={category.id}
                className="bg-white rounded-xl mb-3 overflow-hidden"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {/* Category Header */}
                <Pressable
                  onPress={() =>
                    setExpandedCategory(
                      expandedCategory === category.id ? null : category.id
                    )
                  }
                  className="flex-row items-center p-4"
                >
                  <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
                    <category.icon size={20} color="#2E7D32" />
                  </View>
                  <Text className="flex-1 ml-3 text-gray-800 font-semibold">
                    {category.category}
                  </Text>
                  {expandedCategory === category.id ? (
                    <ChevronUp size={20} color="#9CA3AF" />
                  ) : (
                    <ChevronDown size={20} color="#9CA3AF" />
                  )}
                </Pressable>

                {/* Questions */}
                {expandedCategory === category.id && (
                  <View className="border-t border-gray-100">
                    {category.questions.map((item, index) => (
                      <View key={index}>
                        <Pressable
                          onPress={() =>
                            setExpandedQuestion(
                              expandedQuestion === `${category.id}-${index}`
                                ? null
                                : `${category.id}-${index}`
                            )
                          }
                          className="p-4 flex-row items-start"
                        >
                          <View className="flex-1">
                            <Text className="text-gray-800 font-medium">
                              {item.q}
                            </Text>
                            {expandedQuestion === `${category.id}-${index}` && (
                              <Text className="text-gray-600 mt-2 leading-5">
                                {item.a}
                              </Text>
                            )}
                          </View>
                          {expandedQuestion === `${category.id}-${index}` ? (
                            <ChevronUp size={18} color="#9CA3AF" />
                          ) : (
                            <ChevronDown size={18} color="#9CA3AF" />
                          )}
                        </Pressable>
                        {index < category.questions.length - 1 && (
                          <View className="h-px bg-gray-100 ml-4" />
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Still Need Help */}
        <View className="mx-4 mt-4 bg-white rounded-xl p-4">
          <Text className="text-gray-800 font-bold text-lg mb-2">
            Still need help?
          </Text>
          <Text className="text-gray-600 mb-4">
            Can't find what you're looking for? Send us a message and we'll get
            back to you within 24 hours.
          </Text>
          <Pressable
            onPress={() => router.push("/(customer)/support/contact")}
            className="bg-primary py-3 rounded-xl flex-row items-center justify-center"
          >
            <Send size={18} color="#fff" />
            <Text className="text-white font-semibold ml-2">
              Send a Message
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
