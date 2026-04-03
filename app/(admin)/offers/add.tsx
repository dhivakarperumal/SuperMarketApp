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
  ChevronRight,
  Calendar,
  Tag,
  Info,
  Plus,
  X,
  Ticket,
  RefreshCw,
} from "lucide-react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Timestamp } from "firebase/firestore";
import { useOffersAdmin } from "../../../src/hooks/useOffers";

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
  DEFAULT_OFFER_FORM,
  OFFER_TYPE_LABELS,
  generateCouponCode,
} from "../../../src/types/offers";
import { useCategories } from "../../../src/hooks/useCategories";
import { useProducts } from "../../../src/hooks/useProducts";

const STEPS = [
  { id: 1, title: "Type", description: "Select offer type" },
  { id: 2, title: "Details", description: "Basic information" },
  { id: 3, title: "Scope", description: "Eligible products" },
  { id: 4, title: "Config", description: "Offer configuration" },
  { id: 5, title: "Review", description: "Review & create" },
];

const typeConfig: Record<
  OfferType,
  { icon: any; color: string; bg: string; description: string }
> = {
  discount: {
    icon: Percent,
    color: "#1D5A34",
    bg: "#E8F5E9",
    description: "Percentage or flat amount off on products",
  },
  bogo: {
    icon: Gift,
    color: "#9333EA",
    bg: "#F3E8FF",
    description: "Buy X items and get Y items free",
  },
  combo: {
    icon: Package,
    color: "#3B82F6",
    bg: "#DBEAFE",
    description: "Bundle products at a special price",
  },
  coupon: {
    icon: Ticket,
    color: "#F59E0B",
    bg: "#FEF3C7",
    description: "Code-based discount customers enter at checkout",
  },
};

export default function AddOfferScreen() {
  const { addOffer } = useOffersAdmin();
  const { categories } = useCategories();
  const { products } = useProducts();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OfferFormData>(DEFAULT_OFFER_FORM);

  // Date picker states
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  const updateFormData = (updates: Partial<OfferFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.type;
      case 2:
        return formData.name.trim().length > 0;
      case 3:
        return true; // Scope can be store_wide by default
      case 4:
        if (formData.type === "discount") {
          return (
            !!formData.discountType &&
            formData.discountValue !== undefined &&
            formData.discountValue > 0
          );
        }
        if (formData.type === "bogo") {
          return (
            formData.buyQuantity !== undefined &&
            formData.buyQuantity > 0 &&
            formData.getQuantity !== undefined &&
            formData.getQuantity > 0
          );
        }
        if (formData.type === "combo") {
          return (
            (formData.comboProducts?.length || 0) >= 2 &&
            (formData.comboPrice !== undefined || formData.comboDiscount !== undefined)
          );
        }
        if (formData.type === "coupon") {
          return (
            formData.couponCode.trim().length >= 3 &&
            !!formData.discountType &&
            formData.discountValue !== undefined &&
            formData.discountValue > 0
          );
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await addOffer(formData);
      Toast.show({
        type: "success",
        text1: "Offer Created",
        text2: `${formData.name} has been created successfully`,
      });
      router.back();
    } catch (error) {
      console.error("Error creating offer:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to create offer",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Type Selection
  const renderTypeStep = () => (
    <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
      <Text className="text-lg font-bold text-gray-800 mb-2">
        Choose Offer Type
      </Text>
      <Text className="text-gray-500 mb-6">
        Select the type of promotion you want to create
      </Text>

      {(["discount", "bogo", "combo", "coupon"] as OfferType[]).map((type) => {
        const config = typeConfig[type];
        const TypeIcon = config.icon;
        const isSelected = formData.type === type;

        return (
          <Pressable
            key={type}
            onPress={() => updateFormData({ type })}
            className={`p-4 rounded-xl mb-3 border-2 ${
              isSelected ? "border-primary bg-green-50" : "border-gray-200 bg-white"
            }`}
          >
            <View className="flex-row items-center">
              <View
                className="w-14 h-14 rounded-xl items-center justify-center"
                style={{ backgroundColor: config.bg }}
              >
                <TypeIcon size={28} color={config.color} />
              </View>
              <View className="flex-1 ml-4">
                <Text className="font-bold text-gray-800 text-base">
                  {OFFER_TYPE_LABELS[type]}
                </Text>
                <Text className="text-gray-500 text-sm mt-1">
                  {config.description}
                </Text>
              </View>
              {isSelected && (
                <View className="w-8 h-8 bg-primary rounded-full items-center justify-center">
                  <Check size={18} color="#fff" />
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  // Step 2: Basic Details
  const renderDetailsStep = () => (
    <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
      <Text className="text-lg font-bold text-gray-800 mb-2">
        Offer Details
      </Text>
      <Text className="text-gray-500 mb-6">
        Enter the basic information for your offer
      </Text>

      {/* Name */}
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">Offer Name *</Text>
        <TextInput
          value={formData.name}
          onChangeText={(text) => updateFormData({ name: text })}
          placeholder="e.g., Diwali Special 20% Off"
          placeholderTextColor="#9CA3AF"
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
          blurOnSubmit={false}
          returnKeyType="next"
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
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
          textAlignVertical="top"
          blurOnSubmit={false}
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
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
          blurOnSubmit={false}
          returnKeyType="done"
        />
        <Text className="text-gray-400 text-xs mt-1">
          This will appear as a badge on product cards
        </Text>
      </View>

      {/* Start Date */}
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">Start Date *</Text>
        <Pressable
          onPress={() => setShowStartDate(true)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center"
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
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">End Date *</Text>
        <Pressable
          onPress={() => setShowEndDate(true)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center"
        >
          <Calendar size={20} color="#9CA3AF" />
          <Text className="text-gray-800 ml-3">
            {formData.endDate
              ? toDate(formData.endDate).toLocaleDateString()
              : "Select end date"}
          </Text>
        </Pressable>
      </View>

      {/* Active Toggle */}
      <View className="mb-6 flex-row items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
        <View>
          <Text className="text-gray-700 font-medium">Activate Now</Text>
          <Text className="text-gray-400 text-sm">
            Enable this offer immediately
          </Text>
        </View>
        <Switch
          value={formData.isActive}
          onValueChange={(value) => updateFormData({ isActive: value })}
          trackColor={{ false: "#E5E7EB", true: "#1D5A34" }}
          thumbColor="#FFFFFF"
        />
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
    </ScrollView>
  );

  // Step 3: Scope Selection
  const renderScopeStep = () => (
    <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
      <Text className="text-lg font-bold text-gray-800 mb-2">
        Eligible Products
      </Text>
      <Text className="text-gray-500 mb-6">
        Choose which products this offer applies to
      </Text>

      {/* Scope Selection */}
      {(["store_wide", "category", "product"] as OfferScope[]).map((scope) => {
        const isSelected = formData.scope === scope;
        const labels: Record<OfferScope, { title: string; desc: string }> = {
          store_wide: {
            title: "All Products",
            desc: "Apply to every product in the store",
          },
          category: {
            title: "Specific Categories",
            desc: "Apply to selected categories only",
          },
          product: {
            title: "Specific Products",
            desc: "Apply to selected products only",
          },
        };

        return (
          <Pressable
            key={scope}
            onPress={() => updateFormData({ scope })}
            className={`p-4 rounded-xl mb-3 border-2 ${
              isSelected ? "border-primary bg-green-50" : "border-gray-200 bg-white"
            }`}
          >
            <View className="flex-row items-center">
              <View
                className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                  isSelected ? "border-primary bg-primary" : "border-gray-300"
                }`}
              >
                {isSelected && <Check size={14} color="#fff" />}
              </View>
              <View className="ml-3">
                <Text className="font-semibold text-gray-800">
                  {labels[scope].title}
                </Text>
                <Text className="text-gray-500 text-sm">{labels[scope].desc}</Text>
              </View>
            </View>
          </Pressable>
        );
      })}

      {/* Category Selection */}
      {formData.scope === "category" && (
        <View className="mt-4">
          <Text className="text-gray-700 font-medium mb-2">
            Select Categories
          </Text>
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
                    className={`font-medium ${
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
          <Text className="text-gray-700 font-medium mb-2">
            Select Products ({formData.eligibleProducts?.length || 0} selected)
          </Text>
          <ScrollView className="max-h-64" nestedScrollEnabled keyboardShouldPersistTaps="always">
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
                  className={`p-3 rounded-xl mb-2 flex-row items-center ${
                    isSelected ? "bg-green-50 border border-primary" : "bg-white border border-gray-200"
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 ${
                      isSelected ? "border-primary bg-primary" : "border-gray-300"
                    }`}
                  >
                    {isSelected && <Check size={12} color="#fff" />}
                  </View>
                  <Text className="text-gray-800 flex-1" numberOfLines={1}>
                    {product.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Min Quantity */}
      <View className="mt-6 mb-4">
        <Text className="text-gray-700 font-medium mb-2">
          Minimum Quantity Required
        </Text>
        <TextInput
          value={String(formData.minQuantity || 1)}
          onChangeText={(text) =>
            updateFormData({ minQuantity: parseInt(text) || 1 })
          }
          keyboardType="numeric"
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
          blurOnSubmit={false}
          returnKeyType="done"
        />
      </View>
    </ScrollView>
  );

  // Step 4: Configuration
  const renderConfigStep = () => (
    <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
      <Text className="text-lg font-bold text-gray-800 mb-2">
        Offer Configuration
      </Text>
      <Text className="text-gray-500 mb-6">
        Configure the {OFFER_TYPE_LABELS[formData.type]} details
      </Text>

      {/* Discount Configuration */}
      {formData.type === "discount" && (
        <>
          {/* Discount Type */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Discount Type *
            </Text>
            <View className="flex-row">
              {(["percentage", "flat"] as DiscountType[]).map((type) => {
                const isSelected = formData.discountType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => updateFormData({ discountType: type })}
                    className={`flex-1 p-4 rounded-xl mr-2 border-2 ${
                      isSelected
                        ? "border-primary bg-green-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <View className="items-center">
                      {type === "percentage" ? (
                        <Percent size={24} color={isSelected ? "#1D5A34" : "#9CA3AF"} />
                      ) : (
                        <Text
                          className={`text-2xl font-bold ${
                            isSelected ? "text-primary" : "text-gray-400"
                          }`}
                        >
                          ₹
                        </Text>
                      )}
                      <Text
                        className={`mt-2 font-medium ${
                          isSelected ? "text-primary" : "text-gray-600"
                        }`}
                      >
                        {type === "percentage" ? "Percentage" : "Flat Amount"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Discount Value */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Discount Value *
            </Text>
            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4">
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
                blurOnSubmit={false}
                returnKeyType="done"
              />
              {formData.discountType === "percentage" && (
                <Text className="text-gray-500 text-lg ml-2">%</Text>
              )}
            </View>
          </View>

          {/* Max Discount Amount */}
          {formData.discountType === "percentage" && (
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">
                Maximum Discount Amount
              </Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4">
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
                  blurOnSubmit={false}
                  returnKeyType="done"
                />
              </View>
              <Text className="text-gray-400 text-xs mt-1">
                Leave empty for no limit
              </Text>
            </View>
          )}
        </>
      )}

      {/* BOGO Configuration */}
      {formData.type === "bogo" && (
        <>
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Buy Quantity *
            </Text>
            <TextInput
              value={String(formData.buyQuantity || "")}
              onChangeText={(text) =>
                updateFormData({ buyQuantity: parseInt(text) || 0 })
              }
              keyboardType="numeric"
              placeholder="e.g., 2"
              placeholderTextColor="#9CA3AF"
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
              blurOnSubmit={false}
              returnKeyType="next"
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Get Quantity Free *
            </Text>
            <TextInput
              value={String(formData.getQuantity || "")}
              onChangeText={(text) =>
                updateFormData({ getQuantity: parseInt(text) || 0 })
              }
              keyboardType="numeric"
              placeholder="e.g., 1"
              placeholderTextColor="#9CA3AF"
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
              blurOnSubmit={false}
              returnKeyType="done"
            />
          </View>

          <View className="bg-blue-50 p-4 rounded-xl flex-row items-start">
            <Info size={20} color="#3B82F6" />
            <Text className="text-blue-700 text-sm ml-3 flex-1">
              Customers will get {formData.getQuantity || "X"} items free when they buy{" "}
              {formData.buyQuantity || "X"} items of the same product.
            </Text>
          </View>
        </>
      )}

      {/* Combo Configuration */}
      {formData.type === "combo" && (
        <>
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Combo Products (Select at least 2)
            </Text>
            <ScrollView className="max-h-48" nestedScrollEnabled keyboardShouldPersistTaps="always">
              {products.slice(0, 15).map((product) => {
                const comboProduct = formData.comboProducts?.find(
                  (cp) => cp.productId === product.id
                );
                const isSelected = !!comboProduct;

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
                    className={`p-3 rounded-xl mb-2 flex-row items-center ${
                      isSelected
                        ? "bg-blue-50 border border-blue-500"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 ${
                        isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                      }`}
                    >
                      {isSelected && <Check size={12} color="#fff" />}
                    </View>
                    <Text className="text-gray-800 flex-1" numberOfLines={1}>
                      {product.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Combo Price *
            </Text>
            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4">
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
                blurOnSubmit={false}
                returnKeyType="done"
              />
            </View>
          </View>
        </>
      )}

      {/* Coupon Configuration */}
      {formData.type === "coupon" && (
        <>
          {/* Coupon Code */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Coupon Code *
            </Text>
            <View className="flex-row items-center">
              <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-xl px-4 mr-2">
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
                  blurOnSubmit={false}
                  returnKeyType="next"
                />
              </View>
              <Pressable
                onPress={() => updateFormData({ couponCode: generateCouponCode() })}
                className="bg-amber-100 p-3 rounded-xl"
              >
                <RefreshCw size={20} color="#F59E0B" />
              </Pressable>
            </View>
            <Text className="text-gray-400 text-xs mt-1">
              Customers will enter this code at checkout
            </Text>
          </View>

          {/* Discount Type */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Discount Type *
            </Text>
            <View className="flex-row">
              {(["percentage", "flat"] as DiscountType[]).map((type) => {
                const isSelected = formData.discountType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => updateFormData({ discountType: type })}
                    className={`flex-1 p-4 rounded-xl mr-2 border-2 ${
                      isSelected
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <View className="items-center">
                      {type === "percentage" ? (
                        <Percent size={24} color={isSelected ? "#F59E0B" : "#9CA3AF"} />
                      ) : (
                        <Text
                          className={`text-2xl font-bold ${
                            isSelected ? "text-amber-500" : "text-gray-400"
                          }`}
                        >
                          ₹
                        </Text>
                      )}
                      <Text
                        className={`mt-2 font-medium ${
                          isSelected ? "text-amber-600" : "text-gray-600"
                        }`}
                      >
                        {type === "percentage" ? "Percentage" : "Flat Amount"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Discount Value */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Discount Value *
            </Text>
            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4">
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
                blurOnSubmit={false}
                returnKeyType="next"
              />
              {formData.discountType === "percentage" && (
                <Text className="text-gray-500 text-lg ml-2">%</Text>
              )}
            </View>
          </View>

          {/* Max Discount Amount (for percentage) */}
          {formData.discountType === "percentage" && (
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">
                Maximum Discount Amount
              </Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4">
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
                  blurOnSubmit={false}
                  returnKeyType="next"
                />
              </View>
              <Text className="text-gray-400 text-xs mt-1">
                Cap the discount at this amount (optional)
              </Text>
            </View>
          )}

          {/* Minimum Order Amount */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Minimum Order Amount
            </Text>
            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4">
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
                blurOnSubmit={false}
                returnKeyType="done"
              />
            </View>
            <Text className="text-gray-400 text-xs mt-1">
              Order must be at least this amount to use coupon
            </Text>
          </View>

          {/* First Order Only Toggle */}
          <View className="mb-4 flex-row items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
            <View className="flex-1">
              <Text className="text-gray-700 font-medium">First Order Only</Text>
              <Text className="text-gray-400 text-sm">
                Only new customers can use this coupon
              </Text>
            </View>
            <Switch
              value={formData.isFirstOrderOnly}
              onValueChange={(value) => updateFormData({ isFirstOrderOnly: value })}
              trackColor={{ false: "#E5E7EB", true: "#F59E0B" }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* One Time Use Toggle */}
          <View className="mb-4 flex-row items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
            <View className="flex-1">
              <Text className="text-gray-700 font-medium">One-Time Use</Text>
              <Text className="text-gray-400 text-sm">
                Auto-deactivate after first use
              </Text>
            </View>
            <Switch
              value={formData.isOneTimeUse}
              onValueChange={(value) => updateFormData({ isOneTimeUse: value })}
              trackColor={{ false: "#E5E7EB", true: "#F59E0B" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View className="bg-amber-50 p-4 rounded-xl flex-row items-start">
            <Info size={20} color="#F59E0B" />
            <Text className="text-amber-700 text-sm ml-3 flex-1">
              Coupon code "{formData.couponCode || "CODE"}" will give{" "}
              {formData.discountType === "percentage"
                ? `${formData.discountValue || 0}% off`
                : `₹${formData.discountValue || 0} off`}
              {formData.minOrderAmount
                ? ` on orders above ₹${formData.minOrderAmount}`
                : ""}
              .
            </Text>
          </View>
        </>
      )}

      {/* Usage Limit */}
      <View className="mt-6 mb-4">
        <Text className="text-gray-700 font-medium mb-2">
          Total Usage Limit
        </Text>
        <TextInput
          value={String(formData.usageLimit || "")}
          onChangeText={(text) =>
            updateFormData({ usageLimit: parseInt(text) || undefined })
          }
          keyboardType="numeric"
          placeholder="Unlimited"
          placeholderTextColor="#9CA3AF"
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
          blurOnSubmit={false}
          returnKeyType="next"
        />
        <Text className="text-gray-400 text-xs mt-1">
          Leave empty for unlimited usage
        </Text>
      </View>

      {/* Per User Limit */}
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">
          Per User Limit
        </Text>
        <TextInput
          value={String(formData.perUserLimit || "")}
          onChangeText={(text) =>
            updateFormData({ perUserLimit: parseInt(text) || undefined })
          }
          keyboardType="numeric"
          placeholder="Unlimited"
          placeholderTextColor="#9CA3AF"
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
          blurOnSubmit={false}
          returnKeyType="done"
        />
      </View>
    </ScrollView>
  );

  // Step 5: Review
  const renderReviewStep = () => {
    const config = typeConfig[formData.type];
    const TypeIcon = config.icon;

    return (
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
        <Text className="text-lg font-bold text-gray-800 mb-2">
          Review Your Offer
        </Text>
        <Text className="text-gray-500 mb-6">
          Please review the details before creating
        </Text>

        {/* Offer Card Preview */}
        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
          <View className="flex-row items-center mb-4">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: config.bg }}
            >
              <TypeIcon size={24} color={config.color} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-bold text-gray-800 text-lg">
                {formData.name || "Untitled Offer"}
              </Text>
              <View
                className="px-2 py-1 rounded-full self-start mt-1"
                style={{ backgroundColor: config.bg }}
              >
                <Text className="text-xs font-medium" style={{ color: config.color }}>
                  {OFFER_TYPE_LABELS[formData.type]}
                </Text>
              </View>
            </View>
            <View
              className={`px-3 py-1 rounded-full ${
                formData.isActive ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              <Text
                className={`font-medium text-sm ${
                  formData.isActive ? "text-green-700" : "text-gray-500"
                }`}
              >
                {formData.isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>

          {formData.description && (
            <Text className="text-gray-600 mb-4">{formData.description}</Text>
          )}

          {/* Details */}
          <View className="border-t border-gray-100 pt-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">Scope</Text>
              <Text className="text-gray-800 font-medium">
                {formData.scope === "store_wide"
                  ? "All Products"
                  : formData.scope === "category"
                  ? `${formData.eligibleCategories?.length || 0} Categories`
                  : `${formData.eligibleProducts?.length || 0} Products`}
              </Text>
            </View>

            {formData.type === "discount" && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">Discount</Text>
                <Text className="text-gray-800 font-medium">
                  {formData.discountType === "percentage"
                    ? `${formData.discountValue}%`
                    : `₹${formData.discountValue}`}
                </Text>
              </View>
            )}

            {formData.type === "bogo" && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">Offer</Text>
                <Text className="text-gray-800 font-medium">
                  Buy {formData.buyQuantity} Get {formData.getQuantity} Free
                </Text>
              </View>
            )}

            {formData.type === "combo" && (
              <>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500">Products</Text>
                  <Text className="text-gray-800 font-medium">
                    {formData.comboProducts?.length || 0} items
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500">Combo Price</Text>
                  <Text className="text-gray-800 font-medium">
                    ₹{formData.comboPrice}
                  </Text>
                </View>
              </>
            )}

            {formData.type === "coupon" && (
              <>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500">Coupon Code</Text>
                  <Text className="text-amber-600 font-bold font-mono">
                    {formData.couponCode}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500">Discount</Text>
                  <Text className="text-gray-800 font-medium">
                    {formData.discountType === "percentage"
                      ? `${formData.discountValue}%`
                      : `₹${formData.discountValue}`}
                  </Text>
                </View>
                {formData.minOrderAmount && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500">Min Order</Text>
                    <Text className="text-gray-800 font-medium">
                      ₹{formData.minOrderAmount}
                    </Text>
                  </View>
                )}
                {formData.isFirstOrderOnly && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500">Restriction</Text>
                    <Text className="text-gray-800 font-medium">
                      First Order Only
                    </Text>
                  </View>
                )}
              </>
            )}

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">Validity</Text>
              <Text className="text-gray-800 font-medium">
                {formData.startDate && formData.endDate
                  ? `${toDate(formData.startDate).toLocaleDateString()} - ${toDate(formData.endDate).toLocaleDateString()}`
                  : "Not set"}
              </Text>
            </View>

            {formData.usageLimit && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">Usage Limit</Text>
                <Text className="text-gray-800 font-medium">
                  {formData.usageLimit} times
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Badge Preview */}
        {formData.badgeText && (
          <View className="bg-white rounded-xl p-4 border border-gray-200">
            <Text className="text-gray-700 font-medium mb-2">Badge Preview</Text>
            <View
              className="px-3 py-1.5 rounded-full self-start"
              style={{ backgroundColor: formData.badgeColor || "#1D5A34" }}
            >
              <Text className="text-white font-bold text-sm">
                {formData.badgeText}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderTypeStep();
      case 2:
        return renderDetailsStep();
      case 3:
        return renderScopeStep();
      case 4:
        return renderConfigStep();
      case 5:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View className="px-4 py-4 bg-white border-b border-gray-200">
          <View className="flex-row items-center">
            <Pressable
              onPress={handleBack}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
            >
              <ChevronLeft size={24} color="#374151" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-800">
                Create Offer
              </Text>
              <Text className="text-gray-500 text-sm">
                Step {currentStep} of {STEPS.length}
              </Text>
            </View>
          </View>

          {/* Progress Steps */}
          <View className="flex-row mt-4">
            {STEPS.map((step, index) => (
              <View key={step.id} className="flex-1 flex-row items-center">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    currentStep >= step.id ? "bg-primary" : "bg-gray-200"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check size={16} color="#fff" />
                  ) : (
                    <Text
                      className={`font-bold ${
                        currentStep >= step.id ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {step.id}
                    </Text>
                  )}
                </View>
                {index < STEPS.length - 1 && (
                  <View
                    className={`flex-1 h-1 mx-1 ${
                      currentStep > step.id ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 pt-4">{renderStepContent()}</View>

        {/* Footer */}
        <View className="px-4 py-4 bg-white border-t border-gray-200">
          <View className="flex-row">
            {currentStep > 1 && (
              <Pressable
                onPress={handleBack}
                className="flex-1 bg-gray-100 py-4 rounded-xl mr-2"
              >
                <Text className="text-gray-700 font-semibold text-center">
                  Back
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={currentStep === STEPS.length ? handleSubmit : handleNext}
              disabled={!validateStep() || loading}
              className={`flex-1 py-4 rounded-xl ${
                validateStep() && !loading ? "bg-primary" : "bg-gray-300"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-center">
                  {currentStep === STEPS.length ? "Create Offer" : "Next"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
