import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ChevronLeft,
  Search,
  Plus,
  Building2,
  MapPin,
  Phone,
  ChevronRight,
  CheckCircle,
  XCircle,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useBranch } from "../../../src/context/BranchContext";
import { usePermissions } from "../../../src/context/PermissionContext";
import { Branch } from "../../../src/types";

export default function BranchesScreen() {
  const { branches, currentBranch, selectBranch, isLoading } = useBranch();
  const { isAdmin, hasPermission } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      router.back();
    }
  }, [isAdmin]);

  // Filter branches
  useEffect(() => {
    let filtered = branches;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (branch) =>
          branch.name.toLowerCase().includes(query) ||
          branch.code.toLowerCase().includes(query) ||
          branch.city?.toLowerCase().includes(query) ||
          branch.address?.toLowerCase().includes(query)
      );
    }

    setFilteredBranches(filtered);
  }, [branches, searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleSelectBranch = async (branch: Branch) => {
    try {
      await selectBranch(branch.id);
      Toast.show({
        type: "success",
        text1: "Branch Selected",
        text2: `Switched to ${branch.name}`,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to select branch",
      });
    }
  };

  const renderBranchItem = ({ item }: { item: Branch }) => {
    const isSelected = currentBranch?.id === item.id;

    return (
      <Pressable
        onPress={() => router.push(`/(admin)/branches/${item.id}`)}
        className={`bg-white mx-4 mb-3 rounded-xl p-4 ${
          isSelected ? "border-2 border-primary" : ""
        }`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View className="flex-row items-start">
          {/* Icon */}
          <View
            className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
              item.isActive ? "bg-primary/10" : "bg-gray-100"
            }`}
          >
            <Building2 size={24} color={item.isActive ? "#1D5A34" : "#9CA3AF"} />
          </View>

          {/* Info */}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-gray-800 font-semibold text-base">
                {item.name}
              </Text>
              {isSelected && (
                <View className="bg-primary/20 px-2 py-0.5 rounded-full ml-2">
                  <Text className="text-primary text-xs font-medium">Current</Text>
                </View>
              )}
            </View>
            <Text className="text-gray-500 text-sm">{item.code}</Text>

            <View className="flex-row items-center mt-2">
              <MapPin size={14} color="#9CA3AF" />
              <Text className="text-gray-500 text-sm ml-1 flex-1" numberOfLines={1}>
                {item.address}, {item.city}
              </Text>
            </View>

            {item.phone && (
              <View className="flex-row items-center mt-1">
                <Phone size={14} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm ml-1">{item.phone}</Text>
              </View>
            )}

            <View className="flex-row items-center mt-2">
              {item.isActive ? (
                <View className="flex-row items-center bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle size={12} color="#66BB6A" />
                  <Text className="text-green-600 text-xs font-medium ml-1">
                    Active
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center bg-red-50 px-2 py-1 rounded-full">
                  <XCircle size={12} color="#EF4444" />
                  <Text className="text-red-600 text-xs font-medium ml-1">
                    Inactive
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row items-center">
            {!isSelected && item.isActive && (
              <Pressable
                onPress={() => handleSelectBranch(item)}
                className="bg-primary/10 px-3 py-1.5 rounded-lg mr-2"
              >
                <Text className="text-primary text-xs font-medium">Select</Text>
              </Pressable>
            )}
            <ChevronRight size={20} color="#9CA3AF" />
          </View>
        </View>
      </Pressable>
    );
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
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-800">Branch Management</Text>
            <Text className="text-gray-500 text-sm">
              {branches.length} {branches.length === 1 ? "branch" : "branches"}
            </Text>
          </View>
          {hasPermission("branches.create") && (
            <Pressable
              onPress={() => router.push("/(admin)/branches/add")}
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
            placeholder="Search branches..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-gray-800"
          />
        </View>
      </View>

      {/* Current Branch Info */}
      {currentBranch && (
        <View className="mx-4 mt-3 bg-primary/10 rounded-xl p-3">
          <Text className="text-primary text-xs font-medium">Current Branch</Text>
          <Text className="text-primary font-bold text-base mt-1">
            {currentBranch.name}
          </Text>
        </View>
      )}

      {/* Branches List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D5A34" />
        </View>
      ) : (
        <FlatList
          data={filteredBranches}
          keyExtractor={(item) => item.id}
          renderItem={renderBranchItem}
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
              <Building2 size={48} color="#D1D5DB" />
              <Text className="text-gray-400 text-base mt-4">
                {searchQuery ? "No branches found" : "No branches yet"}
              </Text>
              {!searchQuery && hasPermission("branches.create") && (
                <Pressable
                  onPress={() => router.push("/(admin)/branches/add")}
                  className="bg-primary px-6 py-3 rounded-xl mt-4"
                >
                  <Text className="text-white font-semibold">Add First Branch</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
