import { useState, memo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Switch,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ChevronLeft,
  MessageCircle,
  Phone,
  Clock,
  Save,
  ToggleLeft,
  ShoppingCart,
  Package,
  CreditCard,
  MessageSquare,
  Headphones,
  Zap,
  LucideIcon,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useTheme } from "../../../src/context/ThemeContext";
import { useWhatsApp } from "../../../src/context/WhatsAppContext";

const WHATSAPP_GREEN = "#25D366";

// InputField component - defined outside to prevent re-creation on each render
interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: LucideIcon;
  keyboardType?: "default" | "phone-pad" | "email-address" | "numeric";
  multiline?: boolean;
  colors: any;
}

const InputField = memo(({
  label,
  value,
  onChangeText,
  placeholder,
  icon: Icon,
  keyboardType = "default",
  multiline = false,
  colors,
}: InputFieldProps) => (
  <View style={{ marginBottom: 16 }}>
    <Text
      style={{
        color: colors.textSecondary,
        fontSize: 13,
        marginBottom: 8,
        fontWeight: "500",
      }}
    >
      {label}
    </Text>
    <View
      style={{
        flexDirection: multiline ? "column" : "row",
        alignItems: multiline ? "flex-start" : "center",
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: multiline ? 12 : 0,
      }}
    >
      {!multiline && <Icon size={20} color={colors.textMuted} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        blurOnSubmit={false}
        style={{
          flex: 1,
          paddingVertical: multiline ? 0 : 14,
          paddingHorizontal: multiline ? 0 : 12,
          color: colors.text,
          fontSize: 15,
          textAlignVertical: multiline ? "top" : "center",
          minHeight: multiline ? 80 : undefined,
        }}
      />
    </View>
  </View>
));

// ToggleField component - defined outside to prevent re-creation on each render
interface ToggleFieldProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon: LucideIcon;
  colors: any;
}

const ToggleField = memo(({
  label,
  description,
  value,
  onValueChange,
  icon: Icon,
  colors,
}: ToggleFieldProps) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: value ? `${WHATSAPP_GREEN}15` : colors.surface,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Icon size={18} color={value ? WHATSAPP_GREEN : colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "500" }}>
          {label}
        </Text>
        {description && (
          <Text
            style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}
          >
            {description}
          </Text>
        )}
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: WHATSAPP_GREEN }}
      thumbColor={value ? "#FFFFFF" : colors.textMuted}
    />
  </View>
));

const DAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

export default function WhatsAppSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { config, loading, updateConfig } = useWhatsApp();
  const [saving, setSaving] = useState(false);

  // Local state for form
  const [formData, setFormData] = useState({
    isEnabled: config.isEnabled,
    phoneNumber: config.phoneNumber,
    displayNumber: config.displayNumber,
    isAvailable24x7: config.isAvailable24x7,
    availableDays: config.availableDays,
    availableFromTime: config.availableFromTime,
    availableToTime: config.availableToTime,
    enableProductOrders: config.enableProductOrders,
    enableCartOrders: config.enableCartOrders,
    enablePOSOrders: config.enablePOSOrders,
    enableSupport: config.enableSupport,
    allowCOD: config.allowCOD,
    allowOnlinePayment: config.allowOnlinePayment,
    welcomeMessage: config.welcomeMessage,
    orderConfirmationMessage: config.orderConfirmationMessage,
    autoResponseEnabled: config.autoResponseEnabled,
    autoResponseMessage: config.autoResponseMessage,
  });

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: number) => {
    const days = formData.availableDays;
    if (days.includes(day)) {
      updateField(
        "availableDays",
        days.filter((d) => d !== day)
      );
    } else {
      updateField("availableDays", [...days, day].sort());
    }
  };

  const saveSettings = async () => {
    // Validate phone number
    if (formData.isEnabled && !formData.phoneNumber) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter WhatsApp phone number",
      });
      return;
    }

    setSaving(true);
    try {
      await updateConfig(formData);
      Toast.show({
        type: "success",
        text1: "Saved",
        text2: "WhatsApp settings updated successfully",
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save WhatsApp settings",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={WHATSAPP_GREEN} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.surface }}
      edges={["top"]}
    >
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
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${WHATSAPP_GREEN}15`,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 12,
          }}
        >
          <MessageCircle size={22} color={WHATSAPP_GREEN} />
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: colors.text,
            marginLeft: 12,
          }}
        >
          WhatsApp Orders
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
        {/* Master Toggle */}
        <View
          style={{
            backgroundColor: formData.isEnabled
              ? `${WHATSAPP_GREEN}10`
              : colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: formData.isEnabled ? 2 : 1,
            borderColor: formData.isEnabled ? WHATSAPP_GREEN : colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: formData.isEnabled
                    ? WHATSAPP_GREEN
                    : colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap
                  size={24}
                  color={formData.isEnabled ? "#FFFFFF" : colors.textMuted}
                />
              </View>
              <View style={{ marginLeft: 14 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 17,
                    fontWeight: "700",
                  }}
                >
                  WhatsApp Ordering
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  {formData.isEnabled
                    ? "Accepting orders via WhatsApp"
                    : "WhatsApp orders disabled"}
                </Text>
              </View>
            </View>
            <Switch
              value={formData.isEnabled}
              onValueChange={(v) => updateField("isEnabled", v)}
              trackColor={{ false: colors.border, true: WHATSAPP_GREEN }}
              thumbColor={formData.isEnabled ? "#FFFFFF" : colors.textMuted}
            />
          </View>
        </View>

        {/* Phone Number Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontWeight: "600",
              fontSize: 16,
              marginBottom: 16,
            }}
          >
            Phone Number
          </Text>

          <InputField
            label="WhatsApp Number (with country code)"
            value={formData.phoneNumber}
            onChangeText={(v) => updateField("phoneNumber", v)}
            placeholder="+91 8940450960"
            icon={Phone}
            keyboardType="phone-pad"
            colors={colors}
          />

          <InputField
            label="Display Number (shown to customers)"
            value={formData.displayNumber}
            onChangeText={(v) => updateField("displayNumber", v)}
            placeholder="+91 89404 50960"
            icon={Phone}
            keyboardType="phone-pad"
            colors={colors}
          />
        </View>

        {/* Availability Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontWeight: "600",
              fontSize: 16,
              marginBottom: 16,
            }}
          >
            Availability
          </Text>

          <ToggleField
            label="Available 24x7"
            description="Accept orders round the clock"
            value={formData.isAvailable24x7}
            onValueChange={(v) => updateField("isAvailable24x7", v)}
            icon={Clock}
            colors={colors}
          />

          {!formData.isAvailable24x7 && (
            <>
              {/* Day Selector */}
              <View style={{ marginTop: 16 }}>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    marginBottom: 8,
                    fontWeight: "500",
                  }}
                >
                  Available Days
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {DAYS.map((day) => {
                    const isSelected = formData.availableDays.includes(
                      day.value
                    );
                    return (
                      <Pressable
                        key={day.value}
                        onPress={() => toggleDay(day.value)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 10,
                          backgroundColor: isSelected
                            ? WHATSAPP_GREEN
                            : colors.surface,
                          borderWidth: 1,
                          borderColor: isSelected
                            ? WHATSAPP_GREEN
                            : colors.border,
                        }}
                      >
                        <Text
                          style={{
                            color: isSelected ? "#FFFFFF" : colors.text,
                            fontWeight: "600",
                            fontSize: 13,
                          }}
                        >
                          {day.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Time Range */}
              <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                <View style={{ flex: 1 }}>
                  <InputField
                    label="From Time"
                    value={formData.availableFromTime}
                    onChangeText={(v) => updateField("availableFromTime", v)}
                    placeholder="08:00"
                    icon={Clock}
                    colors={colors}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField
                    label="To Time"
                    value={formData.availableToTime}
                    onChangeText={(v) => updateField("availableToTime", v)}
                    placeholder="22:00"
                    icon={Clock}
                    colors={colors}
                  />
                </View>
              </View>
            </>
          )}
        </View>

        {/* Features Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontWeight: "600",
              fontSize: 16,
              marginBottom: 8,
            }}
          >
            Order Features
          </Text>

          <ToggleField
            label="Product Orders"
            description="Order single products from product page"
            value={formData.enableProductOrders}
            onValueChange={(v) => updateField("enableProductOrders", v)}
            icon={Package}
            colors={colors}
          />

          <ToggleField
            label="Cart Orders"
            description="Checkout entire cart via WhatsApp"
            value={formData.enableCartOrders}
            onValueChange={(v) => updateField("enableCartOrders", v)}
            icon={ShoppingCart}
            colors={colors}
          />

          <ToggleField
            label="POS Orders"
            description="Send bills from POS via WhatsApp"
            value={formData.enablePOSOrders}
            onValueChange={(v) => updateField("enablePOSOrders", v)}
            icon={CreditCard}
            colors={colors}
          />

          <ToggleField
            label="Customer Support"
            description="Allow customers to contact for support"
            value={formData.enableSupport}
            onValueChange={(v) => updateField("enableSupport", v)}
            icon={Headphones}
            colors={colors}
          />
        </View>

        {/* Payment Options Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontWeight: "600",
              fontSize: 16,
              marginBottom: 8,
            }}
          >
            Payment Options
          </Text>

          <ToggleField
            label="Cash on Delivery"
            description="Accept COD for WhatsApp orders"
            value={formData.allowCOD}
            onValueChange={(v) => updateField("allowCOD", v)}
            icon={CreditCard}
            colors={colors}
          />

          <ToggleField
            label="Online Payment"
            description="Accept online payments"
            value={formData.allowOnlinePayment}
            onValueChange={(v) => updateField("allowOnlinePayment", v)}
            icon={CreditCard}
            colors={colors}
          />
        </View>

        {/* Messages Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontWeight: "600",
              fontSize: 16,
              marginBottom: 16,
            }}
          >
            Messages
          </Text>

          <InputField
            label="Welcome Message"
            value={formData.welcomeMessage}
            onChangeText={(v) => updateField("welcomeMessage", v)}
            placeholder="Hello! Welcome to our store..."
            icon={MessageSquare}
            multiline
            colors={colors}
          />

          <InputField
            label="Order Confirmation Message"
            value={formData.orderConfirmationMessage}
            onChangeText={(v) => updateField("orderConfirmationMessage", v)}
            placeholder="Thank you for your order..."
            icon={MessageSquare}
            multiline
            colors={colors}
          />
        </View>

        {/* Auto Response Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontWeight: "600",
              fontSize: 16,
              marginBottom: 8,
            }}
          >
            Auto Response
          </Text>

          <ToggleField
            label="Enable Auto Response"
            description="Send automatic replies to customers"
            value={formData.autoResponseEnabled}
            onValueChange={(v) => updateField("autoResponseEnabled", v)}
            icon={Zap}
            colors={colors}
          />

          {formData.autoResponseEnabled && (
            <View style={{ marginTop: 12 }}>
              <InputField
                label="Auto Response Message"
                value={formData.autoResponseMessage}
                onChangeText={(v) => updateField("autoResponseMessage", v)}
                placeholder="Thank you for contacting us..."
                icon={MessageSquare}
                multiline
                colors={colors}
              />
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* Save Button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Pressable
          onPress={saveSettings}
          disabled={saving}
          style={{
            backgroundColor: WHATSAPP_GREEN,
            paddingVertical: 16,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: WHATSAPP_GREEN,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" />
              <Text
                style={{
                  color: "#FFFFFF",
                  fontWeight: "700",
                  fontSize: 16,
                  marginLeft: 8,
                }}
              >
                Save Settings
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
