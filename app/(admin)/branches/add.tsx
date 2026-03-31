import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import {
  ChevronLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText,
  Hash,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useBranch } from "../../../src/context/BranchContext";
import { usePermissions } from "../../../src/context/PermissionContext";

export default function AddBranchScreen() {
  const insets = useSafeAreaInsets();
  const { createBranch, branches } = useBranch();
  const { isAdmin, hasPermission } = usePermissions();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    gstin: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAdmin || !hasPermission("branches.create")) {
      Toast.show({
        type: "error",
        text1: "Access Denied",
        text2: "Only admin can create branches",
      });
      router.back();
    }
  }, [isAdmin]);

  // Auto-generate branch code
  useEffect(() => {
    const nextCode = `BR${String(branches.length + 1).padStart(3, "0")}`;
    setFormData((prev) => ({ ...prev, code: nextCode }));
  }, [branches.length]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Branch name is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Invalid pincode (6 digits required)";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number (10 digits required)";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
      newErrors.gstin = "Invalid GSTIN format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await createBranch({
        name: formData.name.trim(),
        code: formData.code,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        gstin: formData.gstin.trim() || undefined,
        businessId: "", // Will be set by context
        isActive: true,
      } as any);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Branch created successfully",
      });

      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to create branch",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-3"
          >
            <ChevronLeft size={20} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-800">Add Branch</Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          {/* Info Card */}
          <View className="bg-blue-50 rounded-xl p-4 mb-6">
            <Text className="text-blue-800 font-medium text-sm">
              Create a new branch for your business. Each branch can have its own
              inventory, staff, and billing.
            </Text>
          </View>

          {/* Basic Info */}
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-gray-800 font-semibold mb-3">Basic Information</Text>

            {/* Branch Name */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Branch Name *</Text>
              <View
                className={`flex-row items-center border rounded-xl px-4 ${
                  errors.name ? "border-red-500" : "border-gray-200"
                }`}
                style={{ height: 50 }}
              >
                <Building2 size={20} color="#9CA3AF" />
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => {
                    setFormData({ ...formData, name: text });
                    setErrors({ ...errors, name: "" });
                  }}
                  placeholder="e.g., Main Branch, Downtown Store"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 ml-3 text-gray-800"
                />
              </View>
              {errors.name && (
                <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>
              )}
            </View>

            {/* Branch Code (Auto-generated) */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Branch Code</Text>
              <View
                className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-gray-50"
                style={{ height: 50 }}
              >
                <Hash size={20} color="#9CA3AF" />
                <Text className="flex-1 ml-3 text-gray-500">{formData.code}</Text>
                <Text className="text-gray-400 text-xs">Auto-generated</Text>
              </View>
            </View>
          </View>

          {/* Address Info */}
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-gray-800 font-semibold mb-3">Address</Text>

            {/* Address */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Street Address *</Text>
              <View
                className={`flex-row items-start border rounded-xl px-4 py-3 ${
                  errors.address ? "border-red-500" : "border-gray-200"
                }`}
              >
                <MapPin size={20} color="#9CA3AF" style={{ marginTop: 2 }} />
                <TextInput
                  value={formData.address}
                  onChangeText={(text) => {
                    setFormData({ ...formData, address: text });
                    setErrors({ ...errors, address: "" });
                  }}
                  placeholder="Enter full address"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={2}
                  className="flex-1 ml-3 text-gray-800"
                  style={{ textAlignVertical: "top", minHeight: 50 }}
                />
              </View>
              {errors.address && (
                <Text className="text-red-500 text-xs mt-1">{errors.address}</Text>
              )}
            </View>

            {/* City & State */}
            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-gray-700 font-medium mb-2">City *</Text>
                <View
                  className={`border rounded-xl px-4 ${
                    errors.city ? "border-red-500" : "border-gray-200"
                  }`}
                  style={{ height: 50, justifyContent: "center" }}
                >
                  <TextInput
                    value={formData.city}
                    onChangeText={(text) => {
                      setFormData({ ...formData, city: text });
                      setErrors({ ...errors, city: "" });
                    }}
                    placeholder="City"
                    placeholderTextColor="#9CA3AF"
                    className="text-gray-800"
                  />
                </View>
                {errors.city && (
                  <Text className="text-red-500 text-xs mt-1">{errors.city}</Text>
                )}
              </View>

              <View className="flex-1 ml-2">
                <Text className="text-gray-700 font-medium mb-2">State *</Text>
                <View
                  className={`border rounded-xl px-4 ${
                    errors.state ? "border-red-500" : "border-gray-200"
                  }`}
                  style={{ height: 50, justifyContent: "center" }}
                >
                  <TextInput
                    value={formData.state}
                    onChangeText={(text) => {
                      setFormData({ ...formData, state: text });
                      setErrors({ ...errors, state: "" });
                    }}
                    placeholder="State"
                    placeholderTextColor="#9CA3AF"
                    className="text-gray-800"
                  />
                </View>
                {errors.state && (
                  <Text className="text-red-500 text-xs mt-1">{errors.state}</Text>
                )}
              </View>
            </View>

            {/* Pincode */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Pincode *</Text>
              <View
                className={`flex-row items-center border rounded-xl px-4 ${
                  errors.pincode ? "border-red-500" : "border-gray-200"
                }`}
                style={{ height: 50 }}
              >
                <TextInput
                  value={formData.pincode}
                  onChangeText={(text) => {
                    setFormData({ ...formData, pincode: text.replace(/[^0-9]/g, "") });
                    setErrors({ ...errors, pincode: "" });
                  }}
                  placeholder="6-digit pincode"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={6}
                  className="flex-1 text-gray-800"
                />
              </View>
              {errors.pincode && (
                <Text className="text-red-500 text-xs mt-1">{errors.pincode}</Text>
              )}
            </View>
          </View>

          {/* Contact Info */}
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-gray-800 font-semibold mb-3">Contact Information</Text>

            {/* Phone */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Phone Number *</Text>
              <View
                className={`flex-row items-center border rounded-xl px-4 ${
                  errors.phone ? "border-red-500" : "border-gray-200"
                }`}
                style={{ height: 50 }}
              >
                <Phone size={20} color="#9CA3AF" />
                <TextInput
                  value={formData.phone}
                  onChangeText={(text) => {
                    setFormData({ ...formData, phone: text.replace(/[^0-9]/g, "") });
                    setErrors({ ...errors, phone: "" });
                  }}
                  placeholder="10-digit phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={10}
                  className="flex-1 ml-3 text-gray-800"
                />
              </View>
              {errors.phone && (
                <Text className="text-red-500 text-xs mt-1">{errors.phone}</Text>
              )}
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Email (Optional)</Text>
              <View
                className={`flex-row items-center border rounded-xl px-4 ${
                  errors.email ? "border-red-500" : "border-gray-200"
                }`}
                style={{ height: 50 }}
              >
                <Mail size={20} color="#9CA3AF" />
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData({ ...formData, email: text });
                    setErrors({ ...errors, email: "" });
                  }}
                  placeholder="branch@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 ml-3 text-gray-800"
                />
              </View>
              {errors.email && (
                <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>
              )}
            </View>
          </View>

          {/* Tax Info */}
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-gray-800 font-semibold mb-3">Tax Information</Text>

            {/* GSTIN */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">GSTIN (Optional)</Text>
              <View
                className={`flex-row items-center border rounded-xl px-4 ${
                  errors.gstin ? "border-red-500" : "border-gray-200"
                }`}
                style={{ height: 50 }}
              >
                <FileText size={20} color="#9CA3AF" />
                <TextInput
                  value={formData.gstin}
                  onChangeText={(text) => {
                    setFormData({ ...formData, gstin: text.toUpperCase() });
                    setErrors({ ...errors, gstin: "" });
                  }}
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  maxLength={15}
                  className="flex-1 ml-3 text-gray-800"
                />
              </View>
              {errors.gstin && (
                <Text className="text-red-500 text-xs mt-1">{errors.gstin}</Text>
              )}
              <Text className="text-gray-400 text-xs mt-1">
                15-character GST Identification Number
              </Text>
            </View>
          </View>

      </KeyboardAwareScrollView>

      {/* Submit Button */}
      <View
        className="bg-white px-4 pt-4 border-t border-gray-100"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          onPress={handleSubmit}
          disabled={isLoading}
          className="bg-primary rounded-xl py-4 items-center"
          style={{
            opacity: isLoading ? 0.7 : 1,
            shadowColor: "#2E7D32",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Create Branch</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
