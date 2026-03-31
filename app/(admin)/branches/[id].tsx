import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText,
  Hash,
  Save,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useBranch } from "../../../src/context/BranchContext";
import { usePermissions } from "../../../src/context/PermissionContext";
import { Branch } from "../../../src/types";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";

export default function EditBranchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { branches, getBranchById, updateBranch, deleteBranch } = useBranch();
  const { isAdmin, hasPermission } = usePermissions();

  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load branch data
  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }

    const branchData = getBranchById(id);
    if (branchData) {
      setBranch(branchData);
      setFormData({
        name: branchData.name || "",
        code: branchData.code || "",
        address: branchData.address || "",
        city: branchData.city || "",
        state: branchData.state || "",
        pincode: branchData.pincode || "",
        phone: branchData.phone || "",
        email: branchData.email || "",
        gstin: branchData.gstin || "",
        isActive: branchData.isActive ?? true,
      });
    }
    setIsLoading(false);
  }, [id, branches]);

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

  const handleSave = async () => {
    if (!branch || !validateForm()) return;

    setIsSaving(true);
    try {
      await updateBranch(branch.id, {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        gstin: formData.gstin.trim() || undefined,
        isActive: formData.isActive,
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Branch updated successfully",
      });

      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to update branch",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = () => {
    setFormData({ ...formData, isActive: !formData.isActive });
  };

  const handleDelete = () => {
    if (!branch) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!branch) return;
    try {
      await deleteBranch(branch.id);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Branch deleted successfully",
      });
      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to delete branch",
      });
    }
    setShowDeleteModal(false);
  };

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  if (!branch) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Building2 size={48} color="#D1D5DB" />
        <Text className="text-gray-400 text-base mt-4">Branch not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-primary px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-3"
            >
              <ChevronLeft size={20} color="#374151" />
            </Pressable>
            <View>
              <Text className="text-xl font-bold text-gray-800">Edit Branch</Text>
              <Text className="text-gray-500 text-sm">{branch.code}</Text>
            </View>
          </View>
          {hasPermission("branches.edit") && (
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              className="bg-primary px-4 py-2 rounded-lg"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View className="flex-row items-center">
                  <Save size={18} color="#fff" />
                  <Text className="text-white font-semibold ml-1">Save</Text>
                </View>
              )}
            </Pressable>
          )}
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          {/* Status Toggle */}
          <View className="bg-white rounded-xl p-4 mb-4">
            <Pressable
              onPress={handleToggleActive}
              className="flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                {formData.isActive ? (
                  <CheckCircle size={24} color="#66BB6A" />
                ) : (
                  <XCircle size={24} color="#EF4444" />
                )}
                <View className="ml-3">
                  <Text className="text-gray-800 font-semibold">Branch Status</Text>
                  <Text className="text-gray-500 text-sm">
                    {formData.isActive ? "Active - Operations enabled" : "Inactive - Operations disabled"}
                  </Text>
                </View>
              </View>
              <View
                className={`px-3 py-1.5 rounded-full ${
                  formData.isActive ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    formData.isActive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formData.isActive ? "Active" : "Inactive"}
                </Text>
              </View>
            </Pressable>
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
                  placeholder="Branch name"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 ml-3 text-gray-800"
                />
              </View>
              {errors.name && (
                <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>
              )}
            </View>

            {/* Branch Code (Read Only) */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Branch Code</Text>
              <View
                className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-gray-50"
                style={{ height: 50 }}
              >
                <Hash size={20} color="#9CA3AF" />
                <Text className="flex-1 ml-3 text-gray-500">{formData.code}</Text>
                <Text className="text-gray-400 text-xs">Cannot be changed</Text>
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
            </View>
          </View>

        {/* Delete Button */}
        {hasPermission("branches.delete") && (
          <View className="bg-white rounded-xl p-4 mb-6">
            <Text className="text-gray-800 font-semibold mb-3">Danger Zone</Text>
            <Pressable
              onPress={handleDelete}
              className="flex-row items-center justify-center bg-red-50 rounded-xl py-3"
            >
              <Trash2 size={20} color="#DC2626" />
              <Text className="text-red-600 font-semibold ml-2">Delete Branch</Text>
            </Pressable>
            <Text className="text-gray-400 text-xs text-center mt-2">
              This will deactivate the branch. You can reactivate it later.
            </Text>
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Delete Branch Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Branch"
        message="Are you sure you want to delete this branch? This will deactivate it and it won't be available for operations."
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </SafeAreaView>
  );
}
