import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  MessageSquare,
  ChevronDown,
  Send,
  LucideIcon,
} from "lucide-react-native";
import { router } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../../src/services/firebase/config";
import Toast from "react-native-toast-message";

const issueTypes = [
  "Order Issue",
  "Payment Problem",
  "Delivery Concern",
  "Product Quality",
  "Refund Request",
  "Account Help",
  "App Feedback",
  "Other",
];

interface InputFieldProps {
  icon: LucideIcon;
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  editable?: boolean;
  inputKey: string;
  multiline?: boolean;
  required?: boolean;
  focusedInput: string | null;
  onFocus: (key: string) => void;
  onBlur: () => void;
}

const InputField = ({
  icon: Icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  editable = true,
  inputKey,
  multiline = false,
  required = false,
  focusedInput,
  onFocus,
  onBlur,
}: InputFieldProps) => (
  <View className="mb-4">
    <Text className="text-gray-600 text-sm font-medium mb-1.5 ml-1">
      {label}
      {required && <Text className="text-red-500"> *</Text>}
    </Text>
    <View
      className={`flex-row items-start rounded-xl px-4 ${
        editable ? "bg-gray-50" : "bg-gray-100"
      } ${
        focusedInput === inputKey
          ? "border-2 border-primary"
          : "border border-gray-200"
      }`}
      style={{ minHeight: multiline ? 120 : 52 }}
    >
      <View style={{ marginTop: multiline ? 16 : 16 }}>
        <Icon
          size={20}
          color={focusedInput === inputKey ? "#2E7D32" : "#9CA3AF"}
        />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? 5 : 1}
        onFocus={() => onFocus(inputKey)}
        onBlur={onBlur}
        className={`flex-1 ml-3 ${editable ? "text-gray-800" : "text-gray-500"}`}
        style={{
          fontSize: 15,
          paddingVertical: multiline ? 12 : 0,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  </View>
);

export default function ContactScreen() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showIssueDropdown, setShowIssueDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.displayName || userProfile?.displayName || "",
    email: user?.email || "",
    phone: userProfile?.phone || "",
    issueType: "",
    message: "",
  });

  const handleFocus = (key: string) => setFocusedInput(key);
  const handleBlur = () => setFocusedInput(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const { name, email, issueType, message } = formData;

    if (!name || !email || !issueType || !message) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill in all required fields",
      });
      return;
    }

    setLoading(true);
    try {
      // Save to Firestore
      await addDoc(collection(db, "support_tickets"), {
        userId: user?.uid || null,
        name,
        email,
        phone: formData.phone,
        issueType,
        message,
        status: "open",
        createdAt: new Date(),
      });

      Toast.show({
        type: "success",
        text1: "Message Sent",
        text2: "We'll get back to you within 24 hours",
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to send message. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
        >
          <ChevronLeft size={24} color="#374151" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-800">Contact Us</Text>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16 }}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          {/* Info */}
          <View className="bg-primary/10 rounded-xl p-4 mb-6">
            <Text className="text-gray-800 font-semibold mb-1">
              Need Help? We're Here!
            </Text>
            <Text className="text-gray-600 text-sm leading-5">
              Fill out the form below and our support team will respond within
              24 hours. For urgent issues, please call us directly.
            </Text>
          </View>

          <InputField
            icon={User}
            label="Full Name"
            value={formData.name}
            onChangeText={(v: string) => handleChange("name", v)}
            placeholder="Enter your name"
            inputKey="name"
            required
            focusedInput={focusedInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          <InputField
            icon={Mail}
            label="Email Address"
            value={formData.email}
            onChangeText={(v: string) => handleChange("email", v)}
            placeholder="Enter your email"
            keyboardType="email-address"
            inputKey="email"
            required
            focusedInput={focusedInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          <InputField
            icon={Phone}
            label="Phone Number"
            value={formData.phone}
            onChangeText={(v: string) => handleChange("phone", v)}
            placeholder="Enter your phone (optional)"
            keyboardType="phone-pad"
            inputKey="phone"
            focusedInput={focusedInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          {/* Issue Type Dropdown */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm font-medium mb-1.5 ml-1">
              Issue Type<Text className="text-red-500"> *</Text>
            </Text>
            <Pressable
              onPress={() => setShowIssueDropdown(!showIssueDropdown)}
              className={`flex-row items-center rounded-xl px-4 bg-gray-50 ${
                showIssueDropdown
                  ? "border-2 border-primary"
                  : "border border-gray-200"
              }`}
              style={{ height: 52 }}
            >
              <MessageSquare
                size={20}
                color={showIssueDropdown ? "#2E7D32" : "#9CA3AF"}
              />
              <Text
                className={`flex-1 ml-3 ${
                  formData.issueType ? "text-gray-800" : "text-gray-400"
                }`}
                style={{ fontSize: 15 }}
              >
                {formData.issueType || "Select issue type"}
              </Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </Pressable>

            {/* Dropdown Options */}
            {showIssueDropdown && (
              <View className="bg-white rounded-xl mt-2 border border-gray-200 overflow-hidden">
                {issueTypes.map((type, index) => (
                  <Pressable
                    key={type}
                    onPress={() => {
                      handleChange("issueType", type);
                      setShowIssueDropdown(false);
                    }}
                    className={`p-4 ${
                      index < issueTypes.length - 1 ? "border-b border-gray-100" : ""
                    } ${formData.issueType === type ? "bg-primary/10" : ""}`}
                  >
                    <Text
                      className={`${
                        formData.issueType === type
                          ? "text-primary font-semibold"
                          : "text-gray-800"
                      }`}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <InputField
            icon={MessageSquare}
            label="Message"
            value={formData.message}
            onChangeText={(v: string) => handleChange("message", v)}
            placeholder="Describe your issue in detail..."
            inputKey="message"
            multiline
            required
            focusedInput={focusedInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="rounded-xl overflow-hidden mt-2 mb-4"
            style={{
              height: 52,
              backgroundColor: "#2E7D32",
              shadowColor: "#2E7D32",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <View className="flex-1 flex-row items-center justify-center">
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Send size={18} color="#fff" />
                  <Text className="text-white font-bold text-base ml-2">
                    Send Message
                  </Text>
                </>
              )}
            </View>
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
