import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ChevronLeft, Lock, Eye, EyeOff } from "lucide-react-native";
import { router } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import Toast from "react-native-toast-message";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  showPassword: boolean;
  toggleShowPassword: () => void;
  inputKey: string;
  focusedInput: string | null;
  onFocus: (key: string) => void;
  onBlur: () => void;
}

const PasswordField = ({
  label,
  value,
  onChangeText,
  placeholder,
  showPassword,
  toggleShowPassword,
  inputKey,
  focusedInput,
  onFocus,
  onBlur,
}: PasswordFieldProps) => (
  <View className="mb-4">
    <Text className="text-gray-600 text-sm font-medium mb-1.5 ml-1">
      {label}
    </Text>
    <View
      className={`flex-row items-center rounded-xl px-4 bg-gray-50 ${
        focusedInput === inputKey
          ? "border-2 border-primary"
          : "border border-gray-200"
      }`}
      style={{ height: 52 }}
    >
      <Lock
        size={20}
        color={focusedInput === inputKey ? "#2E7D32" : "#9CA3AF"}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={!showPassword}
        onFocus={() => onFocus(inputKey)}
        onBlur={onBlur}
        className="flex-1 ml-3 text-gray-800"
        style={{ fontSize: 15 }}
      />
      <Pressable onPress={toggleShowPassword} hitSlop={8}>
        {showPassword ? (
          <EyeOff size={20} color="#9CA3AF" />
        ) : (
          <Eye size={20} color="#9CA3AF" />
        )}
      </Pressable>
    </View>
  </View>
);

export default function ChangePasswordScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleFocus = (key: string) => setFocusedInput(key);
  const handleBlur = () => setFocusedInput(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill in all fields",
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "New password must be at least 6 characters",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "New passwords do not match",
      });
      return;
    }

    if (currentPassword === newPassword) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "New password must be different from current password",
      });
      return;
    }

    if (!user || !user.email) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User not found",
      });
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Password updated successfully",
      });
      router.back();
    } catch (error: any) {
      let errorMessage = "Failed to update password";
      if (error.code === "auth/wrong-password") {
        errorMessage = "Current password is incorrect";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please log out and log in again to change password";
      }
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      {/* Header */}
      <LinearGradient
        colors={["#2E7D32", "#1B5E20"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' }}>Change Password</Text>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16 }}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          {/* Info Box */}
          <View className="bg-blue-50 p-4 rounded-xl mb-6">
            <Text className="text-blue-800 text-sm leading-5">
              Your password must be at least 6 characters long. We recommend
              using a mix of letters, numbers, and symbols for a stronger
              password.
            </Text>
          </View>

          <PasswordField
            label="Current Password"
            value={formData.currentPassword}
            onChangeText={(v: string) => handleChange("currentPassword", v)}
            placeholder="Enter current password"
            showPassword={showCurrentPassword}
            toggleShowPassword={() => setShowCurrentPassword(!showCurrentPassword)}
            inputKey="currentPassword"
            focusedInput={focusedInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          <PasswordField
            label="New Password"
            value={formData.newPassword}
            onChangeText={(v: string) => handleChange("newPassword", v)}
            placeholder="Enter new password"
            showPassword={showNewPassword}
            toggleShowPassword={() => setShowNewPassword(!showNewPassword)}
            inputKey="newPassword"
            focusedInput={focusedInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          <PasswordField
            label="Confirm New Password"
            value={formData.confirmPassword}
            onChangeText={(v: string) => handleChange("confirmPassword", v)}
            placeholder="Confirm new password"
            showPassword={showConfirmPassword}
            toggleShowPassword={() => setShowConfirmPassword(!showConfirmPassword)}
            inputKey="confirmPassword"
            focusedInput={focusedInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          {/* Update Button */}
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
                  Update Password
                </Text>
              )}
            </View>
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
