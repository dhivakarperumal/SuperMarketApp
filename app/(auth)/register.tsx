import { Link, useRouter } from "expo-router";
import {
  Eye,
  EyeOff,
  Lock,
  LucideIcon,
  Mail,
  User,
} from "lucide-react-native";
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
import { useAuth } from "../../src/context/AuthContext";

interface InputFieldProps {
  icon: LucideIcon;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words";
  showToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
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
  secureTextEntry = false,
  autoCapitalize = "sentences",
  showToggle = false,
  showPassword = false,
  onTogglePassword,
  inputKey,
  focusedInput,
  onFocus,
  onBlur,
}: InputFieldProps) => (
  <View className="mb-4">
    <Text className="mb-2 ml-1 text-[13px] font-medium text-slate-500">{label}</Text>
    <View
      className={`flex-row items-center rounded-full border bg-white px-4 ${
        focusedInput === inputKey ? "border-[#1D5C45]" : "border-[#E5E7EB]"
      }`}
      style={{ height: 54 }}
    >
      <Icon size={18} color={focusedInput === inputKey ? "#1D5C45" : "#9CA3AF"} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        onFocus={() => onFocus(inputKey)}
        onBlur={onBlur}
        className="ml-3 flex-1 text-slate-800"
        style={{ fontSize: 14 }}
      />
      {showToggle && onTogglePassword && (
        <Pressable onPress={onTogglePassword} hitSlop={8}>
          {showPassword ? (
            <EyeOff size={18} color="#94A3B8" />
          ) : (
            <Eye size={18} color="#94A3B8" />
          )}
        </Pressable>
      )}
    </View>
  </View>
);

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { signUp, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const handleFocus = (key: string) => setFocusedInput(key);
  const handleBlur = () => setFocusedInput(null);
  const togglePassword = () => setShowPassword(!showPassword);

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
    <SafeAreaView className="flex-1 bg-[#F7F8F4]" edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 }}
        enableOnAndroid
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pb-6 pt-2">
          <View className="items-center">
            <View
              style={{
                width: "100%",
                height: 210,
                alignItems: "center",
                justifyContent: "flex-end",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: -20,
                  right: -20,
                  height: 160,
                  backgroundColor: "#EAF2E4",
                  borderBottomLeftRadius: 120,
                  borderBottomRightRadius: 120,
                }}
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 18,
                  left: -30,
                  width: 240,
                  height: 70,
                  backgroundColor: "#E2E8DD",
                  transform: [{ rotate: "-10deg" }],
                }}
              />
              <Image
                source={require("../../assets/images/logo.png")}
                style={{ width: 160, height: 160 }}
                resizeMode="contain"
              />
            </View>

            <Text className="mt-2 text-[34px] font-bold text-[#202020]">Create Account</Text>
            <Text className="mt-1 text-sm text-[#6B7280]">Let&apos;s Create account together</Text>
          </View>

          <View className="mt-7">
            <InputField
              icon={User}
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
              autoCapitalize="words"
              inputKey="name"
              focusedInput={focusedInput}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />

            <InputField
              icon={Mail}
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              inputKey="email"
              focusedInput={focusedInput}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />

            <InputField
              icon={Lock}
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter Password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              showToggle={true}
              showPassword={showPassword}
              onTogglePassword={togglePassword}
              inputKey="password"
              focusedInput={focusedInput}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />

            <InputField
              icon={Lock}
              label="Repeat Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Enter Password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              showToggle={true}
              showPassword={showPassword}
              onTogglePassword={togglePassword}
              inputKey="confirmPassword"
              focusedInput={focusedInput}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />

            <Pressable
              onPress={handleRegister}
              disabled={loading}
              className="mt-5 items-center justify-center rounded-full bg-[#32CD32]"
              style={{ height: 54 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-semibold text-white">Register</Text>
              )}
            </Pressable>

            <Text className="mt-4 px-2 text-center text-xs leading-5 text-slate-400">
              By signing up, you agree to our <Text className="font-semibold text-[#1D5C45]">Terms</Text> and <Text className="font-semibold text-[#1D5C45]">Privacy Policy</Text>.
            </Text>

            <View className="mt-5 flex-row justify-center">
              <Text className="text-slate-500">I have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text className="font-semibold text-[#1D5C45]">Log in</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
