import { Link, useRouter } from "expo-router";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { GoogleIcon } from "../../src/components/GoogleIcon";
import { useAuth } from "../../src/context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { signIn, signInWithGoogle, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill in all fields",
      });
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Logged in successfully",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: error.message || "Invalid credentials",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Logged in with Google",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Google Login Failed",
        text2: error.message || "Failed to login with Google",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F4F8F2]" edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 pb-6">
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 18,
              paddingBottom: 88,
              borderBottomLeftRadius: 28,
              borderBottomRightRadius: 28,
            }}
          >
            <View className="w-16 h-16 items-center justify-center rounded-2xl bg-white/15">
              <Image
                source={require("../../assets/images/logo.png")}
                style={{ width: 42, height: 42 }}
                resizeMode="contain"
              />
            </View>
            <Text className="mt-5 text-3xl font-bold text-white">
              Welcome back
            </Text>
            <Text className="mt-2 text-sm leading-5 text-white/85">
              Sign in to continue with fresh deals, fast delivery, and easy checkout.
            </Text>
          </View>

          <View className="px-6" style={{ marginTop: -52 }}>
            <View
              className="rounded-3xl bg-white p-5"
              style={{
                borderWidth: 1,
                borderColor: "#EEF2E8",
                shadowColor: "#0F172A",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.08,
                shadowRadius: 18,
                elevation: 8,
              }}
            >
              <Text className="text-xl font-bold text-slate-900">Login to your account</Text>
              <Text className="mt-1 mb-5 text-sm text-slate-500">
                Continue shopping smarter with your saved cart and offers.
              </Text>

              <View className="mb-4">
                <Text className="mb-2 ml-1 text-sm font-semibold text-slate-600">
                  Email Address
                </Text>
                <View
                  className={`flex-row items-center rounded-2xl border bg-[#F8FAF8] px-4 ${
                    focusedInput === "email" ? "border-[#1D5C45]" : "border-gray-200"
                  }`}
                  style={{ height: 54 }}
                >
                  <Mail
                    size={19}
                    color={focusedInput === "email" ? "#1D5C45" : "#94A3B8"}
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setFocusedInput("email")}
                    onBlur={() => setFocusedInput(null)}
                    className="ml-3 flex-1 text-slate-800"
                    style={{ fontSize: 15 }}
                  />
                </View>
              </View>

              <View className="mb-2">
                <Text className="mb-2 ml-1 text-sm font-semibold text-slate-600">
                  Password
                </Text>
                <View
                  className={`flex-row items-center rounded-2xl border bg-[#F8FAF8] px-4 ${
                    focusedInput === "password" ? "border-[#1D5C45]" : "border-gray-200"
                  }`}
                  style={{ height: 54 }}
                >
                  <Lock
                    size={19}
                    color={focusedInput === "password" ? "#1D5C45" : "#94A3B8"}
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => setFocusedInput(null)}
                    className="ml-3 flex-1 text-slate-800"
                    style={{ fontSize: 15 }}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    {showPassword ? (
                      <EyeOff size={19} color="#94A3B8" />
                    ) : (
                      <Eye size={19} color="#94A3B8" />
                    )}
                  </Pressable>
                </View>
              </View>

              <Pressable className="mb-5 self-end">
                <Text className="text-sm font-semibold text-[#1D5C45]">Forgot password?</Text>
              </Pressable>

              <Pressable onPress={handleLogin} disabled={loading} className="overflow-hidden rounded-2xl">
                <View
                  style={{ paddingVertical: 16, borderRadius: 16 }}
                >
                  <View className="flex-row items-center justify-center">
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text className="mr-2 text-base font-bold text-white">Sign In</Text>
                        <ArrowRight size={18} color="#fff" />
                      </>
                    )}
                  </View>
                </View>
              </Pressable>

              <Pressable
                onPress={handleGoogleLogin}
                disabled={loading}
                className="mt-3 flex-row items-center justify-center rounded-2xl border border-gray-200 bg-[#F8FAF8] px-4 py-4"
              >
                <GoogleIcon size={20} />
                <Text className="ml-3 text-sm font-semibold text-slate-700">
                  Continue with Google
                </Text>
              </Pressable>
            </View>

            <View className="flex-row justify-center pt-6">
              <Text className="text-slate-500">Don&apos;t have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text className="font-bold text-[#1D5C45]">Sign Up</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
