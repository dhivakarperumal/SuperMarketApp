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
  User,
  Mail,
  Lock,
  Phone,
  Shield,
  Building2,
  Eye,
  EyeOff,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../../src/services/firebase/config";
import { useAuth } from "../../../src/context/AuthContext";
import { usePermissions } from "../../../src/context/PermissionContext";
import { useBranch } from "../../../src/context/BranchContext";
import { UserRole, Branch } from "../../../src/types";

const ROLE_OPTIONS: { label: string; value: UserRole; description: string }[] = [
  {
    label: "Manager",
    value: "manager",
    description: "Can manage products, orders, reports, and inventory",
  },
  {
    label: "Cashier",
    value: "cashier",
    description: "Can only access billing/POS and view products",
  },
];

export default function AddUserScreen() {
  const insets = useSafeAreaInsets();
  const { user: currentUser, userProfile: currentUserProfile } = useAuth();
  const { isAdmin } = usePermissions();
  const { branches } = useBranch();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "cashier" as UserRole,
    branchId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAdmin) {
      router.back();
    }
  }, [isAdmin]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number (10 digits required)";
    }

    if (!formData.branchId && branches.length > 0) {
      newErrors.branchId = "Please select a branch";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Store current user credentials for re-authentication
      const currentEmail = currentUser?.email;

      // Check if email already exists in users collection
      const existingUserQuery = query(
        collection(db, "users"),
        where("email", "==", formData.email.toLowerCase())
      );
      const existingUsers = await getDocs(existingUserQuery);

      if (!existingUsers.empty) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "A user with this email already exists",
        });
        setIsLoading(false);
        return;
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const newUser = userCredential.user;

      // Update profile with display name
      await updateProfile(newUser, { displayName: formData.name });

      // Create user profile in Firestore
      const userProfile = {
        uid: newUser.uid,
        email: formData.email.toLowerCase(),
        displayName: formData.name,
        phone: formData.phone || "",
        role: formData.role,
        branchId: formData.branchId || null,
        businessId: currentUserProfile?.businessId || null, // Inherit from admin
        isActive: true,
        createdAt: new Date(),
        createdBy: currentUser?.uid,
      };

      await setDoc(doc(db, "users", newUser.uid), userProfile);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: `${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} account created successfully`,
      });

      // Note: createUserWithEmailAndPassword automatically signs in the new user
      // The admin will need to re-login. Show a message about this.
      Toast.show({
        type: "info",
        text1: "Please Note",
        text2: "You may need to login again as the admin",
        visibilityTime: 4000,
      });

      router.back();
    } catch (error: any) {
      console.error("Create user error:", error);
      let errorMessage = "Failed to create user";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      }

      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
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
          <Text className="text-xl font-bold text-gray-800">Add Staff User</Text>
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
              Create staff accounts for your team. Managers can handle inventory and orders,
              while Cashiers can only access the billing screen.
            </Text>
          </View>

          {/* Form */}
          <View className="bg-white rounded-xl p-4 mb-4">
            {/* Name */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Full Name *</Text>
              <View
                className={`flex-row items-center border rounded-xl px-4 ${
                  errors.name ? "border-red-500" : "border-gray-200"
                }`}
                style={{ height: 50 }}
              >
                <User size={20} color="#9CA3AF" />
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => {
                    setFormData({ ...formData, name: text });
                    setErrors({ ...errors, name: "" });
                  }}
                  placeholder="Enter full name"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 ml-3 text-gray-800"
                />
              </View>
              {errors.name && (
                <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>
              )}
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Email *</Text>
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
                  placeholder="Enter email address"
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

            {/* Password */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Password *</Text>
              <View
                className={`flex-row items-center border rounded-xl px-4 ${
                  errors.password ? "border-red-500" : "border-gray-200"
                }`}
                style={{ height: 50 }}
              >
                <Lock size={20} color="#9CA3AF" />
                <TextInput
                  value={formData.password}
                  onChangeText={(text) => {
                    setFormData({ ...formData, password: text });
                    setErrors({ ...errors, password: "" });
                  }}
                  placeholder="Enter password (min 6 characters)"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  className="flex-1 ml-3 text-gray-800"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </Pressable>
              </View>
              {errors.password && (
                <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>
              )}
            </View>

            {/* Phone */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Phone Number</Text>
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
                  placeholder="Enter 10-digit phone number"
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
          </View>

          {/* Role Selection */}
          <View className="bg-white rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Shield size={20} color="#1D5A34" />
              <Text className="text-gray-800 font-semibold ml-2">Select Role *</Text>
            </View>

            {ROLE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setFormData({ ...formData, role: option.value })}
                className={`border rounded-xl p-4 mb-2 ${
                  formData.role === option.value
                    ? "border-primary bg-primary/5"
                    : "border-gray-200"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className={`font-semibold ${
                        formData.role === option.value
                          ? "text-primary"
                          : "text-gray-800"
                      }`}
                    >
                      {option.label}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      {option.description}
                    </Text>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      formData.role === option.value
                        ? "border-primary bg-primary"
                        : "border-gray-300"
                    }`}
                  >
                    {formData.role === option.value && (
                      <View className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Branch Selection */}
          {branches.length > 0 && (
            <View className="bg-white rounded-xl p-4 mb-4">
              <View className="flex-row items-center mb-3">
                <Building2 size={20} color="#1D5A34" />
                <Text className="text-gray-800 font-semibold ml-2">
                  Assign to Branch *
                </Text>
              </View>

              {branches.map((branch) => (
                <Pressable
                  key={branch.id}
                  onPress={() => {
                    setFormData({ ...formData, branchId: branch.id });
                    setErrors({ ...errors, branchId: "" });
                  }}
                  className={`border rounded-xl p-4 mb-2 ${
                    formData.branchId === branch.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text
                        className={`font-semibold ${
                          formData.branchId === branch.id
                            ? "text-primary"
                            : "text-gray-800"
                        }`}
                      >
                        {branch.name}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {branch.city}
                      </Text>
                    </View>
                    <View
                      className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                        formData.branchId === branch.id
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                      }`}
                    >
                      {formData.branchId === branch.id && (
                        <View className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}

              {errors.branchId && (
                <Text className="text-red-500 text-xs mt-1">{errors.branchId}</Text>
              )}
            </View>
          )}

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
            shadowColor: "#1D5A34",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Create User</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
