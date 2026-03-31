import { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, ScrollView, Image, Modal, ActivityIndicator, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Trash2, Plus, Minus, ShoppingBag, AlertTriangle, ChevronLeft, AlertCircle, Truck, Gift, Tag, Ticket } from "lucide-react-native";
import { router } from "expo-router";
import { useCart } from "../../../src/context/CartContext";
import { useDeliveryConfig } from "../../../src/context/DeliveryConfigContext";
import { useOffers } from "../../../src/context/OfferContext";
import { formatCurrency } from "../../../src/utils/formatters";
import { getProductStock } from "../../../src/utils/stockManager";
import { CartItem } from "../../../src/types";
import Toast from "react-native-toast-message";
import { WhatsAppCheckoutButton } from "../../../src/components/whatsapp/WhatsAppOrderButton";

export default function CartScreen() {
  const { cart, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isEnabled: deliveryEnabled, config: deliveryConfig, getFreeDeliveryThreshold, getAmountNeededForFreeDelivery } = useDeliveryConfig();
  const { cartTotals, cartWithOffers } = useOffers();
  const insets = useSafeAreaInsets();
  const bottomActionSpacing = Math.max(insets.bottom + 16, 24);

  // Calculate free delivery info
  const freeDeliveryThreshold = useMemo(() => {
    if (!deliveryEnabled || !deliveryConfig) return null;
    return getFreeDeliveryThreshold();
  }, [deliveryEnabled, deliveryConfig, getFreeDeliveryThreshold]);

  const amountForFreeDelivery = useMemo(() => {
    if (!freeDeliveryThreshold) return null;
    return getAmountNeededForFreeDelivery(cartTotal);
  }, [cartTotal, freeDeliveryThreshold, getAmountNeededForFreeDelivery]);

  const hasFreeDelivery = amountForFreeDelivery === 0;
  const defaultDeliveryCharge = deliveryConfig?.defaultCharge || 0;

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Stock tracking
  const [stockInfo, setStockInfo] = useState<Record<string, number>>({});
  const [loadingStock, setLoadingStock] = useState(true);

  // Fetch stock for all cart items
  useEffect(() => {
    const fetchStockInfo = async () => {
      setLoadingStock(true);
      const stockData: Record<string, number> = {};

      for (const item of cart) {
        const stock = await getProductStock(item.productId);
        stockData[item.productId] = stock;
      }

      setStockInfo(stockData);
      setLoadingStock(false);
    };

    if (cart.length > 0) {
      fetchStockInfo();
    } else {
      setLoadingStock(false);
    }
  }, [cart]);

  // Check if any items have stock issues
  const hasStockIssues = cart.some((item) => {
    const available = stockInfo[item.productId] || 0;
    return available < item.quantity || available === 0;
  });

  const handleQuantityIncrease = async (item: CartItem) => {
    const available = stockInfo[item.productId] || 0;

    if (item.quantity >= available) {
      Toast.show({
        type: "warning",
        text1: "Maximum Reached",
        text2: `Only ${available} items available in stock`,
      });
      return;
    }

    const result = await updateQuantity(item.id, item.quantity + 1);
    if (!result.success) {
      Toast.show({
        type: "error",
        text1: "Cannot Update",
        text2: result.message,
      });
    }
  };

  const handleDeletePress = (item: CartItem) => {
    if (!item.id) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Invalid item, cannot delete",
      });
      return;
    }
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !itemToDelete.id) {
      setShowDeleteModal(false);
      setItemToDelete(null);
      return;
    }

    setDeleting(true);
    try {
      await removeFromCart(itemToDelete.id);
      Toast.show({
        type: "success",
        text1: "Removed",
        text2: `${itemToDelete.name || "Item"} removed from cart`,
      });
    } catch (error) {
      console.error("Delete error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to remove item",
      });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleClearAllPress = () => {
    setShowClearAllModal(true);
  };

  const confirmClearAll = async () => {
    setDeleting(true);
    try {
      await clearCart();
      Toast.show({
        type: "success",
        text1: "Cart Cleared",
        text2: "All items removed from cart",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to clear cart",
      });
    } finally {
      setDeleting(false);
      setShowClearAllModal(false);
    }
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
        <LinearGradient
          colors={["#2E7D32", "#1B5E20"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
        >
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </Pressable>
            <Text className="text-2xl font-bold text-white">My Cart</Text>
          </View>
        </LinearGradient>
        <View className="flex-1 items-center justify-center px-4">
          <View className="bg-gray-100 p-6 rounded-full mb-4">
            <ShoppingBag size={48} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-semibold text-gray-800 mb-2">
            Your cart is empty
          </Text>
          <Text className="text-gray-500 text-center mb-6">
            Looks like you haven't added anything to your cart yet
          </Text>
          <Pressable
            onPress={() => router.push("/(customer)/(tabs)/shop")}
            className="bg-primary px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Start Shopping</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      {/* Header */}
      <LinearGradient
        colors={["#2E7D32", "#1B5E20"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </Pressable>
            <View>
              <Text className="text-2xl font-bold text-white">My Cart</Text>
              <Text className="text-white/80">{cartCount} items</Text>
            </View>
          </View>
          <Pressable
            onPress={handleClearAllPress}
            className="px-3 py-2 bg-white/20 rounded-full"
          >
            <Text className="text-white font-medium">Clear All</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Cart Items */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 6, paddingBottom: 12 }}
      >
        {cart.map((item, index) => {
          const availableStock = stockInfo[item.productId] || 0;
          const isOutOfStock = availableStock === 0;
          const isLowStock = availableStock > 0 && availableStock < item.quantity;
          const atMaxQuantity = item.quantity >= availableStock;

          return (
            <View
              key={`${item.id}-${index}`}
              className={`bg-white mx-4 my-2 p-4 rounded-xl ${isOutOfStock ? "border border-red-200" : ""}`}
            >
              <View className="flex-row">
                {/* Product Image */}
                <View className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative">
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      className="w-full h-full"
                      resizeMode="cover"
                      style={{ opacity: isOutOfStock ? 0.5 : 1 }}
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <ShoppingBag size={24} color="#9CA3AF" />
                    </View>
                  )}
                  {isOutOfStock && (
                    <View className="absolute inset-0 bg-black/40 items-center justify-center">
                      <Text className="text-white text-xs font-bold">OUT OF STOCK</Text>
                    </View>
                  )}
                </View>

                {/* Product Details */}
                <View className="flex-1 ml-4">
                  <Text
                    className={`font-semibold ${isOutOfStock ? "text-gray-400" : "text-gray-800"}`}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  {item.selectedWeight && (
                    <Text className="text-gray-500 text-sm mt-1">
                      {item.selectedWeight}
                    </Text>
                  )}
                  <Text className={`font-bold mt-1 ${isOutOfStock ? "text-gray-400" : "text-primary"}`}>
                    {formatCurrency(item.price)}
                  </Text>
                </View>

                {/* Quantity Controls */}
                <View className="items-end justify-between">
                  <Pressable
                    onPress={() => handleDeletePress(item)}
                    className="p-2"
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </Pressable>
                  {!isOutOfStock && (
                    <View className="flex-row items-center bg-gray-100 rounded-lg">
                      <Pressable
                        onPress={() => {
                          if (item.quantity === 1) {
                            handleDeletePress(item);
                          } else {
                            updateQuantity(item.id, item.quantity - 1);
                          }
                        }}
                        className="p-2"
                      >
                        <Minus size={16} color="#374151" />
                      </Pressable>
                      <Text className="px-3 font-semibold">{item.quantity}</Text>
                      <Pressable
                        onPress={() => handleQuantityIncrease(item)}
                        className="p-2"
                        style={{ opacity: atMaxQuantity ? 0.5 : 1 }}
                      >
                        <Plus size={16} color={atMaxQuantity ? "#9CA3AF" : "#374151"} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>

              {/* Stock Warning */}
              {(isOutOfStock || isLowStock) && !loadingStock && (
                <View
                  className={`flex-row items-center mt-3 px-3 py-2 rounded-lg ${
                    isOutOfStock ? "bg-red-50" : "bg-amber-50"
                  }`}
                >
                  <AlertCircle size={14} color={isOutOfStock ? "#EF4444" : "#F59E0B"} />
                  <Text
                    className={`ml-2 text-sm font-medium ${
                      isOutOfStock ? "text-red-600" : "text-amber-600"
                    }`}
                  >
                    {isOutOfStock
                      ? "This item is out of stock. Please remove it."
                      : `Only ${availableStock} available. Adjust quantity.`}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Section */}
      <View
        className="bg-white px-4 pt-4 border-t border-gray-100"
        style={{
          paddingBottom: bottomActionSpacing,
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        {/* Free Delivery Banner */}
        {deliveryEnabled && freeDeliveryThreshold && amountForFreeDelivery !== null && amountForFreeDelivery > 0 && (
          <View className="flex-row items-center bg-green-50 px-4 py-3 rounded-xl mb-3">
            <Gift size={18} color="#66BB6A" />
            <Text className="text-green-700 ml-2 flex-1 text-sm">
              Add {formatCurrency(amountForFreeDelivery)} more for <Text className="font-semibold">free delivery</Text>
            </Text>
          </View>
        )}

        {/* Applied Offers Banner */}
        {cartTotals.totalDiscount > 0 && (
          <View className="flex-row items-center bg-green-50 px-4 py-3 rounded-xl mb-3">
            <Tag size={18} color="#66BB6A" />
            <View className="ml-2 flex-1">
              <Text className="text-green-700 font-semibold">
                Offers Applied! You save {formatCurrency(cartTotals.totalDiscount)}
              </Text>
              {cartTotals.appliedOffers.slice(0, 2).map((offer, index) => (
                <Text key={index} className="text-green-600 text-sm">
                  {offer.offerName}: -{formatCurrency(offer.discountAmount)}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Coupon Hint */}
        {cartTotals.totalDiscount === 0 && (
          <View className="flex-row items-center bg-amber-50 px-4 py-3 rounded-xl mb-3">
            <Ticket size={18} color="#F59E0B" />
            <Text className="text-amber-700 ml-2 flex-1 text-sm">
              Have a coupon? Apply it at checkout!
            </Text>
          </View>
        )}

        {/* Summary */}
        <View className="mb-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Subtotal</Text>
            <Text className="font-semibold">{formatCurrency(cartTotals.subtotal)}</Text>
          </View>
          {cartTotals.totalDiscount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-green-600">Discount</Text>
              <Text className="font-semibold text-green-600">-{formatCurrency(cartTotals.totalDiscount)}</Text>
            </View>
          )}
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <Truck size={14} color="#6B7280" />
              <Text className="text-gray-500 ml-1">Delivery</Text>
            </View>
            {!deliveryEnabled || hasFreeDelivery ? (
              <Text className="font-semibold text-primary">Free</Text>
            ) : (
              <View className="items-end">
                <Text className="font-semibold text-gray-700">
                  {defaultDeliveryCharge > 0 ? `From ${formatCurrency(defaultDeliveryCharge)}` : 'Calculated at checkout'}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row justify-between pt-2 border-t border-gray-100">
            <Text className="text-lg font-bold text-gray-800">Total</Text>
            <Text className="text-lg font-bold text-primary">
              {formatCurrency(cartTotals.total)}
            </Text>
          </View>
          {deliveryEnabled && !hasFreeDelivery && defaultDeliveryCharge > 0 && (
            <Text className="text-gray-400 text-xs text-right mt-1">
              + delivery charges at checkout
            </Text>
          )}
        </View>

        {/* Stock Issues Warning */}
        {hasStockIssues && !loadingStock && (
          <View className="flex-row items-center bg-amber-50 px-4 py-3 rounded-xl mb-3">
            <AlertTriangle size={18} color="#F59E0B" />
            <Text className="text-amber-700 ml-2 flex-1 text-sm">
              Some items have stock issues. Please update your cart.
            </Text>
          </View>
        )}

        {/* WhatsApp Checkout Button */}
        {!hasStockIssues && cart.length > 0 && (
          <WhatsAppCheckoutButton
            cart={{
              items: cart.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                selectedWeight: item.selectedWeight,
                image: item.image,
              })),
              subtotal: cartTotals.subtotal,
              discount: cartTotals.totalDiscount,
              discountLabel: cartTotals.appliedOffers?.[0]?.offerName,
              deliveryFee: hasFreeDelivery ? 0 : defaultDeliveryCharge,
              total: cartTotals.total + (hasFreeDelivery ? 0 : defaultDeliveryCharge),
            }}
            style={{ marginBottom: 12 }}
          />
        )}

        {/* Checkout Button */}
        <Pressable
          onPress={() => {
            if (hasStockIssues) {
              Toast.show({
                type: "warning",
                text1: "Stock Issues",
                text2: "Please fix stock issues before checkout",
              });
              return;
            }
            router.push("/(customer)/checkout");
          }}
          disabled={hasStockIssues}
          className={`py-4 rounded-xl ${hasStockIssues ? "bg-gray-300" : "bg-primary"}`}
        >
          <Text className={`text-center font-semibold text-lg ${hasStockIssues ? "text-gray-500" : "text-white"}`}>
            {hasStockIssues ? "Fix Stock Issues" : "Proceed to Checkout"}
          </Text>
        </Pressable>
      </View>

      {/* Delete Item Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center px-6"
          onPress={() => setShowDeleteModal(false)}
        >
          <Pressable
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <View className="items-center pt-8 pb-4">
              <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center">
                <Trash2 size={36} color="#EF4444" />
              </View>
            </View>

            {/* Content */}
            <View className="px-6 pb-6">
              <Text className="text-xl font-bold text-gray-800 text-center mb-2">
                Remove Item?
              </Text>
              <Text className="text-gray-500 text-center mb-6">
                Are you sure you want to remove{" "}
                <Text className="font-semibold text-gray-700">
                  {itemToDelete?.name}
                </Text>{" "}
                from your cart?
              </Text>

              {/* Buttons */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => !deleting && setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 py-4 bg-gray-100 rounded-xl"
                >
                  <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-4 bg-red-500 rounded-xl flex-row items-center justify-center"
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold text-center">Remove</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Clear All Confirmation Modal */}
      <Modal
        visible={showClearAllModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearAllModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center px-6"
          onPress={() => setShowClearAllModal(false)}
        >
          <Pressable
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <View className="items-center pt-8 pb-4">
              <View className="w-20 h-20 bg-orange-100 rounded-full items-center justify-center">
                <AlertTriangle size={36} color="#F97316" />
              </View>
            </View>

            {/* Content */}
            <View className="px-6 pb-6">
              <Text className="text-xl font-bold text-gray-800 text-center mb-2">
                Clear Cart?
              </Text>
              <Text className="text-gray-500 text-center mb-6">
                Are you sure you want to remove all{" "}
                <Text className="font-semibold text-gray-700">{cartCount} items</Text>{" "}
                from your cart? This action cannot be undone.
              </Text>

              {/* Buttons */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => !deleting && setShowClearAllModal(false)}
                  disabled={deleting}
                  className="flex-1 py-4 bg-gray-100 rounded-xl"
                >
                  <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={confirmClearAll}
                  disabled={deleting}
                  className="flex-1 py-4 bg-orange-500 rounded-xl flex-row items-center justify-center"
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold text-center">Clear All</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
