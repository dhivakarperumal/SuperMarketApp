import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ChevronLeft,
  Search,
  Plus,
  User,
  Shield,
  ShieldCheck,
  Receipt,
  UserX,
  UserCheck,
  ChevronRight,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { collection, query, onSnapshot, doc, updateDoc, where } from "firebase/firestore";
import { db } from "../../../src/services/firebase/config";
import { useAuth } from "../../../src/context/AuthContext";
import { usePermissions } from "../../../src/context/PermissionContext";
import { UserProfile, UserRole } from "../../../src/types";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case "admin":
      return ShieldCheck;
    case "manager":
      return Shield;
    case "cashier":
      return Receipt;
    default:
      return User;
  }
};

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case "admin":
      return "#DC2626";
    case "manager":
      return "#7C3AED";
    case "cashier":
      return "#2563EB";
    default:
      return "#6B7280";
  }
};

const getRoleBgColor = (role: UserRole) => {
  switch (role) {
    case "admin":
      return "#FEE2E2";
    case "manager":
      return "#EDE9FE";
    case "cashier":
      return "#DBEAFE";
    default:
      return "#F3F4F6";
  }
};

export default function UsersScreen() {
  const { userProfile } = useAuth();
  const { isAdmin, hasPermission } = usePermissions();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | UserRole>("all");
  const [toggleModal, setToggleModal] = useState<{ visible: boolean; user: UserProfile | null }>({
    visible: false,
    user: null,
  });

  // Fetch users
  useEffect(() => {
    if (!isAdmin) {
      router.back();
      return;
    }

    const usersQuery = query(collection(db, "users"));

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersData: UserProfile[] = [];
        snapshot.forEach((doc) => {
          usersData.push({ uid: doc.id, ...doc.data() } as UserProfile);
        });
        // Sort: admins first, then managers, then cashiers, then customers
        const sortOrder = { admin: 0, manager: 1, cashier: 2, customer: 3 };
        usersData.sort((a, b) => {
          const orderA = sortOrder[a.role as keyof typeof sortOrder] ?? 4;
          const orderB = sortOrder[b.role as keyof typeof sortOrder] ?? 4;
          return orderA - orderB;
        });
        setUsers(usersData);
        setIsLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setIsLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  // Filter users
  useEffect(() => {
    let filtered = users;

    // Filter by role
    if (selectedFilter !== "all") {
      filtered = filtered.filter((user) => user.role === selectedFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.displayName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.phone?.includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, selectedFilter]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const handleToggleActive = async (user: UserProfile) => {
    if (user.role === "admin") {
      Toast.show({
        type: "error",
        text1: "Cannot Modify",
        text2: "Admin account cannot be deactivated",
      });
      return;
    }
    setToggleModal({ visible: true, user });
  };

  const confirmToggleActive = async () => {
    const user = toggleModal.user;
    if (!user) return;

    const action = user.isActive ? "deactivate" : "activate";
    try {
      await updateDoc(doc(db, "users", user.uid), {
        isActive: !user.isActive,
        updatedAt: new Date(),
      });
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
    setToggleModal({ visible: false, user: null });
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const RoleIcon = getRoleIcon(item.role as UserRole);
    const roleColor = getRoleColor(item.role as UserRole);
    const roleBgColor = getRoleBgColor(item.role as UserRole);
    const isCurrentUser = item.uid === userProfile?.uid;

    return (
      <Pressable
        onPress={() => router.push(`/(admin)/users/${item.uid}`)}
        className="bg-white mx-4 mb-3 rounded-xl p-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center">
          {/* Avatar */}
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: roleBgColor }}
          >
            <RoleIcon size={24} color={roleColor} />
          </View>

          {/* Info */}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-gray-800 font-semibold text-base">
                {item.displayName || "No Name"}
              </Text>
              {isCurrentUser && (
                <View className="bg-primary/20 px-2 py-0.5 rounded-full ml-2">
                  <Text className="text-primary text-xs font-medium">You</Text>
                </View>
              )}
            </View>
            <Text className="text-gray-500 text-sm">{item.email}</Text>
            <View className="flex-row items-center mt-1">
              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: roleBgColor }}
              >
                <Text
                  className="text-xs font-medium capitalize"
                  style={{ color: roleColor }}
                >
                  {item.role || "customer"}
                </Text>
              </View>
              {!item.isActive && (
                <View className="bg-red-100 px-2 py-0.5 rounded-full ml-2">
                  <Text className="text-red-600 text-xs font-medium">
                    Inactive
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row items-center">
            {!isCurrentUser && item.role !== "admin" && (
              <Pressable
                onPress={() => handleToggleActive(item)}
                className="p-2 mr-1"
              >
                {item.isActive ? (
                  <UserX size={20} color="#DC2626" />
                ) : (
                  <UserCheck size={20} color="#1D5A34" />
                )}
              </Pressable>
            )}
            <ChevronRight size={20} color="#9CA3AF" />
          </View>
        </View>
      </Pressable>
    );
  };

  const filterOptions: { label: string; value: "all" | UserRole }[] = [
    { label: "All", value: "all" },
    { label: "Admin", value: "admin" },
    { label: "Manager", value: "manager" },
    { label: "Cashier", value: "cashier" },
    { label: "Customer", value: "customer" },
  ];

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
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-800">User Management</Text>
            <Text className="text-gray-500 text-sm">
              {users.length} total users
            </Text>
          </View>
          {hasPermission("users.create") && (
            <Pressable
              onPress={() => router.push("/(admin)/users/add")}
              className="bg-primary w-10 h-10 rounded-full items-center justify-center"
            >
              <Plus size={22} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Search */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-gray-800"
          />
        </View>
      </View>

      {/* Filter Chips */}
      <View className="py-3 px-4 bg-white border-b border-gray-100">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterOptions}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedFilter(item.value)}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedFilter === item.value
                  ? "bg-primary"
                  : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedFilter === item.value
                    ? "text-white"
                    : "text-gray-600"
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Users List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D5A34" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.uid}
          renderItem={renderUserItem}
          contentContainerStyle={{ paddingVertical: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#1D5A34"]}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <User size={48} color="#D1D5DB" />
              <Text className="text-gray-400 text-base mt-4">
                No users found
              </Text>
            </View>
          }
        />
      )}

      {/* Toggle Active Confirmation Modal */}
      <ConfirmationModal
        visible={toggleModal.visible}
        title={toggleModal.user?.isActive ? "Deactivate User" : "Activate User"}
        message={toggleModal.user?.isActive
          ? `Are you sure you want to deactivate ${toggleModal.user?.displayName || toggleModal.user?.email}? They will no longer be able to access their account.`
          : `Are you sure you want to activate ${toggleModal.user?.displayName || toggleModal.user?.email}? They will regain access to their account.`
        }
        confirmText={toggleModal.user?.isActive ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        type={toggleModal.user?.isActive ? "deactivate" : "activate"}
        onConfirm={confirmToggleActive}
        onCancel={() => setToggleModal({ visible: false, user: null })}
      />
    </SafeAreaView>
  );
}
