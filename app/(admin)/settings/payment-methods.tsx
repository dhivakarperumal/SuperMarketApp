import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Switch,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import {
  ChevronLeft,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  QrCode,
  Wallet,
  Check,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../src/context/ThemeContext";

const PAYMENT_METHODS_KEY = "@dhiva_deva_payment_methods";

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  upiId?: string;
}

const defaultPaymentMethods: PaymentMethod[] = [
  {
    id: "cod",
    name: "Cash on Delivery",
    description: "Accept cash when order is delivered",
    icon: "banknote",
    enabled: true,
  },
  {
    id: "upi",
    name: "UPI Payment",
    description: "Accept payments via UPI apps",
    icon: "smartphone",
    enabled: false,
    upiId: "",
  },
  {
    id: "card",
    name: "Card Payment",
    description: "Accept credit/debit cards",
    icon: "creditcard",
    enabled: false,
  },
  {
    id: "netbanking",
    name: "Net Banking",
    description: "Accept bank transfers",
    icon: "building",
    enabled: false,
  },
  {
    id: "wallet",
    name: "Digital Wallets",
    description: "Paytm, PhonePe, etc.",
    icon: "wallet",
    enabled: false,
  },
];

export default function PaymentMethodsScreen() {
  const { colors, isDark } = useTheme();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(defaultPaymentMethods);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const saved = await AsyncStorage.getItem(PAYMENT_METHODS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPaymentMethods(parsed);
        const upiMethod = parsed.find((m: PaymentMethod) => m.id === "upi");
        if (upiMethod?.upiId) {
          setUpiId(upiMethod.upiId);
        }
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentMethod = async (methodId: string) => {
    const updated = paymentMethods.map((method) =>
      method.id === methodId ? { ...method, enabled: !method.enabled } : method
    );
    setPaymentMethods(updated);

    try {
      await AsyncStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(updated));
      Toast.show({
        type: "success",
        text1: "Updated",
        text2: "Payment method settings saved",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save settings",
      });
    }
  };

  const saveUpiId = async () => {
    setSaving(true);
    const updated = paymentMethods.map((method) =>
      method.id === "upi" ? { ...method, upiId } : method
    );
    setPaymentMethods(updated);

    try {
      await AsyncStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(updated));
      Toast.show({
        type: "success",
        text1: "Saved",
        text2: "UPI ID saved successfully",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save UPI ID",
      });
    } finally {
      setSaving(false);
    }
  };

  const getIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case "banknote":
        return <Banknote size={24} color={color} />;
      case "smartphone":
        return <Smartphone size={24} color={color} />;
      case "creditcard":
        return <CreditCard size={24} color={color} />;
      case "building":
        return <Building2 size={24} color={color} />;
      case "wallet":
        return <Wallet size={24} color={color} />;
      default:
        return <CreditCard size={24} color={color} />;
    }
  };

  const getIconBg = (methodId: string, enabled: boolean) => {
    if (!enabled) return isDark ? "#374151" : "#F3F4F6";
    switch (methodId) {
      case "cod":
        return isDark ? "#14532D" : "#E8F5E9";
      case "upi":
        return isDark ? "#581C87" : "#F3E8FF";
      case "card":
        return isDark ? "#1E3A8A" : "#DBEAFE";
      case "netbanking":
        return isDark ? "#164E63" : "#CFFAFE";
      case "wallet":
        return isDark ? "#7C2D12" : "#FFEDD5";
      default:
        return isDark ? "#374151" : "#F3F4F6";
    }
  };

  const getIconColor = (methodId: string, enabled: boolean) => {
    if (!enabled) return colors.textMuted;
    switch (methodId) {
      case "cod":
        return "#66BB6A";
      case "upi":
        return "#9333EA";
      case "card":
        return "#3B82F6";
      case "netbanking":
        return "#06B6D4";
      case "wallet":
        return "#F97316";
      default:
        return colors.textMuted;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const upiMethod = paymentMethods.find((m) => m.id === "upi");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
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
          Payment Methods
        </Text>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === "ios" ? 120 : 80}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Card */}
        <View
          style={{
            backgroundColor: isDark ? "#1E3A8A20" : "#EFF6FF",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: isDark ? "#1E3A8A" : "#BFDBFE",
          }}
        >
          <Text style={{ color: isDark ? "#93C5FD" : "#1D4ED8", fontWeight: "600", marginBottom: 4 }}>
            Payment Configuration
          </Text>
          <Text style={{ color: isDark ? "#93C5FD" : "#3B82F6", fontSize: 13 }}>
            Enable the payment methods you want to accept from customers. At least one method must be enabled.
          </Text>
        </View>

        {/* Payment Methods List */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: "hidden" }}>
          {paymentMethods.map((method, index) => (
            <View key={method.id}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: index < paymentMethods.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    backgroundColor: getIconBg(method.id, method.enabled),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {getIcon(method.icon, getIconColor(method.id, method.enabled))}
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>
                    {method.name}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                    {method.description}
                  </Text>
                </View>
                <Switch
                  value={method.enabled}
                  onValueChange={() => togglePaymentMethod(method.id)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* UPI ID Input */}
              {method.id === "upi" && method.enabled && (
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingBottom: 16,
                    backgroundColor: isDark ? "#581C8710" : "#FAF5FF",
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
                    Your UPI ID
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: colors.card,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <QrCode size={18} color={colors.textMuted} />
                      <TextInput
                        value={upiId}
                        onChangeText={setUpiId}
                        placeholder="yourname@upi"
                        placeholderTextColor={colors.textMuted}
                        style={{
                          flex: 1,
                          paddingVertical: 12,
                          paddingHorizontal: 10,
                          color: colors.text,
                        }}
                      />
                    </View>
                    <Pressable
                      onPress={saveUpiId}
                      disabled={saving}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 16,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Check size={20} color="#FFFFFF" />
                      )}
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Note */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: "center" }}>
            Note: Online payment methods (UPI, Card, Net Banking, Wallets) require payment gateway integration.
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
