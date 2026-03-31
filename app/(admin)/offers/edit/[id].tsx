import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Percent,
  Gift,
  Package,
  Check,
  Calendar,
  Save,
  Trash2,
  Ticket,
  RefreshCw,
  Info,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Timestamp } from "firebase/firestore";
import { useOffersAdmin } from "../../../../src/hooks/useOffers";

// Helper function to convert Date or Timestamp to Date
const toDate = (date: Date | Timestamp | any): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === "object" && "toDate" in date && typeof date.toDate === "function") {
    return date.toDate();
  }
  if (typeof date === "object" && "seconds" in date) {
    return new Date(date.seconds * 1000);
  }
  return new Date();
};
import {
  OfferType,
  OfferScope,
  DiscountType,
  OfferFormData,
  OFFER_TYPE_LABELS,
  Offer,
  generateCouponCode,
} from "../../../../src/types/offers";
import { useCategories } from "../../../../src/hooks/useCategories";
import { useProducts } from "../../../../src/hooks/useProducts";
import { ConfirmationModal } from "../../../../src/components/ConfirmationModal";

const typeConfig: Record<
  OfferType,
  { icon: any; color: string; bg: string }
> = {
  discount: { icon: Percent, color: "#2E7D32", bg: "#E8F5E9" },
  bogo: { icon: Gift, color: "#9333EA", bg: "#F3E8FF" },
  combo: { icon: Package, color: "#3B82F6", bg: "#DBEAFE" },
  coupon: { icon: Ticket, color: "#F59E0B", bg: "#FEF3C7" },
};

export default function EditOfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { offers, updateOffer, deleteOffer, loading: offersLoading } = useOffersAdmin();
  const { categories } = useCategories();
  const { products } = useProducts();

  const [formData, setFormData] = useState<OfferFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Date picker states
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  // Find the offer
  const offer = offers.find((o) => o.id === id);

  // Initialize form data from offer
  useEffect(() => {
    if (offer && !formData) {
      setFormData({
        name: offer.name,
        description: offer.description,
        type: offer.type,
        isActive: offer.isActive,
        scope: offer.scope,
        eligibleProducts: offer.eligibleProducts || [],
        eligibleCategories: offer.eligibleCategories || [],
        excludedProducts: offer.excludedProducts || [],
        minQuantity: offer.minQuantity,
        maxQuantity: offer.maxQuantity,
        startDate: offer.startDate,
        endDate: offer.endDate,
        startTime: offer.startTime,
        endTime: offer.endTime,
        daysOfWeek: offer.daysOfWeek,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        maxDiscountAmount: offer.maxDiscountAmount,
        buyQuantity: offer.buyQuantity,
        getQuantity: offer.getQuantity,
        getProductId: offer.getProductId,
        comboProducts: offer.comboProducts,
        comboPrice: offer.comboPrice,
        comboDiscount: offer.comboDiscount,
        couponCode: offer.couponCode || "",
        minOrderAmount: offer.minOrderAmount,
        maxUsesPerUser: offer.maxUsesPerUser,
        isFirstOrderOnly: offer.isFirstOrderOnly || false,
        isOneTimeUse: offer.isOneTimeUse || false,
        usageLimit: offer.usageLimit,
        perUserLimit: offer.perUserLimit,
        badgeText: offer.badgeText,
        badgeColor: offer.badgeColor,
        bannerImage: offer.bannerImage,
      });
    }
  }, [offer]);

  const updateFormData = (updates: Partial<OfferFormData>) => {
    setFormData((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const handleSave = async () => {
    if (!formData || !id) return;

    setLoading(true);
    try {
      await updateOffer(id, formData);
      Toast.show({
        type: "success",
        text1: "Offer Updated",
        text2: `${formData.name} has been updated successfully`,
      });
      router.back();
    } catch (error) {
      console.error("Error updating offer:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update offer",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!id) return;
    try {
      await deleteOffer(id);
      Toast.show({
        type: "success",
        text1: "Offer Deleted",
        text2: "The offer has been removed",
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete offer",
      });
    } finally {
      setDeleteModalVisible(false);
    }
  };

  if (offersLoading || !formData) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text className="text-gray-500 mt-4">Loading offer...</Text>
      </SafeAreaView>
    );
  }

  if (!offer) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top", "bottom"]}>
        <Text className="text-gray-500">Offer not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-primary px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const config = typeConfig[formData.type];
  const TypeIcon = config.icon;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-4 bg-white border-b border-gray-200">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
            >
              <ChevronLeft size={24} color="#374151" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-800">Edit Offer</Text>
              <Text className="text-gray-500 text-sm">
                {OFFER_TYPE_LABELS[formData.type]}
              </Text>
            </View>
            <Pressable
              onPress={() => setDeleteModalVisible(true)}
              className="w-10 h-10 bg-red-50 rounded-full items-center justify-center"
            >
              <Trash2 size={20} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Type Display */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: config.bg }}
              >
                <TypeIcon size={24} color={config.color} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-bold text-gray-800">
                  {OFFER_TYPE_LABELS[formData.type]}
                </Text>
                <Text className="text-gray-500 text-sm">Offer Type</Text>
              </View>
              <View className="bg-gray-100 px-3 py-1 rounded-full">
                <Text className="text-gray-600 text-sm">
                  {offer.usageCount || 0} uses
                </Text>
              </View>
            </View>
          </View>

          {/* Basic Details */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <Text className="font-bold text-gray-800 mb-4">Basic Details</Text>

            {/* Name */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Offer Name *</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => updateFormData({ name: text })}
                placeholder="e.g., Diwali Special 20% Off"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
              />
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Description</Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) => updateFormData({ description: text })}
                placeholder="Describe your offer"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                textAlignVertical="top"
              />
            </View>

            {/* Badge Text */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Badge Text</Text>
              <TextInput
                value={formData.badgeText || ""}
                onChangeText={(text) => updateFormData({ badgeText: text })}
                placeholder="e.g., 20% OFF"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
              />
            </View>

            {/* Active Toggle */}
            <View className="flex-row items-center justify-between bg-gray-50 rounded-xl p-4">
              <View>
                <Text className="text-gray-700 font-medium">Active</Text>
                <Text className="text-gray-400 text-sm">
                  Enable or disable this offer
                </Text>
              </View>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => updateFormData({ isActive: value })}
                trackColor={{ false: "#E5E7EB", true: "#2E7D32" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Validity Period */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <Text className="font-bold text-gray-800 mb-4">Validity Period</Text>

            {/* Start Date */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Start Date</Text>
              <Pressable
                onPress={() => setShowStartDate(true)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center"
              >
                <Calendar size={20} color="#9CA3AF" />
                <Text className="text-gray-800 ml-3">
                  {formData.startDate
                    ? toDate(formData.startDate).toLocaleDateString()
                    : "Select start date"}
                </Text>
              </Pressable>
            </View>

            {/* End Date */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">End Date</Text>
              <Pressable
                onPress={() => setShowEndDate(true)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center"
              >
                <Calendar size={20} color="#9CA3AF" />
                <Text className="text-gray-800 ml-3">
                  {formData.endDate
                    ? toDate(formData.endDate).toLocaleDateString()
                    : "Select end date"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Scope */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <Text className="font-bold text-gray-800 mb-4">Eligible Products</Text>

            {(["store_wide", "category", "product"] as OfferScope[]).map((scope) => {
              const isSelected = formData.scope === scope;
              const labels: Record<OfferScope, string> = {
                store_wide: "All Products",
                category: "Specific Categories",
                product: "Specific Products",
              };

              return (
                <Pressable
                  key={scope}
                  onPress={() => updateFormData({ scope })}
                  className={`p-3 rounded-xl mb-2 flex-row items-center ${
                    isSelected ? "bg-green-50 border border-primary" : "bg-gray-50"
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                      isSelected ? "border-primary bg-primary" : "border-gray-300"
                    }`}
                  >
                    {isSelected && <Check size={12} color="#fff" />}
                  </View>
                  <Text className="text-gray-800">{labels[scope]}</Text>
                </Pressable>
              );
            })}

            {/* Category Selection */}
            {formData.scope === "category" && (
              <View className="mt-4">
                <Text className="text-gray-600 text-sm mb-2">Select Categories</Text>
                <View className="flex-row flex-wrap">
                  {categories.map((category) => {
                    const isSelected = formData.eligibleCategories?.includes(
                      category.id
                    );
                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => {
                          const current = formData.eligibleCategories || [];
                          const updated = isSelected
                            ? current.filter((id) => id !== category.id)
                            : [...current, category.id];
                          updateFormData({ eligibleCategories: updated });
                        }}
                        className={`px-3 py-2 rounded-full mr-2 mb-2 ${
                          isSelected ? "bg-primary" : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`font-medium text-sm ${
                            isSelected ? "text-white" : "text-gray-700"
                          }`}
                        >
                          {category.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Product Selection */}
            {formData.scope === "product" && (
              <View className="mt-4">
                <Text className="text-gray-600 text-sm mb-2">
                  Select Products ({formData.eligibleProducts?.length || 0} selected)
                </Text>
                <ScrollView className="max-h-48" nestedScrollEnabled>
                  {products.slice(0, 20).map((product) => {
                    const isSelected = formData.eligibleProducts?.includes(product.id);
                    return (
                      <Pressable
                        key={product.id}
                        onPress={() => {
                          const current = formData.eligibleProducts || [];
                          const updated = isSelected
                            ? current.filter((id) => id !== product.id)
                            : [...current, product.id];
                          updateFormData({ eligibleProducts: updated });
                        }}
                        className={`p-2 rounded-lg mb-1 flex-row items-center ${
                          isSelected ? "bg-green-50" : "bg-gray-50"
                        }`}
                      >
                        <View
                          className={`w-4 h-4 rounded border items-center justify-center mr-2 ${
                            isSelected ? "border-primary bg-primary" : "border-gray-300"
                          }`}
                        >
                          {isSelected && <Check size={10} color="#fff" />}
                        </View>
                        <Text className="text-gray-800 text-sm flex-1" numberOfLines={1}>
                          {product.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Discount Configuration */}
          {formData.type === "discount" && (
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
              <Text className="font-bold text-gray-800 mb-4">
                Discount Configuration
              </Text>

              {/* Discount Type */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Discount Type</Text>
                <View className="flex-row">
                  {(["percentage", "flat"] as DiscountType[]).map((type) => {
                    const isSelected = formData.discountType === type;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => updateFormData({ discountType: type })}
                        className={`flex-1 p-3 rounded-xl mr-2 ${
                          isSelected
                            ? "bg-green-50 border border-primary"
                            : "bg-gray-50"
                        }`}
                      >
                        <Text
                          className={`text-center font-medium ${
                            isSelected ? "text-primary" : "text-gray-600"
                          }`}
                        >
                          {type === "percentage" ? "Percentage %" : "Flat ₹"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Discount Value */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">
                  Discount Value
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  {formData.discountType === "flat" && (
                    <Text className="text-gray-500 text-lg mr-2">₹</Text>
                  )}
                  <TextInput
                    value={String(formData.discountValue || "")}
                    onChangeText={(text) =>
                      updateFormData({ discountValue: parseFloat(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="Enter value"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 py-3 text-gray-800"
                  />
                  {formData.discountType === "percentage" && (
                    <Text className="text-gray-500 text-lg ml-2">%</Text>
                  )}
                </View>
              </View>

              {/* Max Discount */}
              {formData.discountType === "percentage" && (
                <View>
                  <Text className="text-gray-700 font-medium mb-2">
                    Maximum Discount Amount
                  </Text>
                  <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                    <Text className="text-gray-500 text-lg mr-2">₹</Text>
                    <TextInput
                      value={String(formData.maxDiscountAmount || "")}
                      onChangeText={(text) =>
                        updateFormData({
                          maxDiscountAmount: parseFloat(text) || undefined,
                        })
                      }
                      keyboardType="numeric"
                      placeholder="No limit"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 py-3 text-gray-800"
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* BOGO Configuration */}
          {formData.type === "bogo" && (
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
              <Text className="font-bold text-gray-800 mb-4">BOGO Configuration</Text>

              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-700 font-medium mb-2">
                    Buy Quantity
                  </Text>
                  <TextInput
                    value={String(formData.buyQuantity || "")}
                    onChangeText={(text) =>
                      updateFormData({ buyQuantity: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="e.g., 2"
                    placeholderTextColor="#9CA3AF"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-gray-700 font-medium mb-2">
                    Get Free
                  </Text>
                  <TextInput
                    value={String(formData.getQuantity || "")}
                    onChangeText={(text) =>
                      updateFormData({ getQuantity: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="e.g., 1"
                    placeholderTextColor="#9CA3AF"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Combo Configuration */}
          {formData.type === "combo" && (
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
              <Text className="font-bold text-gray-800 mb-4">
                Combo Configuration
              </Text>

              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Combo Price</Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  <Text className="text-gray-500 text-lg mr-2">₹</Text>
                  <TextInput
                    value={String(formData.comboPrice || "")}
                    onChangeText={(text) =>
                      updateFormData({ comboPrice: parseFloat(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="Enter combo price"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 py-3 text-gray-800"
                  />
                </View>
              </View>

              <Text className="text-gray-600 text-sm mb-2">
                Combo Products ({formData.comboProducts?.length || 0} selected)
              </Text>
              <ScrollView className="max-h-40" nestedScrollEnabled>
                {products.slice(0, 15).map((product) => {
                  const isSelected = formData.comboProducts?.some(
                    (cp) => cp.productId === product.id
                  );
                  return (
                    <Pressable
                      key={product.id}
                      onPress={() => {
                        const current = formData.comboProducts || [];
                        if (isSelected) {
                          updateFormData({
                            comboProducts: current.filter(
                              (cp) => cp.productId !== product.id
                            ),
                          });
                        } else {
                          updateFormData({
                            comboProducts: [
                              ...current,
                              { productId: product.id, quantity: 1 },
                            ],
                          });
                        }
                      }}
                      className={`p-2 rounded-lg mb-1 flex-row items-center ${
                        isSelected ? "bg-blue-50" : "bg-gray-50"
                      }`}
                    >
                      <View
                        className={`w-4 h-4 rounded border items-center justify-center mr-2 ${
                          isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                        }`}
                      >
                        {isSelected && <Check size={10} color="#fff" />}
                      </View>
                      <Text className="text-gray-800 text-sm flex-1" numberOfLines={1}>
                        {product.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Coupon Configuration */}
          {formData.type === "coupon" && (
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
              <Text className="font-bold text-gray-800 mb-4">
                Coupon Configuration
              </Text>

              {/* Coupon Code */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Coupon Code</Text>
                <View className="flex-row items-center">
                  <View className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 mr-2">
                    <Ticket size={20} color="#F59E0B" />
                    <TextInput
                      value={formData.couponCode}
                      onChangeText={(text) =>
                        updateFormData({ couponCode: text.toUpperCase().replace(/\s/g, "") })
                      }
                      placeholder="e.g., SAVE20"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="characters"
                      className="flex-1 py-3 ml-2 text-gray-800 font-mono"
                    />
                  </View>
                  <Pressable
                    onPress={() => updateFormData({ couponCode: generateCouponCode() })}
                    className="bg-amber-100 p-3 rounded-xl"
                  >
                    <RefreshCw size={20} color="#F59E0B" />
                  </Pressable>
                </View>
              </View>

              {/* Discount Type */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Discount Type</Text>
                <View className="flex-row">
                  {(["percentage", "flat"] as DiscountType[]).map((type) => {
                    const isSelected = formData.discountType === type;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => updateFormData({ discountType: type })}
                        className={`flex-1 p-3 rounded-xl mr-2 ${
                          isSelected
                            ? "bg-amber-50 border border-amber-500"
                            : "bg-gray-50"
                        }`}
                      >
                        <Text
                          className={`text-center font-medium ${
                            isSelected ? "text-amber-600" : "text-gray-600"
                          }`}
                        >
                          {type === "percentage" ? "Percentage %" : "Flat ₹"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Discount Value */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Discount Value</Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  {formData.discountType === "flat" && (
                    <Text className="text-gray-500 text-lg mr-2">₹</Text>
                  )}
                  <TextInput
                    value={String(formData.discountValue || "")}
                    onChangeText={(text) =>
                      updateFormData({ discountValue: parseFloat(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="Enter value"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 py-3 text-gray-800"
                  />
                  {formData.discountType === "percentage" && (
                    <Text className="text-gray-500 text-lg ml-2">%</Text>
                  )}
                </View>
              </View>

              {/* Max Discount */}
              {formData.discountType === "percentage" && (
                <View className="mb-4">
                  <Text className="text-gray-700 font-medium mb-2">
                    Maximum Discount
                  </Text>
                  <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                    <Text className="text-gray-500 text-lg mr-2">₹</Text>
                    <TextInput
                      value={String(formData.maxDiscountAmount || "")}
                      onChangeText={(text) =>
                        updateFormData({ maxDiscountAmount: parseFloat(text) || undefined })
                      }
                      keyboardType="numeric"
                      placeholder="No limit"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 py-3 text-gray-800"
                    />
                  </View>
                </View>
              )}

              {/* Min Order Amount */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">
                  Minimum Order Amount
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  <Text className="text-gray-500 text-lg mr-2">₹</Text>
                  <TextInput
                    value={String(formData.minOrderAmount || "")}
                    onChangeText={(text) =>
                      updateFormData({ minOrderAmount: parseFloat(text) || undefined })
                    }
                    keyboardType="numeric"
                    placeholder="No minimum"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 py-3 text-gray-800"
                  />
                </View>
              </View>

              {/* First Order Only */}
              <View className="mb-4 flex-row items-center justify-between bg-gray-50 rounded-xl p-4">
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium">First Order Only</Text>
                  <Text className="text-gray-400 text-sm">New customers only</Text>
                </View>
                <Switch
                  value={formData.isFirstOrderOnly}
                  onValueChange={(value) => updateFormData({ isFirstOrderOnly: value })}
                  trackColor={{ false: "#E5E7EB", true: "#F59E0B" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* One Time Use */}
              <View className="flex-row items-center justify-between bg-gray-50 rounded-xl p-4">
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium">One-Time Use</Text>
                  <Text className="text-gray-400 text-sm">
                    Deactivate after first use
                  </Text>
                </View>
                <Switch
                  value={formData.isOneTimeUse}
                  onValueChange={(value) => updateFormData({ isOneTimeUse: value })}
                  trackColor={{ false: "#E5E7EB", true: "#F59E0B" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          )}

          {/* Usage Limits */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <Text className="font-bold text-gray-800 mb-4">Usage Limits</Text>

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-gray-700 font-medium mb-2">Total Limit</Text>
                <TextInput
                  value={String(formData.usageLimit || "")}
                  onChangeText={(text) =>
                    updateFormData({ usageLimit: parseInt(text) || undefined })
                  }
                  keyboardType="numeric"
                  placeholder="Unlimited"
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                />
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-gray-700 font-medium mb-2">Per User</Text>
                <TextInput
                  value={String(formData.perUserLimit || "")}
                  onChangeText={(text) =>
                    updateFormData({ perUserLimit: parseInt(text) || undefined })
                  }
                  keyboardType="numeric"
                  placeholder="Unlimited"
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                />
              </View>
            </View>

            <View className="bg-gray-50 rounded-xl p-3 flex-row items-center">
              <Text className="text-gray-600 text-sm">Current usage:</Text>
              <Text className="text-gray-800 font-semibold ml-2">
                {offer.usageCount || 0} times
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="px-4 py-4 bg-white border-t border-gray-200">
          <Pressable
            onPress={handleSave}
            disabled={loading || !formData.name.trim()}
            className={`py-4 rounded-xl flex-row items-center justify-center ${
              !loading && formData.name.trim() ? "bg-primary" : "bg-gray-300"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text className="text-white font-semibold ml-2">Save Changes</Text>
              </>
            )}
          </Pressable>
        </View>

        <DateTimePickerModal
          isVisible={showStartDate}
          mode="date"
          date={toDate(formData.startDate)}
          onConfirm={(date) => {
            setShowStartDate(false);
            updateFormData({ startDate: Timestamp.fromDate(date) as any });
          }}
          onCancel={() => setShowStartDate(false)}
        />

        <DateTimePickerModal
          isVisible={showEndDate}
          mode="date"
          date={toDate(formData.endDate)}
          minimumDate={toDate(formData.startDate)}
          onConfirm={(date) => {
            setShowEndDate(false);
            updateFormData({ endDate: Timestamp.fromDate(date) as any });
          }}
          onCancel={() => setShowEndDate(false)}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          visible={deleteModalVisible}
          title="Delete Offer"
          message={`Are you sure you want to delete "${formData?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModalVisible(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
