import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  TextInput,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  ChevronLeft,
  Package,
  Check,
  Minus,
  Plus,
  AlertCircle,
  ChevronDown,
  RotateCcw,
} from "lucide-react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../src/services/firebase/config";
import { useReturns } from "../../../src/hooks/useReturns";
import { useAuth } from "../../../src/context/AuthContext";
import { formatCurrency } from "../../../src/utils/formatters";
import { RETURN_REASONS, ReturnItem } from "../../../src/types";
import {
  checkReturnEligibility,
  getReturnableItems,
  calculateRefundAmount,
} from "../../../src/utils/returnUtils";
import Toast from "react-native-toast-message";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedWeight?: string;
  image?: string;
}

interface SelectedItem extends OrderItem {
  returnQuantity: number;
  reason: string;
}

export default function ReturnRequestScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { user } = useAuth();
  const { createReturnRequest } = useReturns();

  const [step, setStep] = useState(1); // 1: Select Items, 2: Reasons, 3: Confirm
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [returnableItems, setReturnableItems] = useState<OrderItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [customerNotes, setCustomerNotes] = useState("");
  const [showReasonPicker, setShowReasonPicker] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    try {
      const docRef = doc(db, "orders", orderId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() };
        setOrder(orderData);

        // Check eligibility
        const eligibility = checkReturnEligibility(orderData as any);
        if (!eligibility.eligible) {
          Toast.show({
            type: "error",
            text1: "Cannot Return",
            text2: eligibility.reason,
          });
          router.back();
          return;
        }

        // Get returnable items
        const items = getReturnableItems(orderData as any);
        setReturnableItems(items);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load order details",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (item: OrderItem) => {
    const key = `${item.productId}_${item.selectedWeight || "default"}`;
    const newSelected = new Map(selectedItems);

    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.set(key, {
        ...item,
        returnQuantity: item.quantity,
        reason: "Damaged",
      });
    }

    setSelectedItems(newSelected);
  };

  const updateReturnQuantity = (key: string, delta: number) => {
    const newSelected = new Map(selectedItems);
    const item = newSelected.get(key);
    if (item) {
      const newQty = Math.max(1, Math.min(item.quantity, item.returnQuantity + delta));
      newSelected.set(key, { ...item, returnQuantity: newQty });
      setSelectedItems(newSelected);
    }
  };

  const updateReason = (key: string, reason: string) => {
    const newSelected = new Map(selectedItems);
    const item = newSelected.get(key);
    if (item) {
      newSelected.set(key, { ...item, reason });
      setSelectedItems(newSelected);
    }
    setShowReasonPicker(null);
  };

  const getRefundAmount = () => {
    const items = Array.from(selectedItems.values());
    return calculateRefundAmount(
      items.map((i) => ({ price: i.price, quantity: i.returnQuantity }))
    );
  };

  const handleSubmit = async () => {
    if (selectedItems.size === 0) {
      Toast.show({
        type: "error",
        text1: "No Items Selected",
        text2: "Please select at least one item to return",
      });
      return;
    }

    if (!user) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "You must be logged in to request a return",
      });
      return;
    }

    setSubmitting(true);
    try {
      const returnItems: ReturnItem[] = Array.from(selectedItems.values()).map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.returnQuantity,
        originalQuantity: item.quantity,
        price: item.price,
        selectedWeight: item.selectedWeight,
        image: item.image,
        reason: item.reason,
      }));

      await createReturnRequest(
        orderId!,
        returnItems,
        returnItems[0].reason, // Primary reason
        "customer",
        user.uid,
        user.email || undefined,
        customerNotes || undefined
      );

      Toast.show({
        type: "success",
        text1: "Return Requested",
        text2: "Your return request has been submitted for review",
      });

      router.replace({
        pathname: "/(customer)/orders/[id]",
        params: { id: orderId },
      });
    } catch (error) {
      console.error("Error submitting return:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to submit return request. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1D5A34" />
      </SafeAreaView>
    );
  }

  const selectedCount = selectedItems.size;
  const refundAmount = getRefundAmount();

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />
      {/* Header */}
      <View
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
        <View className="flex-row items-center">
          <Pressable
            onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">Request Return</Text>
            <Text className="text-white/80 text-sm">
              Step {step} of 3 -{" "}
              {step === 1 ? "Select Items" : step === 2 ? "Choose Reasons" : "Confirm"}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="flex-row px-4 py-3 bg-white">
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            className={`flex-1 h-1 mx-1 rounded-full ${
              s <= step ? "bg-orange-500" : "bg-gray-200"
            }`}
          />
        ))}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Step 1: Select Items */}
        {step === 1 && (
          <View className="p-4">
            <Text className="text-gray-600 mb-4">
              Select the items you want to return and adjust quantities if needed.
            </Text>

            {returnableItems.map((item) => {
              const key = `${item.productId}_${item.selectedWeight || "default"}`;
              const isSelected = selectedItems.has(key);
              const selectedItem = selectedItems.get(key);

              return (
                <Pressable
                  key={key}
                  onPress={() => toggleItemSelection(item)}
                  className={`bg-white p-4 rounded-xl mb-3 border-2 ${
                    isSelected ? "border-orange-500" : "border-transparent"
                  }`}
                >
                  <View className="flex-row items-center">
                    <View
                      className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
                        isSelected ? "bg-orange-500 border-orange-500" : "border-gray-300"
                      }`}
                    >
                      {isSelected && <Check size={16} color="#fff" />}
                    </View>

                    <View className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden">
                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-full items-center justify-center">
                          <Package size={20} color="#9CA3AF" />
                        </View>
                      )}
                    </View>

                    <View className="flex-1 ml-3">
                      <Text className="text-gray-800 font-medium" numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {item.selectedWeight ? `${item.selectedWeight} • ` : ""}
                        Qty: {item.quantity}
                      </Text>
                      <Text className="text-primary font-bold mt-1">
                        {formatCurrency(item.price * item.quantity)}
                      </Text>
                    </View>
                  </View>

                  {/* Quantity Selector */}
                  {isSelected && selectedItem && (
                    <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <Text className="text-gray-600">Return Quantity:</Text>
                      <View className="flex-row items-center">
                        <Pressable
                          onPress={() => updateReturnQuantity(key, -1)}
                          className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                        >
                          <Minus size={16} color="#374151" />
                        </Pressable>
                        <Text className="mx-4 font-bold text-lg">
                          {selectedItem.returnQuantity}
                        </Text>
                        <Pressable
                          onPress={() => updateReturnQuantity(key, 1)}
                          className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                        >
                          <Plus size={16} color="#374151" />
                        </Pressable>
                      </View>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Step 2: Choose Reasons */}
        {step === 2 && (
          <View className="p-4">
            <Text className="text-gray-600 mb-4">
              Please select a reason for returning each item.
            </Text>

            {Array.from(selectedItems.entries()).map(([key, item]) => (
              <View key={key} className="bg-white p-4 rounded-xl mb-3">
                <View className="flex-row items-center mb-3">
                  <View className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Package size={16} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-800 font-medium" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      Returning {item.returnQuantity} of {item.quantity}
                    </Text>
                  </View>
                </View>

                {/* Reason Selector */}
                <Pressable
                  onPress={() => setShowReasonPicker(showReasonPicker === key ? null : key)}
                  className="flex-row items-center justify-between p-3 bg-[#F1F8E9] rounded-lg border border-gray-200"
                >
                  <Text className="text-gray-700">
                    {RETURN_REASONS.find((r) => r.value === item.reason)?.label ||
                      "Select reason"}
                  </Text>
                  <ChevronDown size={20} color="#6B7280" />
                </Pressable>

                {/* Reason Options */}
                {showReasonPicker === key && (
                  <View className="mt-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {RETURN_REASONS.map((reason) => (
                      <Pressable
                        key={reason.value}
                        onPress={() => updateReason(key, reason.value)}
                        className={`p-3 border-b border-gray-100 ${
                          item.reason === reason.value ? "bg-orange-50" : ""
                        }`}
                      >
                        <Text
                          className={`${
                            item.reason === reason.value
                              ? "text-orange-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          {reason.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {/* Additional Notes */}
            <View className="bg-white p-4 rounded-xl mt-2">
              <Text className="font-medium text-gray-800 mb-2">
                Additional Notes (Optional)
              </Text>
              <TextInput
                value={customerNotes}
                onChangeText={setCustomerNotes}
                placeholder="Describe any issues or provide additional details..."
                multiline
                numberOfLines={3}
                className="bg-[#F1F8E9] p-3 rounded-lg border border-gray-200 text-gray-700"
                style={{ textAlignVertical: "top", minHeight: 80 }}
              />
            </View>
          </View>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <View className="p-4">
            <View className="bg-orange-50 p-4 rounded-xl mb-4 flex-row items-start">
              <AlertCircle size={20} color="#F97316" />
              <Text className="ml-3 text-orange-700 flex-1">
                Please review your return request. Once submitted, our team will review
                and process your request.
              </Text>
            </View>

            {/* Items Summary */}
            <View className="bg-white p-4 rounded-xl mb-4">
              <Text className="font-bold text-gray-800 mb-3">Items to Return</Text>
              {Array.from(selectedItems.values()).map((item, index) => (
                <View
                  key={index}
                  className={`py-3 ${
                    index < selectedItems.size - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <View className="flex-row justify-between">
                    <Text className="text-gray-700 flex-1" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-gray-500">x{item.returnQuantity}</Text>
                  </View>
                  <View className="flex-row justify-between mt-1">
                    <Text className="text-gray-500 text-sm">
                      {RETURN_REASONS.find((r) => r.value === item.reason)?.label}
                    </Text>
                    <Text className="font-medium">
                      {formatCurrency(item.price * item.returnQuantity)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Refund Summary */}
            <View className="bg-white p-4 rounded-xl mb-4">
              <Text className="font-bold text-gray-800 mb-3">Refund Summary</Text>
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-600">Items ({selectedCount})</Text>
                <Text className="font-medium">{formatCurrency(refundAmount)}</Text>
              </View>
              <View className="flex-row justify-between pt-3 border-t border-gray-100">
                <Text className="text-lg font-bold text-gray-800">Expected Refund</Text>
                <Text className="text-lg font-bold text-orange-500">
                  {formatCurrency(refundAmount)}
                </Text>
              </View>
            </View>

            {/* Notes */}
            {customerNotes && (
              <View className="bg-white p-4 rounded-xl mb-4">
                <Text className="font-bold text-gray-800 mb-2">Your Notes</Text>
                <Text className="text-gray-600">{customerNotes}</Text>
              </View>
            )}

            {/* Terms */}
            <Text className="text-gray-500 text-sm text-center mb-4">
              By submitting this request, you agree to our return policy. Refunds will
              be processed after the items are received and inspected.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View className="bg-white px-4 py-4 border-t border-gray-100">
        {selectedCount > 0 && step < 3 && (
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600">
              {selectedCount} item{selectedCount > 1 ? "s" : ""} selected
            </Text>
            <Text className="font-bold text-orange-500">
              Refund: {formatCurrency(refundAmount)}
            </Text>
          </View>
        )}

        {step < 3 ? (
          <Pressable
            onPress={() => setStep(step + 1)}
            disabled={selectedCount === 0}
            className={`py-4 rounded-xl items-center ${
              selectedCount > 0 ? "bg-orange-500" : "bg-gray-300"
            }`}
          >
            <Text className="text-white font-bold text-lg">
              {step === 1 ? "Continue to Reasons" : "Review Return Request"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            className="bg-orange-500 py-4 rounded-xl flex-row items-center justify-center"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <RotateCcw size={20} color="#fff" />
                <Text className="ml-2 text-white font-bold text-lg">
                  Submit Return Request
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
