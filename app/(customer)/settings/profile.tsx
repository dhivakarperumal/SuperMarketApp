import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ChevronLeft, User, Mail, Phone, Camera, LucideIcon } from "lucide-react-native";
import { router } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "../../../src/services/firebase/config";
import Toast from "react-native-toast-message";

interface InputFieldProps {
  icon: LucideIcon;
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  editable?: boolean;
  inputKey: string;
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
  focusedInput,
  onFocus,
  onBlur,
}: InputFieldProps) => (
  <View className="mb-4">
    <Text className="text-gray-600 text-sm font-medium mb-1.5 ml-1">
      {label}
    </Text>
    <View
      className={`flex-row items-center rounded-xl px-4 ${
        editable ? "bg-gray-50" : "bg-gray-100"
      } ${
        focusedInput === inputKey
          ? "border-2 border-primary"
          : "border border-gray-200"
      }`}
      style={{ height: 52 }}
    >
      <Icon
        size={20}
        color={focusedInput === inputKey ? "#2E7D32" : "#9CA3AF"}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        editable={editable}
        onFocus={() => onFocus(inputKey)}
        onBlur={onBlur}
        className={`flex-1 ml-3 ${editable ? "text-gray-800" : "text-gray-500"}`}
        style={{ fontSize: 15 }}
      />
    </View>
  </View>
);

export default function EditProfileScreen() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    displayName: "",
    phone: "",
  });

  const handleFocus = (key: string) => setFocusedInput(key);
  const handleBlur = () => setFocusedInput(null);

  useEffect(() => {
    if (user || userProfile) {
      setFormData({
        displayName: user?.displayName || userProfile?.displayName || "",
        phone: userProfile?.phone || "",
      });
    }
  }, [user, userProfile]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.displayName) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Name is required",
      });
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: formData.displayName,
      });

      // Update Firestore user document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        phone: formData.phone,
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Profile updated successfully",
      });
      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to update profile",
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
        <Text className="text-xl font-bold text-gray-800">
          Edit Profile
        </Text>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          {/* Profile Photo */}
          <View className="items-center mb-6">
            <View className="relative">
              <View className="w-24 h-24 bg-primary rounded-full items-center justify-center">
                {user?.photoURL ? (
                  <Image
                    source={{ uri: user.photoURL }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <Text className="text-white text-3xl font-bold">
                    {formData.displayName?.[0]?.toUpperCase() ||
                      user?.email?.[0]?.toUpperCase() ||
                      "U"}
                  </Text>
                )}
              </View>
              <Pressable
                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full items-center justify-center border-2 border-gray-100"
                onPress={() => {
                  Toast.show({
                    type: "info",
                    text1: "Coming Soon",
                    text2: "Photo upload will be available soon",
                  });
                }}
              >
                <Camera size={16} color="#2E7D32" />
              </Pressable>
            </View>
            <Text className="text-gray-500 text-sm mt-2">
              Tap to change photo
            </Text>
          </View>

          {/* Form Fields */}
          <InputField
            icon={User}
            label="Full Name"
            value={formData.displayName}
            onChangeText={(v: string) => handleChange("displayName", v)}
            placeholder="Enter your name"
            inputKey="displayName"
            focusedInput={focusedInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          <InputField
            icon={Mail}
            label="Email Address"
            value={user?.email || ""}
            placeholder="Email"
            editable={false}
            inputKey="email"
            focusedInput={focusedInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          <InputField
            icon={Phone}
            label="Phone Number"
            value={formData.phone}
            onChangeText={(v: string) => handleChange("phone", v)}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            inputKey="phone"
            focusedInput={focusedInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          {/* Save Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="rounded-xl overflow-hidden mt-4"
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
            <View className="flex-1 items-center justify-center">
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Save Changes
                </Text>
              )}
            </View>
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
