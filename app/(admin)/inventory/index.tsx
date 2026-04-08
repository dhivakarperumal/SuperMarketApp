import { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import {
  ChevronLeft,
  Search,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Plus,
  X,
  ChevronRight,
  Boxes,
  IndianRupee,
} from "lucide-react-native";
import { router } from "expo-router";
import { useInventory, InventoryItem } from "../../../src/hooks/useInventory";
import { formatCurrency } from "../../../src/utils/formatters";

const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  normal: { bg: "#D1FAE5", text: "#059669", icon: TrendingUp, label: "In Stock" },
  low: { bg: "#FEF3C7", text: "#D97706", icon: TrendingDown, label: "Low Stock" },
  critical: { bg: "#FEE2E2", text: "#DC2626", icon: AlertTriangle, label: "Critical" },
};

export default function InventoryScreen() {
  const { inventory, loading, getInventoryStats } = useInventory();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "critical">("all");

  const stats = getInventoryStats();

  const filteredInventory = useMemo(() => {
    let filtered = inventory;

    // Filter by status
    if (filter === "low") {
      filtered = filtered.filter(
        (item) => item.stockStatus === "low" || item.stockStatus === "critical"
      );
    } else if (filter === "critical") {
      filtered = filtered.filter((item) => item.stockStatus === "critical");
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.productId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [inventory, searchQuery, filter]);

  const formatStock = (item: InventoryItem) => {
    const stock = item.stock || 0;
    const unit = item.stockUnit || "pcs";

    if (unit === "g" && stock >= 1000) return `${(stock / 1000).toFixed(1)} kg`;
    if (unit === "ml" && stock >= 1000) return `${(stock / 1000).toFixed(1)} L`;
    return `${stock} ${unit}`;
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const StatusIcon = statusConfig[item.stockStatus]?.icon || TrendingUp;
    const statusInfo = statusConfig[item.stockStatus] || statusConfig.normal;
    const productImage = item.images?.[0];
    const price = item.price || Object.values(item.prices || {})[0] || 0;

    return (
      <Pressable
        onPress={() => router.push(`/(admin)/inventory/${item.id}`)}
        className="bg-white p-4 rounded-xl mb-3"
      >
        <View className="flex-row">
          {/* Product Image */}
          <View className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
            {productImage ? (
              <Image
                source={{ uri: productImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Package size={24} color="#9CA3AF" />
              </View>
            )}
          </View>

          {/* Product Details */}
          <View className="flex-1 ml-3">
            <Text className="font-semibold text-gray-800" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-gray-500 text-sm">{item.category}</Text>
            {item.productId && (
              <Text className="text-gray-400 text-xs mt-0.5">{item.productId}</Text>
            )}
            <View className="flex-row items-center mt-1">
              <Text className="font-bold text-primary text-sm">
                {formatCurrency(price as number)}
              </Text>
            </View>
          </View>

          {/* Stock Info */}
          <View className="items-end justify-center">
            <Text className="text-gray-800 font-bold text-lg">{formatStock(item)}</Text>
            <View
              className="flex-row items-center px-2 py-1 rounded-full mt-1"
              style={{ backgroundColor: statusInfo.bg }}
            >
              <StatusIcon size={12} color={statusInfo.text} />
              <Text
                className="text-xs font-medium ml-1"
                style={{ color: statusInfo.text }}
              >
                {statusInfo.label}
              </Text>
            </View>
          </View>

          {/* Arrow */}
          <View className="justify-center ml-2">
            <ChevronRight size={20} color="#9CA3AF" />
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9] items-center justify-center" edges={["top","bottom"]}>
        <ActivityIndicator size="large" color="#1D5A34" />
        <Text className="text-gray-500 mt-4">Loading inventory...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]" edges={["top","bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />
      {/* Header */}
      <View
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
        <View className="flex-row items-center mb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">Inventory</Text>
            <Text className="text-white/80 text-sm">{inventory.length} products</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-white rounded-xl p-3 mr-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-xs">Total Items</Text>
                <Text className="text-gray-800 font-bold text-xl">{stats.total}</Text>
              </View>
              <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                <Boxes size={20} color="#3B82F6" />
              </View>
            </View>
          </View>
          <View className="flex-1 bg-white rounded-xl p-3 ml-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-xs">Total Value</Text>
                <Text className="text-primary font-bold text-lg">
                  {formatCurrency(stats.totalValue)}
                </Text>
              </View>
              <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center">
                <IndianRupee size={20} color="#66BB6A" />
              </View>
            </View>
          </View>
        </View>

        {/* Stock Status Summary */}
        <View className="flex-row mb-4">
          <Pressable
            onPress={() => setFilter("all")}
            className={`flex-1 rounded-xl p-2.5 mr-2 ${
              filter === "all" ? "bg-primary" : "bg-green-50"
            }`}
          >
            <View className="flex-row items-center justify-center">
              <TrendingUp size={14} color={filter === "all" ? "#fff" : "#059669"} />
              <Text
                className={`font-semibold ml-1 ${
                  filter === "all" ? "text-white" : "text-green-700"
                }`}
              >
                {stats.normal}
              </Text>
            </View>
            <Text
              className={`text-center text-xs mt-0.5 ${
                filter === "all" ? "text-white/80" : "text-green-600"
              }`}
            >
              In Stock
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter("low")}
            className={`flex-1 rounded-xl p-2.5 mr-2 ${
              filter === "low" ? "bg-yellow-500" : "bg-yellow-50"
            }`}
          >
            <View className="flex-row items-center justify-center">
              <TrendingDown size={14} color={filter === "low" ? "#fff" : "#D97706"} />
              <Text
                className={`font-semibold ml-1 ${
                  filter === "low" ? "text-white" : "text-yellow-700"
                }`}
              >
                {stats.low}
              </Text>
            </View>
            <Text
              className={`text-center text-xs mt-0.5 ${
                filter === "low" ? "text-white/80" : "text-yellow-600"
              }`}
            >
              Low Stock
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter("critical")}
            className={`flex-1 rounded-xl p-2.5 ${
              filter === "critical" ? "bg-red-500" : "bg-red-50"
            }`}
          >
            <View className="flex-row items-center justify-center">
              <AlertTriangle size={14} color={filter === "critical" ? "#fff" : "#DC2626"} />
              <Text
                className={`font-semibold ml-1 ${
                  filter === "critical" ? "text-white" : "text-red-700"
                }`}
              >
                {stats.critical}
              </Text>
            </View>
            <Text
              className={`text-center text-xs mt-0.5 ${
                filter === "critical" ? "text-white/80" : "text-red-600"
              }`}
            >
              Critical
            </Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or product ID..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-gray-800"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <X size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Inventory List */}
      <FlashList
        data={filteredInventory}
        estimatedItemSize={100}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={renderItem}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Package size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg mt-4">
              {searchQuery ? "No items found" : "No inventory items"}
            </Text>
            {!searchQuery && (
              <Pressable
                onPress={() => router.push("/(admin)/products/add")}
                className="mt-4 bg-primary px-6 py-3 rounded-xl flex-row items-center"
              >
                <Plus size={18} color="#fff" />
                <Text className="text-white font-semibold ml-2">Add Product</Text>
              </Pressable>
            )}
          </View>
        }
      />

      {/* FAB - Add Stock */}
      <Pressable
        onPress={() => router.push("/(admin)/products/add")}
        className="absolute right-4 bottom-5"
      >
        <View
          className="w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
          style={{
            shadowColor: "#1D5A34",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Plus size={24} color="#fff" />
        </View>
      </Pressable>
    </SafeAreaView>
  );
}
