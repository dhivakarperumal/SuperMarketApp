import { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import {
  ChevronLeft,
  Search,
  Plus,
  X,
  ChevronRight,
  Tag,
  Percent,
  Gift,
  Package,
  Calendar,
  Users,
  Copy,
  Trash2,
  Edit3,
  BarChart3,
  Ticket,
} from "lucide-react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { useOffersAdmin, useOfferStats } from "../../../src/hooks/useOffers";
import { Offer, OFFER_TYPE_LABELS, BADGE_COLORS } from "../../../src/types/offers";
import { formatOfferValidity } from "../../../src/services/offers/OfferEngine";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  discount: { icon: Percent, color: "#1D5A34", bg: "#E8F5E9" },
  bogo: { icon: Gift, color: "#9333EA", bg: "#F3E8FF" },
  combo: { icon: Package, color: "#3B82F6", bg: "#DBEAFE" },
  coupon: { icon: Ticket, color: "#F59E0B", bg: "#FEF3C7" },
};

export default function OffersScreen() {
  const { offers, loading, deleteOffer, toggleOfferStatus, duplicateOffer } =
    useOffersAdmin();
  const { stats } = useOfferStats();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  const filteredOffers = useMemo(() => {
    let filtered = offers;

    if (filter === "active") {
      filtered = filtered.filter((o) => o.isActive);
    } else if (filter === "inactive") {
      filtered = filtered.filter((o) => !o.isActive);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (o) =>
          o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [offers, searchQuery, filter]);

  const handleToggleStatus = async (offer: Offer) => {
    try {
      await toggleOfferStatus(offer.id, !offer.isActive);
      Toast.show({
        type: "success",
        text1: offer.isActive ? "Offer Disabled" : "Offer Enabled",
        text2: `${offer.name} is now ${offer.isActive ? "inactive" : "active"}`,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update offer status",
      });
    }
  };

  const handleDuplicate = async (offer: Offer) => {
    try {
      await duplicateOffer(offer);
      Toast.show({
        type: "success",
        text1: "Offer Duplicated",
        text2: `${offer.name} (Copy) created`,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to duplicate offer",
      });
    }
  };

  const handleDeletePress = (offer: Offer) => {
    setSelectedOffer(offer);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedOffer) return;
    try {
      await deleteOffer(selectedOffer.id);
      Toast.show({
        type: "success",
        text1: "Offer Deleted",
        text2: `${selectedOffer.name} has been removed`,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete offer",
      });
    } finally {
      setDeleteModalVisible(false);
      setSelectedOffer(null);
    }
  };

  const getOfferDescription = (offer: Offer): string => {
    switch (offer.type) {
      case "discount":
        if (offer.discountType === "percentage") {
          return `${offer.discountValue}% off`;
        }
        return `₹${offer.discountValue} off`;
      case "bogo":
        return `Buy ${offer.buyQuantity} Get ${offer.getQuantity} Free`;
      case "combo":
        if (offer.comboPrice) {
          return `Combo for ₹${offer.comboPrice}`;
        }
        return `${offer.comboDiscount}% off combo`;
      case "coupon":
        const discountText = offer.discountType === "percentage"
          ? `${offer.discountValue}% off`
          : `₹${offer.discountValue} off`;
        const minText = offer.minOrderAmount ? ` (Min ₹${offer.minOrderAmount})` : "";
        return `Code: ${offer.couponCode} - ${discountText}${minText}`;
      default:
        return offer.description;
    }
  };

  const getScopeLabel = (offer: Offer): string => {
    switch (offer.scope) {
      case "store_wide":
        return "All Products";
      case "category":
        return `${offer.eligibleCategories?.length || 0} Categories`;
      case "product":
        return `${offer.eligibleProducts?.length || 0} Products`;
      default:
        return "";
    }
  };

  const renderItem = ({ item: offer }: { item: Offer }) => {
    const config = typeConfig[offer.type] || typeConfig.discount;
    const TypeIcon = config.icon;

    return (
      <Pressable
        onPress={() => router.push(`/(admin)/offers/edit/${offer.id}`)}
        className="bg-white rounded-xl mb-3 overflow-hidden"
      >
        {/* Header */}
        <View className="p-4 border-b border-gray-100">
          <View className="flex-row items-start">
            {/* Type Icon */}
            <View
              className="w-12 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: config.bg }}
            >
              <TypeIcon size={24} color={config.color} />
            </View>

            {/* Content */}
            <View className="flex-1 ml-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-gray-800 text-base flex-1" numberOfLines={1}>
                  {offer.name}
                </Text>
                <Switch
                  value={offer.isActive}
                  onValueChange={() => handleToggleStatus(offer)}
                  trackColor={{ false: "#E5E7EB", true: "#1D5A34" }}
                  thumbColor="#FFFFFF"
                  style={{ transform: [{ scale: 0.8 }] }}
                />
              </View>
              <Text className="text-gray-500 text-sm mt-0.5">
                {getOfferDescription(offer)}
              </Text>
              <View className="flex-row items-center mt-2 flex-wrap">
                {/* Type Badge */}
                <View
                  className="px-2 py-1 rounded-full mr-2 mb-1"
                  style={{ backgroundColor: config.bg }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: config.color }}
                  >
                    {OFFER_TYPE_LABELS[offer.type]}
                  </Text>
                </View>
                {/* Scope Badge */}
                <View className="bg-gray-100 px-2 py-1 rounded-full mr-2 mb-1">
                  <Text className="text-gray-600 text-xs font-medium">
                    {getScopeLabel(offer)}
                  </Text>
                </View>
                {/* Status Badge */}
                <View
                  className={`px-2 py-1 rounded-full mb-1 ${
                    offer.isActive ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      offer.isActive ? "text-green-700" : "text-gray-500"
                    }`}
                  >
                    {offer.isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="px-4 py-3 bg-[#F1F8E9] flex-row items-center justify-between">
          {/* Validity & Usage */}
          <View className="flex-row items-center">
            <Calendar size={14} color="#9CA3AF" />
            <Text className="text-gray-500 text-xs ml-1">
              {formatOfferValidity(offer)}
            </Text>
            <View className="w-1 h-1 bg-gray-300 rounded-full mx-2" />
            <Users size={14} color="#9CA3AF" />
            <Text className="text-gray-500 text-xs ml-1">
              {offer.usageCount || 0} uses
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row items-center">
            <Pressable
              onPress={() => handleDuplicate(offer)}
              className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center mr-2"
            >
              <Copy size={16} color="#6B7280" />
            </Pressable>
            <Pressable
              onPress={() => router.push(`/(admin)/offers/edit/${offer.id}`)}
              className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-2"
            >
              <Edit3 size={16} color="#3B82F6" />
            </Pressable>
            <Pressable
              onPress={() => handleDeletePress(offer)}
              className="w-8 h-8 bg-red-50 rounded-lg items-center justify-center"
            >
              <Trash2 size={16} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9] items-center justify-center" edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color="#1D5A34" />
        <Text className="text-gray-500 mt-4">Loading offers...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="px-4 py-4 bg-gray-100 border-b border-gray-200">
        <View className="flex-row items-center mb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800">
              Offers & Promotions
            </Text>
            <Text className="text-gray-500 text-sm">{offers.length} offers</Text>
          </View>
          <Pressable
            onPress={() => router.push("/(admin)/offers/logs")}
            className="w-10 h-10 bg-white rounded-full items-center justify-center"
          >
            <BarChart3 size={20} color="#1D5A34" />
          </Pressable>
        </View>

        {/* Stats Cards */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-white rounded-xl p-3 mr-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-xs">Active</Text>
                <Text className="text-green-600 font-bold text-xl">
                  {stats?.active || 0}
                </Text>
              </View>
              <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center">
                <Tag size={20} color="#66BB6A" />
              </View>
            </View>
          </View>
          <View className="flex-1 bg-white rounded-xl p-3 mx-1">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-xs">Coupons</Text>
                <Text className="text-amber-600 font-bold text-xl">
                  {stats?.byType?.coupon || 0}
                </Text>
              </View>
              <View className="w-10 h-10 bg-amber-50 rounded-full items-center justify-center">
                <Ticket size={20} color="#F59E0B" />
              </View>
            </View>
          </View>
          <View className="flex-1 bg-white rounded-xl p-3 ml-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-xs">Used</Text>
                <Text className="text-purple-600 font-bold text-xl">
                  {stats?.totalUsage || 0}
                </Text>
              </View>
              <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center">
                <Users size={20} color="#9333EA" />
              </View>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row mb-4">
          <Pressable
            onPress={() => setFilter("all")}
            className={`flex-1 rounded-xl py-2.5 mr-2 ${
              filter === "all" ? "bg-primary" : "bg-white"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                filter === "all" ? "text-white" : "text-gray-600"
              }`}
            >
              All
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter("active")}
            className={`flex-1 rounded-xl py-2.5 mr-2 ${
              filter === "active" ? "bg-green-500" : "bg-white"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                filter === "active" ? "text-white" : "text-gray-600"
              }`}
            >
              Active
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter("inactive")}
            className={`flex-1 rounded-xl py-2.5 ${
              filter === "inactive" ? "bg-[#F1F8E9]0" : "bg-white"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                filter === "inactive" ? "text-white" : "text-gray-600"
              }`}
            >
              Inactive
            </Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search offers..."
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

      {/* Offers List */}
      <FlashList
        data={filteredOffers}
        estimatedItemSize={150}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        renderItem={renderItem}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Tag size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg mt-4">
              {searchQuery ? "No offers found" : "No offers yet"}
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              {searchQuery
                ? "Try a different search"
                : "Create your first promotion"}
            </Text>
            {!searchQuery && (
              <Pressable
                onPress={() => router.push("/(admin)/offers/add")}
                className="mt-4 bg-primary px-6 py-3 rounded-xl flex-row items-center"
              >
                <Plus size={18} color="#fff" />
                <Text className="text-white font-semibold ml-2">Add Offer</Text>
              </Pressable>
            )}
          </View>
        }
      />

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/(admin)/offers/add")}
        className="absolute right-4 bottom-6"
        style={{ marginBottom: 10 }}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Offer"
        message={`Are you sure you want to delete "${selectedOffer?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSelectedOffer(null);
        }}
      />
    </SafeAreaView>
  );
}
