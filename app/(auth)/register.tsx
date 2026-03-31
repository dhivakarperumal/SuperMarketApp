import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  Dimensions,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAuth } from "../../src/context/AuthContext";
import { Instagram, Twitter } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill in all required fields",
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Passwords do not match",
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Password must be at least 6 characters",
      });
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name, phone);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Account created successfully",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Registration Failed",
        text2: error.message || "Failed to create account",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#FFFFFF]">
      {/* Bottom Pink/Black Waves */}
      <View
        className="absolute bg-[#202020]"
        style={{
          width: width * 1.5,
          height: width * 1.5,
          borderRadius: width * 0.75,
          bottom: -width * 1.05,
          left: -width * 0.25,
        }}
      />
      <View
        className="absolute bg-[#1D5A34]"
        style={{
          width: width * 1.8,
          height: width * 1.8,
          borderRadius: width * 0.9,
          bottom: -width * 1.25,
          left: -width * 0.2,
        }}
      />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
          enableOnAndroid
          extraScrollHeight={50}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View className="flex-1 px-8 justify-center pt-20">
          
          <View className="items-center mb-8">
            <Text className="text-[32px] font-bold text-[#1D5A34] tracking-tight">
              Sign Up
            </Text>
          </View>

          <View className="mb-4">
            <View className="h-[50px] w-full rounded-full bg-[#FFFFFF] border border-[#E8E8E8] px-5 justify-center">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email or mobile"
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 text-slate-800 text-[14px]"
              />
            </View>
          </View>
          
          <View className="mb-4">
            <View className="h-[50px] w-full rounded-full bg-[#E8E8E8] px-5 justify-center">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Username"
                placeholderTextColor="#6B7280"
                autoCapitalize="words"
                className="flex-1 text-slate-800 text-[14px]"
              />
            </View>
          </View>

          <View className="mb-4">
            <View className="h-[50px] w-full rounded-full bg-[#FFFFFF] border border-[#E8E8E8] px-5 justify-center">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#6B7280"
                secureTextEntry
                autoCapitalize="none"
                className="flex-1 text-slate-800 text-[14px]"
              />
            </View>
          </View>

          <View className="mb-6">
            <View className="h-[50px] w-full rounded-full bg-[#E8E8E8] px-5 justify-center">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor="#6B7280"
                secureTextEntry
                autoCapitalize="none"
                className="flex-1 text-slate-800 text-[14px]"
              />
            </View>
          </View>

          <Pressable className="mb-5 items-center">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Remember Me
            </Text>
          </Pressable>

          <Pressable
            onPress={handleRegister}
            disabled={loading}
            className="h-[54px] w-full rounded-full bg-[#1D5A34] items-center justify-center shadow-sm"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-[16px] font-medium text-white">Signup</Text>
            )}
          </Pressable>

          <View className="flex-row justify-center mt-5 mb-16">
            <Text className="text-[#6B7280] text-sm">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-[#6B7280] font-medium text-sm">LOG IN</Text>
              </Pressable>
            </Link>
          </View>

          <View className="flex-row justify-center items-center mt-auto pb-4">
            <Text className="text-[#FFFFFF] text-xs mr-3 font-medium">or connect with</Text>
            <Pressable className="mx-1 items-center justify-center w-6 h-6">
              <Instagram size={14} color="#FFFFFF" />
            </Pressable>
            <Pressable className="mx-1 items-center justify-center w-6 h-6">
              <Twitter size={14} color="#FFFFFF" />
            </Pressable>
          </View>
          
        </View>
      </KeyboardAwareScrollView>
      </SafeAreaView>
      <View style={{ height: insets.bottom, backgroundColor: "black", position: "absolute", bottom: 0, width: "100%" }} />
    </View>
  );
}
