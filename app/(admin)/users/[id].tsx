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
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Save,
  Trash2,
  UserX,
  UserCheck,
  Calendar,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../src/services/firebase/config";
import { useAuth } from "../../../src/context/AuthContext";
import { usePermissions } from "../../../src/context/PermissionContext";
import { useBranch } from "../../../src/context/BranchContext";
import { UserProfile, UserRole } from "../../../src/types";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";

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
  {
    label: "Customer",
    value: "customer",
    description: "Can only browse and shop (no admin access)",
  },
];

export default function UserDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userProfile: currentUserProfile } = useAuth();
  const { isAdmin, hasPermission } = usePermissions();
  const { branches } = useBranch();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    displayName: "",
    phone: "",
    role: "customer" as UserRole,
    branchId: "",
  });
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isCurrentUser = id === currentUserProfile?.uid;
  const isAdminUser = user?.role === "admin";
  const canEdit = isAdmin && hasPermission("users.edit") && !isAdminUser;

  // Fetch user data
  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }

    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", id));
        if (userDoc.exists()) {
          const userData = { uid: userDoc.id, ...userDoc.data() } as UserProfile;
          setUser(userData);
          setFormData({
            displayName: userData.displayName || "",
            phone: userData.phone || "",
            role: (userData.role as UserRole) || "customer",
            branchId: userData.branchId || "",
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "User not found",
          });
          router.back();
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load user data",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleSave = async () => {
    if (!user || !canEdit) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: formData.displayName,
        phone: formData.phone,
        role: formData.role,
        branchId: formData.branchId || null,
        updatedAt: new Date(),
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "User updated successfully",
      });

      // Update local state
      setUser({
        ...user,
        displayName: formData.displayName,
        phone: formData.phone,
        role: formData.role,
        branchId: formData.branchId,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to update user",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = () => {
    if (!user || isAdminUser) return;
    setShowToggleModal(true);
  };

  const confirmToggleActive = async () => {
    if (!user) return;
    const action = user.isActive ? "deactivate" : "activate";
    try {
      await updateDoc(doc(db, "users", user.uid), {
        isActive: !user.isActive,
        updatedAt: new Date(),
      });
      setUser({ ...user, isActive: !user.isActive });
      Toast.show({
        type: "success",
        text1: "Success",
        text2: `User ${action}d successfully`,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || `Failed to ${action} user`,
      });
    }
    setShowToggleModal(false);
  };

  const handleDelete = () => {
    if (!user || isAdminUser || isCurrentUser) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid));
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "User deleted successfully",
      });
      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to delete user",
      });
    }
    setShowDeleteModal(false);
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
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
              <Text className="text-xl font-bold text-gray-800">
                User Details
              </Text>
              {isCurrentUser && (
                <Text className="text-primary text-sm">This is you</Text>
              )}
            </View>
          </View>
          {canEdit && (
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
          {/* User Info Card */}
          <View className="bg-white rounded-xl p-4 mb-4 items-center">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-3"
              style={{
                backgroundColor:
                  user.role === "admin"
                    ? "#FEE2E2"
                    : user.role === "manager"
                    ? "#EDE9FE"
                    : user.role === "cashier"
                    ? "#DBEAFE"
                    : "#F3F4F6",
              }}
            >
              <User
                size={40}
                color={
                  user.role === "admin"
                    ? "#DC2626"
                    : user.role === "manager"
                    ? "#7C3AED"
                    : user.role === "cashier"
                    ? "#2563EB"
                    : "#6B7280"
                }
              />
            </View>
            <Text className="text-xl font-bold text-gray-800">
              {user.displayName || "No Name"}
            </Text>
            <Text className="text-gray-500">{user.email}</Text>
            <View className="flex-row items-center mt-2">
              <View
                className="px-3 py-1 rounded-full"
                style={{
                  backgroundColor:
                    user.role === "admin"
                      ? "#FEE2E2"
                      : user.role === "manager"
                      ? "#EDE9FE"
                      : user.role === "cashier"
                      ? "#DBEAFE"
                      : "#F3F4F6",
                }}
              >
                <Text
                  className="text-sm font-medium capitalize"
                  style={{
                    color:
                      user.role === "admin"
                        ? "#DC2626"
                        : user.role === "manager"
                        ? "#7C3AED"
                        : user.role === "cashier"
                        ? "#2563EB"
                        : "#6B7280",
                  }}
                >
                  {user.role || "customer"}
                </Text>
              </View>
              {!user.isActive && (
                <View className="bg-red-100 px-3 py-1 rounded-full ml-2">
                  <Text className="text-red-600 text-sm font-medium">
                    Inactive
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center mt-3">
              <Calendar size={14} color="#9CA3AF" />
              <Text className="text-gray-400 text-xs ml-1">
                Joined {formatDate(user.createdAt)}
              </Text>
            </View>
          </View>

          {/* Admin Notice */}
          {isAdminUser && (
            <View className="bg-yellow-50 rounded-xl p-4 mb-4">
              <Text className="text-yellow-800 font-medium text-sm">
                Admin accounts cannot be modified. Contact system administrator
                for any changes.
              </Text>
            </View>
          )}

          {/* Edit Form */}
          {canEdit && (
            <>
              {/* Basic Info */}
              <View className="bg-white rounded-xl p-4 mb-4">
                <Text className="text-gray-800 font-semibold mb-3">
                  Basic Information
                </Text>

                {/* Name */}
                <View className="mb-4">
                  <Text className="text-gray-700 font-medium mb-2">
                    Display Name
                  </Text>
                  <View
                    className="flex-row items-center border border-gray-200 rounded-xl px-4"
                    style={{ height: 50 }}
                  >
                    <User size={20} color="#9CA3AF" />
                    <TextInput
                      value={formData.displayName}
                      onChangeText={(text) =>
                        setFormData({ ...formData, displayName: text })
                      }
                      placeholder="Enter display name"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 ml-3 text-gray-800"
                    />
                  </View>
                </View>

                {/* Email (Read Only) */}
                <View className="mb-4">
                  <Text className="text-gray-700 font-medium mb-2">
                    Email (cannot be changed)
                  </Text>
                  <View
                    className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-gray-50"
                    style={{ height: 50 }}
                  >
                    <Mail size={20} color="#9CA3AF" />
                    <Text className="flex-1 ml-3 text-gray-500">
                      {user.email}
                    </Text>
                  </View>
                </View>

                {/* Phone */}
                <View>
                  <Text className="text-gray-700 font-medium mb-2">
                    Phone Number
                  </Text>
                  <View
                    className="flex-row items-center border border-gray-200 rounded-xl px-4"
                    style={{ height: 50 }}
                  >
                    <Phone size={20} color="#9CA3AF" />
                    <TextInput
                      value={formData.phone}
                      onChangeText={(text) =>
                        setFormData({
                          ...formData,
                          phone: text.replace(/[^0-9]/g, ""),
                        })
                      }
                      placeholder="Enter phone number"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      maxLength={10}
                      className="flex-1 ml-3 text-gray-800"
                    />
                  </View>
                </View>
              </View>

              {/* Role Selection */}
              <View className="bg-white rounded-xl p-4 mb-4">
                <View className="flex-row items-center mb-3">
                  <Shield size={20} color="#2E7D32" />
                  <Text className="text-gray-800 font-semibold ml-2">
                    User Role
                  </Text>
                </View>

                {ROLE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() =>
                      setFormData({ ...formData, role: option.value })
                    }
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

              {/* Branch Selection (for staff roles) */}
              {(formData.role === "manager" || formData.role === "cashier") &&
                branches.length > 0 && (
                  <View className="bg-white rounded-xl p-4 mb-4">
                    <View className="flex-row items-center mb-3">
                      <Building2 size={20} color="#2E7D32" />
                      <Text className="text-gray-800 font-semibold ml-2">
                        Assigned Branch
                      </Text>
                    </View>

                    {branches.map((branch) => (
                      <Pressable
                        key={branch.id}
                        onPress={() =>
                          setFormData({ ...formData, branchId: branch.id })
                        }
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
                  </View>
                )}
            </>
          )}

          {/* Actions */}
          {canEdit && !isCurrentUser && (
            <View className="bg-white rounded-xl p-4 mb-6">
              <Text className="text-gray-800 font-semibold mb-3">Actions</Text>

              {/* Toggle Active */}
              <Pressable
                onPress={handleToggleActive}
                className={`flex-row items-center justify-center rounded-xl py-3 mb-3 ${
                  user.isActive ? "bg-orange-50" : "bg-green-50"
                }`}
              >
                {user.isActive ? (
                  <>
                    <UserX size={20} color="#EA580C" />
                    <Text className="text-orange-600 font-semibold ml-2">
                      Deactivate User
                    </Text>
                  </>
                ) : (
                  <>
                    <UserCheck size={20} color="#2E7D32" />
                    <Text className="text-green-600 font-semibold ml-2">
                      Activate User
                    </Text>
                  </>
                )}
              </Pressable>

            {/* Delete */}
            {hasPermission("users.delete") && (
              <Pressable
                onPress={handleDelete}
                className="flex-row items-center justify-center bg-red-50 rounded-xl py-3"
              >
                <Trash2 size={20} color="#DC2626" />
                <Text className="text-red-600 font-semibold ml-2">
                  Delete User
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Toggle Active Confirmation Modal */}
      <ConfirmationModal
        visible={showToggleModal}
        title={user?.isActive ? "Deactivate User" : "Activate User"}
        message={user?.isActive
          ? "Are you sure you want to deactivate this user? They will no longer be able to access their account."
          : "Are you sure you want to activate this user? They will regain access to their account."
        }
        confirmText={user?.isActive ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        type={user?.isActive ? "deactivate" : "activate"}
        onConfirm={confirmToggleActive}
        onCancel={() => setShowToggleModal(false)}
      />

      {/* Delete User Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone and all user data will be permanently removed."
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </SafeAreaView>
  );
}
