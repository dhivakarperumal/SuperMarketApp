import { useState, useEffect, memo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  Switch,
  Image,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ChevronLeft,
  Store,
  MapPin,
  Phone,
  Mail,
  Save,
  Receipt,
  QrCode,
  FileText,
  Percent,
  Type,
  MessageSquare,
  LucideIcon,
  Check,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../../src/context/ThemeContext";
import { useReceiptSettings, defaultReceiptSettings } from "../../../src/hooks/useReceiptSettings";
import { ReceiptSettings, GSTDisplayType } from "../../../src/types";
import { isValidUPIId } from "../../../src/utils/upiQR";
import { processImageForFirestore } from "../../../src/utils/imageUtils";

// InputField component
interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: LucideIcon;
  keyboardType?: "default" | "phone-pad" | "email-address" | "numeric";
  colors: any;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
}

const InputField = memo(({
  label,
  value,
  onChangeText,
  placeholder,
  icon: Icon,
  keyboardType = "default",
  colors,
  multiline = false,
  numberOfLines = 1,
  error,
}: InputFieldProps) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: "500" }}>
      {label}
    </Text>
    <View
      style={{
        flexDirection: "row",
        alignItems: multiline ? "flex-start" : "center",
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: error ? "#EF4444" : colors.border,
        paddingHorizontal: 14,
        paddingVertical: multiline ? 8 : 0,
      }}
    >
      <Icon size={20} color={error ? "#EF4444" : colors.textMuted} style={{ marginTop: multiline ? 6 : 0 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        blurOnSubmit={!multiline}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={{
          flex: 1,
          paddingVertical: multiline ? 8 : 14,
          paddingHorizontal: 12,
          color: colors.text,
          fontSize: 15,
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
    {error && (
      <Text style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>{error}</Text>
    )}
  </View>
));

// Toggle Section component
interface ToggleSectionProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: any;
}

const ToggleSection = memo(({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  value,
  onValueChange,
  colors,
}: ToggleSectionProps) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
    }}
  >
    <View
      style={{
        width: 44,
        height: 44,
        backgroundColor: iconBg,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={22} color={iconColor} />
    </View>
    <View style={{ marginLeft: 14, flex: 1 }}>
      <Text style={{ fontWeight: "600", color: colors.text, fontSize: 15 }}>
        {title}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
        {subtitle}
      </Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: "#1D5A34" }}
      thumbColor="#FFFFFF"
    />
  </View>
));

// Option Button component for GST type selection
interface OptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
  isDark: boolean;
}

const OptionButton = memo(({
  label,
  selected,
  onPress,
  colors,
  isDark,
}: OptionButtonProps) => (
  <Pressable
    onPress={onPress}
    style={{
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: selected
        ? isDark ? "#14532D" : "#E8F5E9"
        : colors.surface,
      borderWidth: 1,
      borderColor: selected ? "#1D5A34" : colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {selected && (
      <Check size={16} color="#1D5A34" style={{ marginRight: 6 }} />
    )}
    <Text
      style={{
        color: selected ? "#1D5A34" : colors.text,
        fontWeight: selected ? "600" : "500",
        fontSize: 14,
      }}
    >
      {label}
    </Text>
  </Pressable>
));

// GST Rate Button
interface GSTRateButtonProps {
  rate: number;
  selected: boolean;
  onPress: () => void;
  colors: any;
  isDark: boolean;
}

const GSTRateButton = memo(({
  rate,
  selected,
  onPress,
  colors,
  isDark,
}: GSTRateButtonProps) => (
  <Pressable
    onPress={onPress}
    style={{
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: selected
        ? isDark ? "#14532D" : "#E8F5E9"
        : colors.surface,
      borderWidth: 1,
      borderColor: selected ? "#1D5A34" : colors.border,
      alignItems: "center",
    }}
  >
    <Text
      style={{
        color: selected ? "#1D5A34" : colors.text,
        fontWeight: "600",
        fontSize: 16,
      }}
    >
      {rate}%
    </Text>
  </Pressable>
));

export default function ReceiptSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { settings, isLoading, saveSettings } = useReceiptSettings();

  const [formData, setFormData] = useState<Partial<ReceiptSettings>>(defaultReceiptSettings);
  const [saving, setSaving] = useState(false);
  const [upiError, setUpiError] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [customGstRate, setCustomGstRate] = useState("");
  const [useCustomGst, setUseCustomGst] = useState(false);

  // Preset GST rates
  const gstRates = [5, 10, 12, 18];

  // Load settings into form
  useEffect(() => {
    if (settings) {
      const gstRate = settings.gstRate || 5;
      const isCustom = !gstRates.includes(gstRate);

      setFormData({
        storeName: settings.storeName || defaultReceiptSettings.storeName,
        tagline: settings.tagline || defaultReceiptSettings.tagline,
        address: settings.address || defaultReceiptSettings.address,
        city: settings.city || defaultReceiptSettings.city,
        state: settings.state || defaultReceiptSettings.state,
        pincode: settings.pincode || defaultReceiptSettings.pincode,
        phone: settings.phone || defaultReceiptSettings.phone,
        email: settings.email || "",
        logoUrl: settings.logoUrl || "",
        showLogo: settings.showLogo || false,
        footerMessage: settings.footerMessage || defaultReceiptSettings.footerMessage,
        footerSubMessage: settings.footerSubMessage || "",
        upiEnabled: settings.upiEnabled || false,
        upiId: settings.upiId || "",
        upiMerchantName: settings.upiMerchantName || "",
        gstEnabled: settings.gstEnabled || false,
        gstDisplayType: settings.gstDisplayType || "none",
        gstRate: gstRate,
        gstin: settings.gstin || "",
        stateCode: settings.stateCode || "",
        fontSize: settings.fontSize || "medium",
      });

      if (isCustom) {
        setUseCustomGst(true);
        setCustomGstRate(String(gstRate));
      }
    }
  }, [settings]);

  const updateField = (field: keyof ReceiptSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate UPI ID when it changes
    if (field === "upiId") {
      if (value && !isValidUPIId(value)) {
        setUpiError("Invalid UPI ID format (e.g., merchant@upi)");
      } else {
        setUpiError("");
      }
    }
  };

  const handleSelectGstRate = (rate: number) => {
    setUseCustomGst(false);
    setCustomGstRate("");
    updateField("gstRate", rate);
  };

  const handleCustomGstChange = (value: string) => {
    setCustomGstRate(value);
    setUseCustomGst(true);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 100) {
      updateField("gstRate", numValue);
    }
  };

  const pickLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingLogo(true);
        const uri = result.assets[0].uri;

        // Compress, convert to base64, and validate size for Firestore
        const base64Image = await processImageForFirestore(uri, {
          maxWidth: 200,    // Small logo size
          quality: 0.6,     // Good compression
          maxSizeKB: 150,   // Keep under 150KB for fast loading
        });

        updateField("logoUrl", base64Image);
        updateField("showLogo", true);

        Toast.show({
          type: "success",
          text1: "Logo Added",
          text2: "Your receipt logo has been saved",
        });
      }
    } catch (error: any) {
      console.error("Logo error:", error);
      Toast.show({
        type: "error",
        text1: "Failed",
        text2: error.message || "Failed to add logo image",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    updateField("logoUrl", "");
    updateField("showLogo", false);
  };

  const handleSave = async () => {
    // Validate UPI if enabled
    if (formData.upiEnabled && formData.upiId && !isValidUPIId(formData.upiId)) {
      Toast.show({
        type: "error",
        text1: "Invalid UPI ID",
        text2: "Please enter a valid UPI ID",
      });
      return;
    }

    // Validate custom GST rate
    if (useCustomGst) {
      const rate = parseFloat(customGstRate);
      if (isNaN(rate) || rate <= 0 || rate > 100) {
        Toast.show({
          type: "error",
          text1: "Invalid GST Rate",
          text2: "Please enter a valid GST rate (1-100)",
        });
        return;
      }
    }

    setSaving(true);
    try {
      await saveSettings(formData);
      Toast.show({
        type: "success",
        text1: "Saved",
        text2: "Receipt settings updated successfully",
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save receipt settings",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !settings) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top","bottom"]}>
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
          Receipt Settings
        </Text>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === "ios" ? 120 : 80}
        keyboardShouldPersistTaps="handled"
      >
        {/* Store Information Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 36,
                height: 36,
                backgroundColor: isDark ? "#1E3A8A" : "#DBEAFE",
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Store size={20} color="#3B82F6" />
            </View>
            <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, marginLeft: 12 }}>
              Store Information
            </Text>
          </View>

          <InputField
            label="Store Name"
            value={formData.storeName || ""}
            onChangeText={(v) => updateField("storeName", v)}
            placeholder="Enter store name"
            icon={Store}
            colors={colors}
          />

          <InputField
            label="Tagline"
            value={formData.tagline || ""}
            onChangeText={(v) => updateField("tagline", v)}
            placeholder="Enter tagline (e.g., SUPER MARKET)"
            icon={Type}
            colors={colors}
          />

          <InputField
            label="Address"
            value={formData.address || ""}
            onChangeText={(v) => updateField("address", v)}
            placeholder="Enter street address"
            icon={MapPin}
            colors={colors}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <InputField
                label="City"
                value={formData.city || ""}
                onChangeText={(v) => updateField("city", v)}
                placeholder="City"
                icon={MapPin}
                colors={colors}
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="State"
                value={formData.state || ""}
                onChangeText={(v) => updateField("state", v)}
                placeholder="State"
                icon={MapPin}
                colors={colors}
              />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Pincode"
                value={formData.pincode || ""}
                onChangeText={(v) => updateField("pincode", v)}
                placeholder="Pincode"
                icon={MapPin}
                keyboardType="numeric"
                colors={colors}
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="Phone"
                value={formData.phone || ""}
                onChangeText={(v) => updateField("phone", v)}
                placeholder="Phone"
                icon={Phone}
                keyboardType="phone-pad"
                colors={colors}
              />
            </View>
          </View>

          <InputField
            label="Email (Optional)"
            value={formData.email || ""}
            onChangeText={(v) => updateField("email", v)}
            placeholder="Enter email address"
            icon={Mail}
            keyboardType="email-address"
            colors={colors}
          />
        </View>

        {/* Receipt Logo Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 36,
                height: 36,
                backgroundColor: isDark ? "#7C2D12" : "#FEF3C7",
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ImageIcon size={20} color="#D97706" />
            </View>
            <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, marginLeft: 12 }}>
              Receipt Logo
            </Text>
          </View>

          {formData.logoUrl ? (
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: formData.logoUrl }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 12,
                    backgroundColor: colors.surface,
                  }}
                  resizeMode="contain"
                />
                <Pressable
                  onPress={removeLogo}
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: "#EF4444",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={16} color="#FFFFFF" />
                </Pressable>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
                Tap X to remove logo
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={pickLogo}
              disabled={uploadingLogo}
              style={{
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: colors.border,
                borderRadius: 12,
                padding: 24,
                alignItems: "center",
                backgroundColor: colors.surface,
              }}
            >
              {uploadingLogo ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Upload size={32} color={colors.textMuted} />
                  <Text style={{ color: colors.textSecondary, marginTop: 8, fontWeight: "500" }}>
                    Upload Logo
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                    PNG or JPG (1:1 ratio)
                  </Text>
                </>
              )}
            </Pressable>
          )}

          <ToggleSection
            icon={ImageIcon}
            iconBg={isDark ? "#7C2D12" : "#FEF3C7"}
            iconColor="#D97706"
            title="Show Logo on Receipts"
            subtitle="Display store logo at the top of receipts"
            value={formData.showLogo || false}
            onValueChange={(v) => updateField("showLogo", v)}
            colors={colors}
          />
        </View>

        {/* UPI Payment Settings */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 36,
                height: 36,
                backgroundColor: isDark ? "#581C87" : "#F3E8FF",
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <QrCode size={20} color="#9333EA" />
            </View>
            <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, marginLeft: 12 }}>
              UPI Payment Settings
            </Text>
          </View>

          <ToggleSection
            icon={QrCode}
            iconBg={isDark ? "#581C87" : "#F3E8FF"}
            iconColor="#9333EA"
            title="Enable UPI QR Code"
            subtitle="Show QR code on receipts for easy payment"
            value={formData.upiEnabled || false}
            onValueChange={(v) => updateField("upiEnabled", v)}
            colors={colors}
          />

          {formData.upiEnabled && (
            <>
              <InputField
                label="UPI ID"
                value={formData.upiId || ""}
                onChangeText={(v) => updateField("upiId", v)}
                placeholder="merchant@upi"
                icon={Receipt}
                colors={colors}
                error={upiError}
              />

              <InputField
                label="Merchant Name"
                value={formData.upiMerchantName || ""}
                onChangeText={(v) => updateField("upiMerchantName", v)}
                placeholder="Name shown on payment apps"
                icon={Store}
                colors={colors}
              />

              <View
                style={{
                  backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                  borderRadius: 10,
                  padding: 12,
                  marginTop: 8,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  QR code will be generated with order amount for easy scanning by customers.
                </Text>
              </View>
            </>
          )}
        </View>

        {/* GST Settings */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 36,
                height: 36,
                backgroundColor: isDark ? "#14532D" : "#E8F5E9",
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Percent size={20} color="#66BB6A" />
            </View>
            <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, marginLeft: 12 }}>
              GST Settings
            </Text>
          </View>

          <ToggleSection
            icon={FileText}
            iconBg={isDark ? "#14532D" : "#E8F5E9"}
            iconColor="#66BB6A"
            title="Enable GST on Receipts"
            subtitle="Show GST details on printed receipts"
            value={formData.gstEnabled || false}
            onValueChange={(v) => {
              updateField("gstEnabled", v);
              if (!v) {
                updateField("gstDisplayType", "none");
              } else {
                updateField("gstDisplayType", "inclusive");
              }
            }}
            colors={colors}
          />

          {formData.gstEnabled && (
            <>
              {/* GST Display Type */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: "500" }}>
                  GST Display Type
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <OptionButton
                    label="Inclusive"
                    selected={formData.gstDisplayType === "inclusive"}
                    onPress={() => updateField("gstDisplayType", "inclusive" as GSTDisplayType)}
                    colors={colors}
                    isDark={isDark}
                  />
                  <OptionButton
                    label="Exclusive"
                    selected={formData.gstDisplayType === "exclusive"}
                    onPress={() => updateField("gstDisplayType", "exclusive" as GSTDisplayType)}
                    colors={colors}
                    isDark={isDark}
                  />
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 8 }}>
                  {formData.gstDisplayType === "inclusive"
                    ? "GST is included in item prices (prices shown are final)"
                    : "GST is added separately to item prices (total = price + GST)"}
                </Text>
              </View>

              {/* GST Rate Selection */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: "500" }}>
                  GST Rate (%)
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                  {gstRates.map((rate) => (
                    <GSTRateButton
                      key={rate}
                      rate={rate}
                      selected={!useCustomGst && formData.gstRate === rate}
                      onPress={() => handleSelectGstRate(rate)}
                      colors={colors}
                      isDark={isDark}
                    />
                  ))}
                </View>

                {/* Custom GST Input */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    Custom:
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.surface,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: useCustomGst ? "#1D5A34" : colors.border,
                      paddingHorizontal: 12,
                    }}
                  >
                    <TextInput
                      value={customGstRate}
                      onChangeText={handleCustomGstChange}
                      placeholder="Enter rate"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        color: colors.text,
                        fontSize: 14,
                      }}
                    />
                    <Text style={{ color: colors.textMuted, fontSize: 14 }}>%</Text>
                  </View>
                </View>
              </View>

              <InputField
                label="GSTIN"
                value={formData.gstin || ""}
                onChangeText={(v) => updateField("gstin", v.toUpperCase())}
                placeholder="Enter GSTIN number"
                icon={FileText}
                colors={colors}
              />

              <InputField
                label="State Code"
                value={formData.stateCode || ""}
                onChangeText={(v) => updateField("stateCode", v)}
                placeholder="e.g., 33 for Tamil Nadu"
                icon={MapPin}
                keyboardType="numeric"
                colors={colors}
              />
            </>
          )}
        </View>

        {/* Footer Message */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 36,
                height: 36,
                backgroundColor: isDark ? "#164E63" : "#CFFAFE",
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageSquare size={20} color="#06B6D4" />
            </View>
            <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, marginLeft: 12 }}>
              Footer Message
            </Text>
          </View>

          <InputField
            label="Thank You Message"
            value={formData.footerMessage || ""}
            onChangeText={(v) => updateField("footerMessage", v)}
            placeholder="Thank you for shopping!"
            icon={MessageSquare}
            colors={colors}
          />

          <InputField
            label="Sub Message (Optional)"
            value={formData.footerSubMessage || ""}
            onChangeText={(v) => updateField("footerSubMessage", v)}
            placeholder="Visit again!"
            icon={MessageSquare}
            colors={colors}
          />
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
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#1D5A34",
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
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16, marginLeft: 8 }}>
                Save Settings
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
