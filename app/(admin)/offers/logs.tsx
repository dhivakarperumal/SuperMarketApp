import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import {
  ChevronLeft,
  Search,
  X,
  Calendar,
  Tag,
  Percent,
  Gift,
  Package,
  Ticket,
  User,
  ShoppingBag,
  TrendingDown,
  Filter,
} from "lucide-react-native";
import { router } from "expo-router";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../src/services/firebase/config";
import { OfferLog, OfferType, OFFER_TYPE_LABELS } from "../../../src/types/offers";

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  discount: { icon: Percent, color: "#2E7D32", bg: "#E8F5E9" },
  bogo: { icon: Gift, color: "#9333EA", bg: "#F3E8FF" },
  combo: { icon: Package, color: "#3B82F6", bg: "#DBEAFE" },
  coupon: { icon: Ticket, color: "#F59E0B", bg: "#FEF3C7" },
};

export default function OfferLogsScreen() {
  const [logs, setLogs] = useState<OfferLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<OfferType | "all">("all");

  // Fetch offer logs
  useEffect(() => {
    const logsRef = collection(db, "offerLogs");
    const q = query(logsRef, orderBy("appliedAt", "desc"), limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logsData: OfferLog[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          logsData.push({
            id: docSnap.id,
            offerId: data.offerId,
            offerName: data.offerName,
            offerType: data.offerType,
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            userId: data.userId,
            userEmail: data.userEmail,
            appliedItems: data.appliedItems || [],
            totalDiscount: data.totalDiscount || 0,
            appliedAt: data.appliedAt,
          });
        });
        setLogs(logsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching offer logs:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = logs;

    if (typeFilter !== "all") {
      filtered = filtered.filter((log) => log.offerType === typeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.offerName.toLowerCase().includes(query) ||
          log.orderNumber?.toLowerCase().includes(query) ||
          log.userEmail?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [logs, typeFilter, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalSavings = logs.reduce((sum, log) => sum + log.totalDiscount, 0);
    const uniqueUsers = new Set(logs.map((log) => log.userId)).size;
    const uniqueOrders = new Set(logs.map((log) => log.orderId)).size;

    return {
      totalLogs: logs.length,
      totalSavings,
      uniqueUsers,
      uniqueOrders,
    };
  }, [logs]);

  const formatDate = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return "N/A";
    const date =
      timestamp instanceof Date
        ? timestamp
        : (timestamp as any).toDate?.() || new Date();
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderItem = ({ item: log }: { item: OfferLog }) => {
    const config = typeConfig[log.offerType] || typeConfig.discount;
    const TypeIcon = config.icon;

    return (
      <View className="bg-white rounded-xl mb-3 overflow-hidden border border-gray-100">
        {/* Header */}
        <View className="p-4 border-b border-gray-50">
          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-lg items-center justify-center"
              style={{ backgroundColor: config.bg }}
            >
              <TypeIcon size={20} color={config.color} />
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-gray-800" numberOfLines={1}>
                {log.offerName}
              </Text>
              <View className="flex-row items-center mt-1">
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: config.bg }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: config.color }}
                  >
                    {OFFER_TYPE_LABELS[log.offerType]}
                  </Text>
                </View>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-green-600 font-bold text-lg">
                -₹{log.totalDiscount.toFixed(0)}
              </Text>
              <Text className="text-gray-400 text-xs">saved</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View className="px-4 py-3 bg-gray-50">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <ShoppingBag size={14} color="#9CA3AF" />
              <Text className="text-gray-600 text-sm ml-1">
                #{log.orderNumber || log.orderId?.slice(-6)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <User size={14} color="#9CA3AF" />
              <Text className="text-gray-600 text-sm ml-1" numberOfLines={1}>
                {log.userEmail || "Guest"}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Calendar size={14} color="#9CA3AF" />
              <Text className="text-gray-600 text-sm ml-1">
                {formatDate(log.appliedAt)}
              </Text>
            </View>
          </View>

          {/* Applied Items */}
          {log.appliedItems && log.appliedItems.length > 0 && (
            <View className="mt-2 pt-2 border-t border-gray-200">
              <Text className="text-gray-500 text-xs mb-1">
                Applied to {log.appliedItems.length} item(s)
              </Text>
              {log.appliedItems.slice(0, 2).map((item, index) => (
                <View key={index} className="flex-row items-center justify-between">
                  <Text className="text-gray-700 text-sm flex-1" numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text className="text-green-600 text-sm">
                    -₹{item.discountAmount.toFixed(0)}
                  </Text>
                </View>
              ))}
              {log.appliedItems.length > 2 && (
                <Text className="text-gray-400 text-xs">
                  +{log.appliedItems.length - 2} more items
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text className="text-gray-500 mt-4">Loading offer logs...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center mb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800">Offer Usage</Text>
            <Text className="text-gray-500 text-sm">
              {filteredLogs.length} records
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-green-50 rounded-xl p-3 mr-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-xs">Total Savings</Text>
                <Text className="text-green-600 font-bold text-lg">
                  ₹{stats.totalSavings.toFixed(0)}
                </Text>
              </View>
              <TrendingDown size={20} color="#66BB6A" />
            </View>
          </View>
          <View className="flex-1 bg-blue-50 rounded-xl p-3 mx-1">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-xs">Orders</Text>
                <Text className="text-blue-600 font-bold text-lg">
                  {stats.uniqueOrders}
                </Text>
              </View>
              <ShoppingBag size={20} color="#3B82F6" />
            </View>
          </View>
          <View className="flex-1 bg-purple-50 rounded-xl p-3 ml-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-xs">Users</Text>
                <Text className="text-purple-600 font-bold text-lg">
                  {stats.uniqueUsers}
                </Text>
              </View>
              <User size={20} color="#9333EA" />
            </View>
          </View>
        </View>

        {/* Type Filter */}
        <View className="flex-row mb-4">
          {(["all", "discount", "bogo", "combo", "coupon"] as const).map((type) => {
            const isSelected = typeFilter === type;
            const config = type !== "all" ? typeConfig[type] : null;

            return (
              <Pressable
                key={type}
                onPress={() => setTypeFilter(type)}
                className={`px-3 py-2 rounded-lg mr-2 ${
                  isSelected
                    ? type === "all"
                      ? "bg-gray-800"
                      : ""
                    : "bg-gray-100"
                }`}
                style={
                  isSelected && config
                    ? { backgroundColor: config.bg }
                    : undefined
                }
              >
                <Text
                  className={`text-sm font-medium ${
                    isSelected
                      ? type === "all"
                        ? "text-white"
                        : ""
                      : "text-gray-600"
                  }`}
                  style={
                    isSelected && config
                      ? { color: config.color }
                      : undefined
                  }
                >
                  {type === "all" ? "All" : OFFER_TYPE_LABELS[type]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by offer, order, or email..."
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

      {/* Logs List */}
      <FlashList
        data={filteredLogs}
        estimatedItemSize={150}
        contentContainerStyle={{ padding: 16 }}
        renderItem={renderItem}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Tag size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg mt-4">No usage logs yet</Text>
            <Text className="text-gray-400 text-sm mt-1 text-center">
              {searchQuery || typeFilter !== "all"
                ? "Try different filters"
                : "Offer usage will appear here after orders"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
