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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

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

  return (
    <View className="flex-1 bg-[#FFFFFF]">
      {/* Top Pink Wave using overlapping circles */}
      <View
        className="absolute bg-[#1D5A34]"
        style={{
          width: width * 1.5,
          height: width * 1.5,
          borderRadius: width * 0.75,
          top: -width * 1.1,
          left: -width * 0.1,
        }}
      />
      
      {/* Bottom Pink Wave */}
      <View
        className="absolute bg-[#1D5A34]"
        style={{
          width: width * 1.5,
          height: width * 1.5,
          borderRadius: width * 0.75,
          bottom: -width * 1.2,
          right: -width * 0.2,
        }}
      />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 50 }}
          enableOnAndroid
          extraScrollHeight={50}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View className="flex-1 px-8 justify-center">
          
          <View className="items-center mb-10 pt-16">
            <Text className="text-[32px] font-bold text-[#1D5A34] tracking-tight">
              Log In
            </Text>
          </View>

          <View className="mb-4">
            <View className="h-[50px] w-full rounded-full bg-[#E8E8E8] px-5 justify-center">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Username or Email"
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 text-slate-800 text-[14px]"
              />
            </View>
          </View>

          <View className="mb-6">
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

          <Pressable className="mb-6 items-center">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Remember Me
            </Text>
          </Pressable>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className="h-[54px] w-full rounded-full bg-[#1D5A34] items-center justify-center shadow-sm"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-[16px] font-medium text-white">Log in</Text>
            )}
          </Pressable>

          <View className="flex-row justify-center mt-6">
            <Text className="text-[#6B7280] text-sm">Don't Have An Account? </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text className="text-[#6B7280] font-medium text-sm">Sign Up</Text>
              </Pressable>
            </Link>
          </View>

          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-[#6B7280] text-sm mr-3">or Log in with</Text>
            <Pressable className="mx-1 items-center justify-center border border-[#1D5A34] rounded-full w-8 h-8">
              <Instagram size={14} color="#1D5A34" />
            </Pressable>
            <Pressable className="mx-1 items-center justify-center border border-[#1D5A34] rounded-full w-8 h-8">
              <Twitter size={14} color="#1D5A34" />
            </Pressable>
          </View>
          
        </View>
      </KeyboardAwareScrollView>
      </SafeAreaView>
      <View style={{ height: insets.bottom, backgroundColor: "black", position: "absolute", bottom: 0, width: "100%" }} />
    </View>
  );
}

