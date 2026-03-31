import { useState, useEffect, memo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
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
  Clock,
  Save,
  LucideIcon,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../src/context/ThemeContext";

const STORE_INFO_KEY = "@dhiva_deva_store_info";

// InputField component defined outside to prevent keyboard issues
interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: LucideIcon;
  keyboardType?: "default" | "phone-pad" | "email-address" | "numeric";
  colors: any;
}

const InputField = memo(({
  label,
  value,
  onChangeText,
  placeholder,
  icon: Icon,
  keyboardType = "default",
  colors,
}: InputFieldProps) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: "500" }}>
      {label}
    </Text>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
      }}
    >
      <Icon size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        blurOnSubmit={false}
        style={{
          flex: 1,
          paddingVertical: 14,
          paddingHorizontal: 12,
          color: colors.text,
          fontSize: 15,
        }}
      />
    </View>
  </View>
));

interface StoreInfo {
  name: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  email: string;
  openTime: string;
  closeTime: string;
  gstNumber: string;
}

const defaultStoreInfo: StoreInfo = {
  name: "Dhiva Deva Super Markets",
  address: "122 Sollaikolaimedu, Nayakaneri Post, Ambur Tk",
  city: "Tirupathur",
  pincode: "635802",
  phone: "8940450960",
  email: "dhivakarp305@gmail.com",
  openTime: "08:00 AM",
  closeTime: "10:00 PM",
  gstNumber: "",
};

export default function StoreInfoScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(defaultStoreInfo);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStoreInfo();
  }, []);

  const loadStoreInfo = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORE_INFO_KEY);
      if (saved) {
        setStoreInfo(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading store info:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveStoreInfo = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORE_INFO_KEY, JSON.stringify(storeInfo));
      Toast.show({
        type: "success",
        text1: "Saved",
        text2: "Store information updated successfully",
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save store information",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof StoreInfo, value: string) => {
    setStoreInfo((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

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
          Store Information
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
        {/* Basic Info Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, marginBottom: 16 }}>
            Basic Information
          </Text>

          <InputField
            label="Store Name"
            value={storeInfo.name}
            onChangeText={(v) => updateField("name", v)}
            placeholder="Enter store name"
            icon={Store}
            colors={colors}
          />

          <InputField
            label="GST Number"
            value={storeInfo.gstNumber}
            onChangeText={(v) => updateField("gstNumber", v)}
            placeholder="Enter GST number"
            icon={Store}
            colors={colors}
          />
        </View>

        {/* Address Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, marginBottom: 16 }}>
            Address
          </Text>

          <InputField
            label="Street Address"
            value={storeInfo.address}
            onChangeText={(v) => updateField("address", v)}
            placeholder="Enter street address"
            icon={MapPin}
            colors={colors}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <InputField
                label="City"
                value={storeInfo.city}
                onChangeText={(v) => updateField("city", v)}
                placeholder="City"
                icon={MapPin}
                colors={colors}
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="Pincode"
                value={storeInfo.pincode}
                onChangeText={(v) => updateField("pincode", v)}
                placeholder="Pincode"
                icon={MapPin}
                keyboardType="numeric"
                colors={colors}
              />
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, marginBottom: 16 }}>
            Contact Details
          </Text>

          <InputField
            label="Phone Number"
            value={storeInfo.phone}
            onChangeText={(v) => updateField("phone", v)}
            placeholder="Enter phone number"
            icon={Phone}
            keyboardType="phone-pad"
            colors={colors}
          />

          <InputField
            label="Email Address"
            value={storeInfo.email}
            onChangeText={(v) => updateField("email", v)}
            placeholder="Enter email address"
            icon={Mail}
            keyboardType="email-address"
            colors={colors}
          />
        </View>

        {/* Business Hours Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, marginBottom: 16 }}>
            Business Hours
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Opening Time"
                value={storeInfo.openTime}
                onChangeText={(v) => updateField("openTime", v)}
                placeholder="08:00 AM"
                icon={Clock}
                colors={colors}
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="Closing Time"
                value={storeInfo.closeTime}
                onChangeText={(v) => updateField("closeTime", v)}
                placeholder="10:00 PM"
                icon={Clock}
                colors={colors}
              />
            </View>
          </View>
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
          onPress={saveStoreInfo}
          disabled={saving}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#2E7D32",
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
                Save Changes
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
