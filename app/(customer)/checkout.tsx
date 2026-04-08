import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { ChevronRight, MapPin } from "lucide-react-native";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useCart } from "@/src/context/CartContext";
import { useAddresses } from "@/src/hooks/useAddresses";
import { RazorpayCheckout } from "@/src/components/RazorpayCheckout";
import { RazorpayOptions, RazorpayResponse } from "@/src/services/razorpay/config";
import { useAuth } from "@/src/context/AuthContext";
import { db } from "@/src/services/firebase/config";

const DELIVERY_CHARGES = 50; // Fixed delivery charges in INR
const MIN_ORDER_AMOUNT = 50; // Minimum order amount in INR

interface CheckoutState {
  selectedAddressId: string | null;
  paymentMethod: "online" | "cod";
  isProcessing: boolean;
  error: string | null;
  showPaymentModal: boolean;
}

export default function CheckoutScreen() {
  const { cart, cartTotal, clearCart } = useCart();
  const { addresses, loading: addressLoading } = useAddresses();
  const { user } = useAuth();

  const [state, setState] = useState<CheckoutState>({
    selectedAddressId: null,
    paymentMethod: "online",
    isProcessing: false,
    error: null,
    showPaymentModal: false,
  });

  // Auto-select first address if available
  useEffect(() => {
    if (
      addresses.length > 0 &&
      !state.selectedAddressId &&
      addresses[0]?.id
    ) {
      setState((prev) => ({ ...prev, selectedAddressId: addresses[0].id }));
    }
  }, [addresses]);

  if (cart.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9]">
        <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-xl font-semibold text-gray-800 mb-2">
            Your Cart is Empty
          </Text>
          <Text className="text-gray-600 text-center mb-8">
            Add items to your cart to proceed with checkout
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="bg-[#1D5A34] px-8 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Continue Shopping</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const selectedAddress = addresses.find(
    (addr) => addr.id === state.selectedAddressId
  );

  const subtotal = cartTotal;
  const deliveryCharge =
    subtotal >= 500 ? 0 : DELIVERY_CHARGES; // Free delivery on orders >= 500
  const total = subtotal + deliveryCharge;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert("Error", "Please select a delivery address");
      return;
    }

    if (total < MIN_ORDER_AMOUNT) {
      Alert.alert(
        "Error",
        `Minimum order amount is ₹${MIN_ORDER_AMOUNT}. Current total: ₹${total.toFixed(2)}`
      );
      return;
    }

    if (state.paymentMethod === "cod") {
      await handleCODOrder();
    } else {
      setState((prev) => ({ ...prev, showPaymentModal: true }));
    }
  };

  const handleCODOrder = async () => {
    try {
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      const orderData = {
        userId: user?.uid,
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          weight: item.selectedWeight || "default",
        })),
        deliveryAddressId: state.selectedAddressId,
        paymentMethod: "cod" as const,
        subtotal,
        deliveryCharge,
        total,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      if (user?.uid) {
        await addDoc(collection(db, `users/${user.uid}/orders`), orderData);
      }

      Alert.alert(
        "Success",
        "Your order has been placed successfully!",
        [
          {
            text: "OK",
            onPress: async () => {
              await clearCart();
              router.push("/(customer)/orders");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Order creation error:", error);
      setState((prev) => ({
        ...prev,
        error: "An error occurred while placing your order",
      }));
    } finally {
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  const handlePaymentSuccess = async (response: RazorpayResponse) => {
    try {
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        showPaymentModal: false,
        error: null,
      }));

      const orderData = {
        userId: user?.uid,
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          weight: item.selectedWeight || "default",
        })),
        deliveryAddressId: state.selectedAddressId,
        paymentMethod: "online" as const,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id,
        razorpaySignature: response.razorpay_signature,
        subtotal,
        deliveryCharge,
        total,
        status: "confirmed",
        createdAt: serverTimestamp(),
      };

      if (user?.uid) {
        await addDoc(collection(db, `users/${user.uid}/orders`), orderData);
      }

      Alert.alert("Success", "Payment successful! Order placed.", [
        {
          text: "OK",
          onPress: async () => {
            await clearCart();
            router.push("/(customer)/orders");
          },
        },
      ]);
    } catch (error) {
      console.error("Payment order error:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to process order after payment",
        showPaymentModal: false,
      }));
    } finally {
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  const handlePaymentFailure = (error: string) => {
    console.error("Payment failed:", error);
    setState((prev) => ({
      ...prev,
      showPaymentModal: false,
      error: `Payment failed: ${error}`,
    }));
  };

  const handlePaymentClose = () => {
    setState((prev) => ({ ...prev, showPaymentModal: false }));
  };

  const paymentOptions: RazorpayOptions = {
    key: "",
    amount: Math.round(total * 100), // Convert to paise
    currency: "INR",
    name: "Supermarket",
    description: `Order of ${cart.length} items`,
    theme: { color: "#1D5A34" },
    prefill: {
      name: user?.displayName || "",
      email: user?.email || "",
      contact: "",
    },
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]">
      <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-[#1D5A34] px-5 pt-4 pb-6">
          <Pressable
            onPress={() => router.back()}
            className="mb-3"
          >
            <Text className="text-white text-lg font-semibold">Checkout</Text>
          </Pressable>
        </View>

        <View className="flex-1 px-4 py-4">
          {/* Error Banner */}
          {state.error && (
            <View className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
              <Text className="text-red-800 text-sm">{state.error}</Text>
            </View>
          )}

          {/* Delivery Address Section */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <MapPin size={20} color="#1D5A34" />
              <Text className="text-lg font-semibold text-gray-800 ml-2">
                Delivery Address
              </Text>
            </View>

            {addressLoading ? (
              <ActivityIndicator color="#1D5A34" size="large" />
            ) : addresses.length === 0 ? (
              <View className="bg-blue-100 p-4 rounded-lg mb-3">
                <Text className="text-blue-800 text-sm mb-3">
                  No saved addresses found. Please add one.
                </Text>
                <Pressable
                  onPress={() => router.push("/(customer)/addresses/add")}
                  className="bg-blue-600 px-4 py-2 rounded-lg self-start"
                >
                  <Text className="text-white font-semibold text-sm">
                    Add Address
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="border border-gray-300 rounded-lg overflow-hidden">
                {addresses.map((address, index) => (
                  <Pressable
                    key={address.id}
                    onPress={() =>
                      setState((prev) => ({
                        ...prev,
                        selectedAddressId: address.id,
                      }))
                    }
                    className={`p-4 ${
                      index !== addresses.length - 1
                        ? "border-b border-gray-300"
                        : ""
                    } ${
                      state.selectedAddressId === address.id
                        ? "bg-green-50"
                        : "bg-white"
                    }`}
                  >
                    <View className="flex-row items-start">
                      <View
                        className={`w-5 h-5 rounded-full border-2 mr-3 mt-0.5 ${
                          state.selectedAddressId === address.id
                            ? "bg-[#1D5A34] border-[#1D5A34]"
                            : "border-gray-300"
                        }`}
                      />
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-800">
                          {address.label || address.firstname}
                        </Text>
                        <Text className="text-gray-600 text-sm mt-1">
                          {address.address}, {address.city}, {address.state} {address.zip}
                        </Text>
                        {address.phone && (
                          <Text className="text-gray-600 text-sm mt-1">
                            {address.phone}
                          </Text>
                        )}
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {addresses.length > 0 && (
              <Pressable
                onPress={() => router.push("/(customer)/addresses/add")}
                className="mt-3"
              >
                <Text className="text-[#1D5A34] font-semibold text-sm">
                  + Add New Address
                </Text>
              </Pressable>
            )}
          </View>

          {/* Payment Method Section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Payment Method
            </Text>

            <View className="border border-gray-300 rounded-lg overflow-hidden">
              {/* Online Payment */}
              <Pressable
                onPress={() =>
                  setState((prev) => ({ ...prev, paymentMethod: "online" }))
                }
                className={`p-4 border-b border-gray-300 ${
                  state.paymentMethod === "online"
                    ? "bg-green-50"
                    : "bg-white"
                }`}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 ${
                      state.paymentMethod === "online"
                        ? "bg-[#1D5A34] border-[#1D5A34]"
                        : "border-gray-300"
                    }`}
                  />
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">
                      Online Payment
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      Pay via Razorpay (Cards, UPI, Wallets)
                    </Text>
                  </View>
                </View>
              </Pressable>

              {/* Cash on Delivery */}
              <Pressable
                onPress={() =>
                  setState((prev) => ({ ...prev, paymentMethod: "cod" }))
                }
                className={state.paymentMethod === "cod" ? "bg-green-50" : "bg-white"}
              >
                <View className="p-4 flex-row items-center">
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 ${
                      state.paymentMethod === "cod"
                        ? "bg-[#1D5A34] border-[#1D5A34]"
                        : "border-gray-300"
                    }`}
                  />
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">
                      Cash on Delivery
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      Pay when order is delivered
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Order Summary */}
          <View className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Order Summary
            </Text>

            {/* Cart Items Summary */}
            <View className="mb-4 pb-4 border-b border-gray-200">
              <Text className="text-gray-600 font-medium mb-2">
                Items ({cart.length})
              </Text>
              {cart.map((item) => (
                <View
                  key={item.id}
                  className="flex-row justify-between items-center mb-2"
                >
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium">
                      {item.name}
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      {item.quantity} x ₹{item.price.toFixed(2)}
                    </Text>
                  </View>
                  <Text className="font-semibold text-gray-800">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Pricing Breakdown */}
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Subtotal</Text>
                <Text className="text-gray-800 font-medium">
                  ₹{subtotal.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-gray-600">
                  Delivery
                  {deliveryCharge === 0 && (
                    <Text className="text-green-600"> (Free)</Text>
                  )}
                </Text>
                <Text
                  className={`font-medium ${
                    deliveryCharge === 0
                      ? "text-green-600"
                      : "text-gray-800"
                  }`}
                >
                  ₹{deliveryCharge.toFixed(2)}
                </Text>
              </View>

              {subtotal < 500 && (
                <Text className="text-xs text-gray-500 mt-1">
                  Free delivery on orders above ₹500
                </Text>
              )}

              <View className="flex-row justify-between pt-3 border-t border-gray-200">
                <Text className="text-lg font-semibold text-gray-800">
                  Total
                </Text>
                <Text className="text-lg font-bold text-[#1D5A34]">
                  ₹{total.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View className="px-4 py-4 bg-white border-t border-gray-200">
        <Pressable
          onPress={handlePlaceOrder}
          disabled={state.isProcessing || !selectedAddress}
          className={`py-3 rounded-lg flex-row items-center justify-center ${
            state.isProcessing || !selectedAddress
              ? "bg-gray-400"
              : "bg-[#1D5A34]"
          }`}
        >
          {state.isProcessing ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-semibold text-center flex-1">
                Place Order
              </Text>
              <ChevronRight size={20} color="white" />
            </>
          )}
        </Pressable>
      </View>

      {/* Razorpay Payment Modal */}
      <RazorpayCheckout
        visible={state.showPaymentModal}
        options={paymentOptions}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        onClose={handlePaymentClose}
      />
    </SafeAreaView>
  );
}
