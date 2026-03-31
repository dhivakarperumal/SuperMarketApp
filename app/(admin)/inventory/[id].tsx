import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  ChevronLeft,
  Package,
  Plus,
  Minus,
  History,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Save,
  Check,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import { useInventory, InventoryItem } from "../../../src/hooks/useInventory";

const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  normal: { bg: "#D1FAE5", text: "#059669", icon: TrendingUp, label: "In Stock" },
  low: { bg: "#FEF3C7", text: "#D97706", icon: TrendingDown, label: "Low Stock" },
  critical: { bg: "#FEE2E2", text: "#DC2626", icon: AlertTriangle, label: "Critical" },
};

export default function InventoryItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { inventory, stockMovements, adjustStock, getProductMovements, loading } = useInventory();
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const [note, setNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [item, setItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    if (!loading && id) {
      const found = inventory.find((i) => i.id === id);
      setItem(found || null);
    }
  }, [inventory, id, loading]);

  const productMovements = id ? getProductMovements(id) : [];

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSave = async () => {
    const qty = parseInt(adjustQuantity);
    if (!qty || qty <= 0) {
      Toast.show({ type: "error", text1: "Error", text2: "Enter a valid quantity" });
      return;
    }

    if (!id || !item) {
      Toast.show({ type: "error", text1: "Error", text2: "Product not found" });
      return;
    }

    if (adjustType === "remove" && qty > item.stock) {
      Toast.show({
        type: "error",
        text1: "Insufficient Stock",
        text2: `Only ${item.stock} ${item.stockUnit} available`,
      });
      return;
    }

    setActionLoading(true);
    try {
      await adjustStock({
        productId: id,
        quantity: qty,
        type: adjustType,
        reason: adjustType === "add" ? "Stock Added" : "Stock Removed",
        note: note || undefined,
      });
      Toast.show({
        type: "success",
        text1: "Stock Saved Successfully",
        text2: `${adjustType === "add" ? "Added" : "Removed"} ${qty} ${item.stockUnit} to ${item.name}`,
      });
      setAdjustQuantity("");
      setNote("");
    } catch (error: any) {
      console.error("Stock adjustment error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to save stock",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickAdd = (amount: number) => {
    setAdjustQuantity(amount.toString());
    setAdjustType("add");
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text className="text-gray-500 mt-4">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
        <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-800">Item Not Found</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Package size={48} color="#9CA3AF" />
          <Text className="text-gray-500 mt-4">Item not found in inventory</Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 bg-primary px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const costPrice = item.costPrice || 0;
  const sellingPrice = item.price || Object.values(item.prices || {})[0] || 0;
  const minStock = 10;
  const StatusIcon = statusConfig[item.stockStatus]?.icon || TrendingUp;
  const statusInfo = statusConfig[item.stockStatus] || statusConfig.normal;
  const productImage = item.images?.[0];
  const newStock = adjustQuantity && parseInt(adjustQuantity) > 0
    ? adjustType === "add"
      ? item.stock + parseInt(adjustQuantity)
      : Math.max(0, item.stock - parseInt(adjustQuantity))
    : item.stock;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
        >
          <ChevronLeft size={24} color="#374151" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-800" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-gray-500 text-sm">{item.category}</Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Product Info & Current Stock */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex-row items-center mb-4">
            {/* Product Image */}
            <View className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden mr-4">
              {productImage ? (
                <Image
                  source={{ uri: productImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Package size={32} color="#9CA3AF" />
                </View>
              )}
            </View>

            {/* Stock Info */}
            <View className="flex-1">
              <View className="flex-row items-baseline">
                <Text className="text-4xl font-bold text-gray-800">{item.stock}</Text>
                <Text className="text-gray-500 text-lg ml-2">{item.stockUnit}</Text>
              </View>
              <View
                className="flex-row items-center px-3 py-1.5 rounded-full mt-2 self-start"
                style={{ backgroundColor: statusInfo.bg }}
              >
                <StatusIcon size={14} color={statusInfo.text} />
                <Text
                  className="text-sm font-semibold ml-1"
                  style={{ color: statusInfo.text }}
                >
                  {statusInfo.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Price Info */}
          <View className="flex-row justify-between pt-4 border-t border-gray-100">
            <View className="items-center flex-1">
              <Text className="text-gray-500 text-sm">Min Stock</Text>
              <Text className="text-gray-800 font-semibold">
                {minStock} {item.stockUnit}
              </Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-gray-500 text-sm">Cost Price</Text>
              <Text className="text-gray-800 font-semibold">₹{costPrice}</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-gray-500 text-sm">Selling Price</Text>
              <Text className="text-primary font-semibold">₹{sellingPrice}</Text>
            </View>
          </View>

          {/* Stock Progress Bar */}
          <View className="mt-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-400 text-xs">Stock Level</Text>
              <Text className="text-gray-400 text-xs">
                {Math.round((item.stock / (minStock * 2)) * 100)}% of optimal
              </Text>
            </View>
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.min((item.stock / (minStock * 2)) * 100, 100)}%`,
                  backgroundColor: statusInfo.text,
                }}
              />
            </View>
          </View>
        </View>

        {/* Adjust Stock */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-gray-800 font-bold text-lg mb-4">Update Stock</Text>

          {/* Add/Remove Toggle */}
          <View className="flex-row mb-4">
            <Pressable
              onPress={() => setAdjustType("add")}
              className={`flex-1 flex-row items-center justify-center py-3.5 rounded-xl mr-2 ${
                adjustType === "add" ? "bg-green-500" : "bg-gray-100"
              }`}
            >
              <Plus size={20} color={adjustType === "add" ? "#fff" : "#374151"} />
              <Text
                className={`font-semibold ml-2 ${
                  adjustType === "add" ? "text-white" : "text-gray-700"
                }`}
              >
                Add Stock
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setAdjustType("remove")}
              className={`flex-1 flex-row items-center justify-center py-3.5 rounded-xl ml-2 ${
                adjustType === "remove" ? "bg-red-500" : "bg-gray-100"
              }`}
            >
              <Minus size={20} color={adjustType === "remove" ? "#fff" : "#374151"} />
              <Text
                className={`font-semibold ml-2 ${
                  adjustType === "remove" ? "text-white" : "text-gray-700"
                }`}
              >
                Remove
              </Text>
            </Pressable>
          </View>

          {/* Quick Add Buttons */}
          {adjustType === "add" && (
            <View className="flex-row mb-4">
              {[10, 25, 50, 100].map((amount) => (
                <Pressable
                  key={amount}
                  onPress={() => handleQuickAdd(amount)}
                  className={`flex-1 py-2.5 rounded-lg mr-2 items-center ${
                    adjustQuantity === amount.toString()
                      ? "bg-green-100 border-2 border-green-500"
                      : "bg-gray-100"
                  }`}
                  style={amount === 100 ? { marginRight: 0 } : {}}
                >
                  <Text
                    className={`font-semibold ${
                      adjustQuantity === amount.toString()
                        ? "text-green-700"
                        : "text-gray-600"
                    }`}
                  >
                    +{amount}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Quantity Input */}
          <View className="mb-3">
            <Text className="text-gray-600 text-sm font-medium mb-2">
              Quantity ({item.stockUnit}) *
            </Text>
            <TextInput
              value={adjustQuantity}
              onChangeText={setAdjustQuantity}
              placeholder="Enter quantity"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              className="bg-gray-100 rounded-xl px-4 py-3.5 text-gray-800 text-lg"
            />
          </View>

          {/* Note Input */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm font-medium mb-2">
              Note (Optional)
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note for this adjustment..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={2}
              className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
              style={{ minHeight: 60, textAlignVertical: "top" }}
            />
          </View>

          {/* Preview */}
          {adjustQuantity && parseInt(adjustQuantity) > 0 && (
            <View className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <Text className="text-blue-800 font-semibold mb-2">Stock Preview</Text>
              <View className="flex-row justify-between items-center">
                <Text className="text-blue-700">Current Stock:</Text>
                <Text className="text-blue-800 font-semibold">
                  {item.stock} {item.stockUnit}
                </Text>
              </View>
              <View className="flex-row justify-between items-center mt-1">
                <Text className="text-blue-700">
                  {adjustType === "add" ? "Adding:" : "Removing:"}
                </Text>
                <Text
                  className={`font-semibold ${
                    adjustType === "add" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {adjustType === "add" ? "+" : "-"}
                  {adjustQuantity} {item.stockUnit}
                </Text>
              </View>
              <View className="h-px bg-blue-200 my-2" />
              <View className="flex-row justify-between items-center">
                <Text className="text-blue-800 font-bold">New Stock:</Text>
                <Text className="text-primary font-bold text-xl">
                  {newStock} {item.stockUnit}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Stock History */}
        <View className="bg-white rounded-2xl p-4">
          <View className="flex-row items-center mb-4">
            <History size={20} color="#2E7D32" />
            <Text className="text-gray-800 font-bold text-lg ml-2">Stock History</Text>
          </View>

          {productMovements.length === 0 ? (
            <View className="items-center py-6">
              <History size={32} color="#D1D5DB" />
              <Text className="text-gray-400 mt-2">No stock adjustments yet</Text>
            </View>
          ) : (
            productMovements.slice(0, 10).map((record, index) => (
              <View
                key={record.id || index}
                className={`flex-row items-center py-3 ${
                  index < Math.min(productMovements.length, 10) - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    record.quantity > 0 ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {record.quantity > 0 ? (
                    <Plus size={18} color="#66BB6A" />
                  ) : (
                    <Minus size={18} color="#EF4444" />
                  )}
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-800 font-semibold">
                    {record.quantity > 0 ? "+" : ""}
                    {record.quantity} {item.stockUnit}
                  </Text>
                  <Text className="text-gray-500 text-xs" numberOfLines={1}>
                    {record.notes || record.type}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-500 text-xs">{formatDate(record.createdAt)}</Text>
                  <Text className="text-gray-400 text-xs">
                    Stock: {record.newStock}
                  </Text>
                </View>
              </View>
            ))
          )}

          {productMovements.length > 10 && (
            <Pressable className="mt-3 py-2 items-center">
              <Text className="text-primary font-semibold">
                View All ({productMovements.length})
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* Fixed Bottom Save Button */}
      <View
        className="bg-white px-4 pt-4 border-t border-gray-100"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          onPress={handleSave}
          disabled={actionLoading || !adjustQuantity || parseInt(adjustQuantity) <= 0}
          className={`flex-row items-center justify-center py-4 rounded-xl ${
            adjustType === "add" ? "bg-primary" : "bg-red-500"
          }`}
          style={{
            opacity: actionLoading || !adjustQuantity || parseInt(adjustQuantity) <= 0 ? 0.6 : 1,
            shadowColor: adjustType === "add" ? "#2E7D32" : "#EF4444",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {actionLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text className="text-white font-bold text-lg ml-2">
                Save Stock Update
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
