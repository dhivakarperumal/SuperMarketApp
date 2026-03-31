import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import {
  ChevronLeft,
  MapPin,
  CreditCard,
  Truck,
  Check,
  ShoppingBag,
  Search,
  Home,
  Briefcase,
  MapPinned,
  CheckCircle,
  X,
  Plus,
  Info,
  MessageCircle,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useCart } from "../../src/context/CartContext";
import { useAuth } from "../../src/context/AuthContext";
import { useAddresses } from "../../src/hooks/useAddresses";
import { useDeliveryConfig } from "../../src/context/DeliveryConfigContext";
import { useOffers } from "../../src/context/OfferContext";
import CouponInput from "../../src/components/CouponInput";
import { formatCurrency } from "../../src/utils/formatters";
import { DeliveryChargeResult } from "../../src/types/delivery";
import { addDoc, collection, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { createWhatsAppOrder } from "../../src/services/whatsapp/WhatsAppOrderService";
import { generateOrderId } from "../../src/utils/orderIdGenerator";
import { validateCartStock, reduceStockAfterOrder } from "../../src/utils/stockManager";
import { db } from "../../src/services/firebase/config";
import { offlineManager, OfflineOrder } from "../../src/services/offline/OfflineManager";
import { OfflineBanner } from "../../src/components/OfflineBanner";
import { RazorpayCheckout } from "../../src/components/RazorpayCheckout";
import {
  createRazorpayOptions,
  RazorpayResponse,
  RAZORPAY_TEST_MODE,
  validateRazorpayResponse,
  getRazorpayErrorMessage
} from "../../src/services/razorpay/config";
import { SavedAddress } from "../../src/types";
import { useWhatsApp } from "../../src/context/WhatsAppContext";

const Logo = require("../../assets/images/logo.png");

type Step = "address" | "payment" | "review";

// WhatsApp Payment Option Component
function WhatsAppPaymentOption({
  selected,
  onSelect,
}: {
  selected: boolean;
  onSelect: () => void;
}) {
  const { isAvailable, config, checkAvailability } = useWhatsApp();

  // Don't show if cart orders feature is disabled
  if (!config.enableCartOrders) {
    return null;
  }

  // Check why WhatsApp might not be available
  const isFullyConfigured = config.isEnabled && config.phoneNumber;
  const isWithinHours = checkAvailability();
  const canUseWhatsApp = isAvailable && isFullyConfigured;

  // Show disabled state if enabled but not configured
  if (!canUseWhatsApp) {
    let unavailableMessage = "WhatsApp ordering not available";
    if (!config.isEnabled) {
      unavailableMessage = "WhatsApp ordering is disabled";
    } else if (!config.phoneNumber) {
      unavailableMessage = "WhatsApp number not configured";
    } else if (!isWithinHours) {
      unavailableMessage = `Available ${config.availableFromTime} - ${config.availableToTime}`;
    }

    return (
      <View className="flex-row items-center p-4 opacity-50">
        <View className="w-6 h-6 rounded-full border-2 mr-4 items-center justify-center border-gray-300" />
        <View className="w-10 h-10 rounded-full items-center justify-center bg-gray-100">
          <MessageCircle size={22} color="#9CA3AF" strokeWidth={2} />
        </View>
        <View className="ml-4 flex-1">
          <Text className="font-bold text-base text-gray-400">Order via WhatsApp</Text>
          <Text className="text-gray-400 text-sm mt-0.5">{unavailableMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-center p-4 ${selected ? "bg-green-50" : ""}`}
      style={selected ? { borderLeftWidth: 3, borderLeftColor: "#25D366" } : {}}
    >
      <View
        className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center ${
          selected ? "border-green-500 bg-green-500" : "border-gray-300"
        }`}
      >
        {selected && <Check size={14} color="#fff" />}
      </View>
      <View
        className={`w-10 h-10 rounded-full items-center justify-center ${
          selected ? "bg-green-100" : "bg-gray-100"
        }`}
      >
        <MessageCircle size={22} color={selected ? "#25D366" : "#6B7280"} strokeWidth={2} />
      </View>
      <View className="ml-4 flex-1">
        <Text className={`font-bold text-base ${selected ? "text-green-600" : "text-gray-800"}`}>
          Order via WhatsApp
        </Text>
        <Text className="text-gray-500 text-sm mt-0.5">Complete order in WhatsApp chat</Text>
      </View>
    </Pressable>
  );
}

export default function CheckoutScreen() {
  const { cart, cartCount, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { addresses, loading: addressesLoading } = useAddresses();
  const { cartTotals, appliedCoupon, couponDiscount, logAppliedOffers, cartWithOffers } = useOffers();
  const { isAvailable: whatsappAvailable, generateOrderMessage, sendWhatsAppMessage, config: whatsappConfig } = useWhatsApp();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState<Step>("address");
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Check network status
  useEffect(() => {
    offlineManager.checkNetworkStatus().then((online) => setIsOffline(!online));

    const unsubscribe = offlineManager.addNetworkListener((online) => {
      setIsOffline(!online);
    });

    return () => unsubscribe();
  }, []);

  // Address selection
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Address form
  const [address, setAddress] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("cod");

  // Razorpay state
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Delivery charges
  const { calculateCharge, isEnabled: deliveryEnabled, config: deliveryConfig } = useDeliveryConfig();

  // Calculate delivery charge based on address and cart total
  const deliveryResult: DeliveryChargeResult = useMemo(() => {
    if (!deliveryEnabled || !address.pincode) {
      return {
        baseCharge: 0,
        discount: 0,
        additionalCharges: 0,
        finalCharge: 0,
        isFree: true,
        appliedRules: [],
        message: "Free Delivery",
        minOrderMet: true,
      };
    }
    return calculateCharge({
      pincode: address.pincode,
      orderValue: cartTotal,
    });
  }, [address.pincode, cartTotal, deliveryEnabled, calculateCharge]);

  // Total amount including delivery and discounts
  const totalAfterDiscounts = cartTotals.total; // This already has offers applied
  const totalAmount = totalAfterDiscounts + deliveryResult.finalCharge;

  // Auto-select default address on load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0];
      if (defaultAddress) {
        selectAddress(defaultAddress);
      }
    }
  }, [addresses]);

  const selectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setAddress({
      firstname: addr.firstname,
      lastname: addr.lastname,
      phone: addr.phone,
      street: addr.address,
      city: addr.city,
      state: addr.state,
      pincode: addr.zip,
    });
    setShowAddressPicker(false);
  };

  const filteredAddresses = addresses.filter((addr) => {
    const query = searchQuery.toLowerCase();
    return (
      addr.firstname.toLowerCase().includes(query) ||
      addr.lastname.toLowerCase().includes(query) ||
      addr.address.toLowerCase().includes(query) ||
      addr.city.toLowerCase().includes(query) ||
      addr.phone.includes(query) ||
      (addr.label?.toLowerCase().includes(query) ?? false)
    );
  });

  const getLabelIcon = (label?: string) => {
    switch (label?.toLowerCase()) {
      case "home":
        return Home;
      case "work":
        return Briefcase;
      default:
        return MapPinned;
    }
  };

  const steps = [
    { id: "address", label: "Address" },
    { id: "payment", label: "Payment" },
    { id: "review", label: "Review" },
  ];

  const handlePlaceOrder = async () => {
    if (!address.firstname || !address.phone || !address.street || !address.city) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please fill all required fields",
      });
      return;
    }

    // Check if offline - only COD allowed offline
    if (isOffline && paymentMethod === "online") {
      Toast.show({
        type: "error",
        text1: "Offline Mode",
        text2: "Online payment not available offline. Please use Cash on Delivery.",
      });
      return;
    }

    // Handle WhatsApp order
    if (paymentMethod === "whatsapp") {
      try {
        setLoading(true);

        // Create WhatsApp order items
        const whatsappOrderItems = cart.map(item => ({
          productId: item.productId || "",
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          selectedWeight: item.selectedWeight,
          image: item.image,
        }));

        // Create delivery address object
        const deliveryAddr = {
          id: selectedAddressId || "",
          firstname: address.firstname,
          lastname: address.lastname,
          phone: address.phone,
          address: address.street,
          city: address.city,
          state: address.state,
          zip: address.pincode,
          label: "Home" as const,
          isDefault: false,
        };

        // Create WhatsApp order in Firebase FIRST
        const whatsappOrder = await createWhatsAppOrder({
          items: whatsappOrderItems,
          subtotal: cartTotals.subtotal,
          deliveryFee: deliveryResult.finalCharge,
          discount: cartTotals.totalDiscount,
          totalAmount: totalAmount,
          customerName: `${address.firstname} ${address.lastname}`.trim(),
          customerPhone: address.phone,
          deliveryAddress: deliveryAddr,
          deliveryNotes: "",
          paymentMethod: "cod",
          appliedOffers: cartTotals.appliedOffers.map(offer => ({
            offerId: offer.offerId,
            offerName: offer.offerName,
            offerType: offer.offerType,
            discountAmount: offer.discountAmount,
          })),
        });

        // Generate WhatsApp message
        const message = generateOrderMessage({
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            selectedWeight: item.selectedWeight,
          })),
          subtotal: cartTotals.subtotal,
          discount: cartTotals.totalDiscount,
          discountLabel: appliedCoupon?.couponCode || cartTotals.appliedOffers?.[0]?.offerName,
          deliveryFee: deliveryResult.finalCharge,
          total: totalAmount,
          customerName: `${address.firstname} ${address.lastname}`.trim(),
          customerPhone: address.phone,
          deliveryAddress: deliveryAddr,
          paymentMethod: "cod",
          notes: `Order ID: ${whatsappOrder.whatsappOrderId}`,
        });

        // Open WhatsApp
        const success = await sendWhatsAppMessage(message);

        if (success) {
          // Clear the cart after successful WhatsApp message
          await clearCart();

          Toast.show({
            type: "success",
            text1: "Order Sent!",
            text2: `Order ${whatsappOrder.whatsappOrderId} sent to WhatsApp`,
          });

          // Navigate to home or orders page
          router.replace("/(customer)/(tabs)");
        }

        setLoading(false);
        return;
      } catch (error) {
        console.error("WhatsApp order error:", error);
        setLoading(false);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to place WhatsApp order",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const orderItems = cart.map((item) => ({
        productId: item.productId || "",
        name: item.name || "",
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        selectedWeight: item.selectedWeight || "",
        image: item.image || "",
      }));

      // If offline, save order locally
      if (isOffline) {
        const offlineOrderId = `OFFLINE_${Date.now()}`;
        const offlineOrder: OfflineOrder = {
          id: offlineOrderId,
          orderId: offlineOrderId,
          items: orderItems,
          address: {
            firstname: address.firstname || "",
            lastname: address.lastname || "",
            phone: address.phone || "",
            street: address.street || "",
            city: address.city || "",
            state: address.state || "",
            pincode: address.pincode || "",
          },
          paymentMethod: "cod",
          totalAmount: Number(cartTotal) || 0,
          userId: user?.uid || "",
          userEmail: user?.email || "",
          status: "pending_sync",
          createdAt: Date.now(),
        };

        await offlineManager.saveOfflineOrder(offlineOrder);
        await clearCart();

        Toast.show({
          type: "info",
          text1: "Order Saved Offline",
          text2: "Your order will be synced when you're back online",
          props: { icon: "offline" },
        });

        setLoading(false);
        router.replace("/(customer)/(tabs)");
        return;
      }

      // Online flow - Validate stock before placing order
      const stockValidation = await validateCartStock(cart);

      if (!stockValidation.isValid) {
        const outOfStockNames = stockValidation.outOfStockItems.map((i) => i.name).join(", ");
        const insufficientNames = stockValidation.insufficientStockItems
          .map((i) => `${i.name} (only ${i.availableQty} left)`)
          .join(", ");

        let errorMessage = "";
        if (outOfStockNames) {
          errorMessage += `Out of stock: ${outOfStockNames}. `;
        }
        if (insufficientNames) {
          errorMessage += `Insufficient stock: ${insufficientNames}`;
        }

        Toast.show({
          type: "warning",
          text1: "Stock Issue",
          text2: errorMessage || "Some items are unavailable",
        });
        setLoading(false);
        return;
      }

      // Generate sequential order ID (ORD001, ORD002, etc.)
      const orderId = await generateOrderId();

      const orderData = {
        orderId: orderId,
        userId: user?.uid || "",
        userEmail: user?.email || "",
        items: orderItems,
        address: {
          firstname: address.firstname || "",
          lastname: address.lastname || "",
          phone: address.phone || "",
          street: address.street || "",
          city: address.city || "",
          state: address.state || "",
          pincode: address.pincode || "",
        },
        paymentMethod: paymentMethod || "cod",
        subtotal: cartTotals.subtotal,
        discount: cartTotals.totalDiscount,
        deliveryFee: deliveryResult.finalCharge,
        totalAmount: totalAmount,
        status: paymentMethod === "online" ? "PendingPayment" : "OrderPlaced",
        paymentStatus: paymentMethod === "online" ? "pending" : "cod",
        createdAt: serverTimestamp(),
        // Applied offers & coupons
        appliedOffers: cartTotals.appliedOffers.map((offer) => ({
          offerId: offer.offerId,
          offerName: offer.offerName,
          offerType: offer.offerType,
          discountAmount: offer.discountAmount,
        })),
        appliedCoupon: appliedCoupon ? {
          couponId: appliedCoupon.id,
          couponCode: appliedCoupon.couponCode,
          discountAmount: couponDiscount?.discountAmount || 0,
        } : null,
        totalDiscount: cartTotals.totalDiscount,
        // Delivery audit trail
        deliveryDetails: {
          calculatedAt: serverTimestamp(),
          configSnapshot: {
            isEnabled: deliveryEnabled,
            defaultCharge: deliveryConfig?.defaultCharge || 0,
            zoneId: deliveryResult.zone?.id || null,
            zoneName: deliveryResult.zone?.name || null,
          },
          inputData: {
            pincode: address.pincode || "",
            orderValue: cartTotals.total,
          },
          result: {
            baseCharge: deliveryResult.baseCharge,
            discount: deliveryResult.discount,
            additionalCharges: deliveryResult.additionalCharges,
            finalCharge: deliveryResult.finalCharge,
            isFree: deliveryResult.isFree,
            appliedRules: deliveryResult.appliedRules,
            message: deliveryResult.message,
          },
        },
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);

      if (paymentMethod === "online") {
        // Validate amount before opening Razorpay
        if (totalAmount < 1) {
          Toast.show({
            type: "error",
            text1: "Invalid Amount",
            text2: "Order total must be at least ₹1",
          });
          setLoading(false);
          return;
        }

        setPendingOrderId(docRef.id);
        setShowRazorpay(true);
        setLoading(false);
      } else {
        // Reduce stock for COD orders
        const stockResult = await reduceStockAfterOrder(
          orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            name: item.name,
          })),
          docRef.id,
          user?.uid || ""
        );

        if (!stockResult.success) {
          console.error("Stock reduction failed:", stockResult.error);
          // Order is already placed, just log the error
        }

        // Log applied offers for analytics
        if (cartTotals.appliedOffers.length > 0) {
          await logAppliedOffers(
            docRef.id,
            orderId,
            cartTotals.appliedOffers,
            cartWithOffers
          );
        }

        await clearCart();

        Toast.show({
          type: "success",
          text1: "Order Placed!",
          text2: `Order ${orderId} has been placed successfully`,
          props: { icon: "truck" },
        });

        router.replace(`/(customer)/orders/${docRef.id}`);
      }
    } catch (error) {
      console.error("Order error:", error);
      Toast.show({
        type: "error",
        text1: "Order Failed",
        text2: "Failed to place order. Please try again.",
      });
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response: RazorpayResponse) => {
    setShowRazorpay(false);
    setLoading(true);

    try {
      // Validate the payment response first
      const validation = validateRazorpayResponse(response);
      if (!validation.isValid) {
        Toast.show({
          type: "error",
          text1: "Payment Verification Failed",
          text2: validation.error || "Invalid payment response",
        });
        // Update order to failed status
        if (pendingOrderId) {
          try {
            await updateDoc(doc(db, "orders", pendingOrderId), {
              status: "PaymentFailed",
              paymentStatus: "failed",
              paymentError: validation.error,
            });
          } catch (e) {
            console.error("Failed to update order status:", e);
          }
        }
        setLoading(false);
        setPendingOrderId(null);
        return;
      }

      if (pendingOrderId) {
        // Build payment details object, excluding undefined values
        const paymentDetails: Record<string, string> = {
          razorpay_payment_id: response.razorpay_payment_id || "",
        };

        // Only add these fields if they exist (they may be undefined in test mode)
        if (response.razorpay_order_id) {
          paymentDetails.razorpay_order_id = response.razorpay_order_id;
        }
        if (response.razorpay_signature) {
          paymentDetails.razorpay_signature = response.razorpay_signature;
        }

        await updateDoc(doc(db, "orders", pendingOrderId), {
          status: "OrderPlaced",
          paymentStatus: "paid",
          paymentId: response.razorpay_payment_id || "",
          paymentDetails,
          paidAt: serverTimestamp(),
        });

        // Reduce stock after successful online payment
        const stockResult = await reduceStockAfterOrder(
          cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            name: item.name,
          })),
          pendingOrderId,
          user?.uid || ""
        );

        if (!stockResult.success) {
          console.error("Stock reduction failed:", stockResult.error);
          // Payment is successful, order is placed, just log the error
        }

        // Log applied offers for analytics
        if (cartTotals.appliedOffers.length > 0) {
          await logAppliedOffers(
            pendingOrderId,
            pendingOrderId, // Will be updated with proper order number
            cartTotals.appliedOffers,
            cartWithOffers
          );
        }

        await clearCart();

        Toast.show({
          type: "success",
          text1: "Payment Successful!",
          text2: "Your order has been placed successfully",
          props: { icon: "truck" },
        });

        router.replace(`/(customer)/orders/${pendingOrderId}`);
      }
    } catch (error) {
      console.error("Payment update error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Payment received but failed to update order. Please contact support.",
      });
    } finally {
      setLoading(false);
      setPendingOrderId(null);
    }
  };

  const handlePaymentFailure = async (error: string) => {
    setShowRazorpay(false);

    const errorMessage = getRazorpayErrorMessage(error);

    if (pendingOrderId) {
      try {
        await updateDoc(doc(db, "orders", pendingOrderId), {
          status: "PaymentFailed",
          paymentStatus: "failed",
          paymentError: errorMessage,
          failedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("Failed to update order status:", e);
      }
    }

    Toast.show({
      type: "error",
      text1: "Payment Failed",
      text2: errorMessage,
    });

    setPendingOrderId(null);
  };

  const handlePaymentClose = () => {
    setShowRazorpay(false);

    if (pendingOrderId) {
      Toast.show({
        type: "info",
        text1: "Payment Cancelled",
        text2: "You can retry payment from your orders",
      });
    }

    setPendingOrderId(null);
  };

  const getRazorpayOptions = () => {
    return createRazorpayOptions(
      totalAmount,
      pendingOrderId || "temp",
      `${address.firstname} ${address.lastname}`.trim(),
      user?.email || "",
      address.phone
    );
  };

  const renderStepIndicator = () => (
    <View className="flex-row items-center justify-center py-4 px-6 bg-white">
      {steps.map((step, index) => (
        <View key={step.id} className="flex-row items-center">
          <View
            className={`w-8 h-8 rounded-full items-center justify-center ${
              currentStep === step.id
                ? "bg-primary"
                : steps.indexOf(steps.find((s) => s.id === currentStep)!) > index
                ? "bg-primary"
                : "bg-gray-200"
            }`}
          >
            {steps.indexOf(steps.find((s) => s.id === currentStep)!) > index ? (
              <Check size={16} color="#fff" />
            ) : (
              <Text
                className={`font-bold ${
                  currentStep === step.id ? "text-white" : "text-gray-500"
                }`}
              >
                {index + 1}
              </Text>
            )}
          </View>
          <Text
            className={`ml-2 font-medium ${
              currentStep === step.id ? "text-primary" : "text-gray-500"
            }`}
          >
            {step.label}
          </Text>
          {index < steps.length - 1 && (
            <View className="w-8 h-0.5 mx-2 bg-gray-200" />
          )}
        </View>
      ))}
    </View>
  );

  const renderAddressStep = () => (
    <KeyboardAwareScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: 20 }}
      enableOnAndroid={true}
      extraScrollHeight={120}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800 mb-4">
          Delivery Address
        </Text>

        {/* Saved Addresses Section */}
        {addresses.length > 0 && (
          <Pressable
            onPress={() => setShowAddressPicker(true)}
            className="bg-white rounded-xl p-4 mb-4 flex-row items-center border-2 border-primary"
          >
            <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center">
              <MapPin size={24} color="#1D5A34" />
            </View>
            <View className="flex-1 ml-3">
              {selectedAddressId ? (
                <>
                  <Text className="text-gray-800 font-semibold">
                    {address.firstname} {address.lastname}
                  </Text>
                  <Text className="text-gray-500 text-sm" numberOfLines={1}>
                    {address.street}, {address.city}
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-gray-800 font-semibold">Select Saved Address</Text>
                  <Text className="text-gray-500 text-sm">Tap to choose from your addresses</Text>
                </>
              )}
            </View>
            <View className="bg-primary px-3 py-1.5 rounded-lg">
              <Text className="text-white font-semibold text-sm">Change</Text>
            </View>
          </Pressable>
        )}

        {/* Add New Address Link */}
        {addresses.length === 0 && (
          <Pressable
            onPress={() => router.push("/(customer)/addresses/add")}
            className="bg-white rounded-xl p-4 mb-4 flex-row items-center border-2 border-dashed border-gray-300"
          >
            <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
              <Plus size={24} color="#6B7280" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-gray-800 font-semibold">Add New Address</Text>
              <Text className="text-gray-500 text-sm">Save address for faster checkout</Text>
            </View>
          </Pressable>
        )}

        {/* Manual Entry Form */}
        <View className="bg-white rounded-xl p-4">
          <Text className="text-gray-600 font-semibold mb-3">
            {selectedAddressId ? "Delivery Details" : "Enter Address Manually"}
          </Text>

          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <Text className="text-gray-600 font-medium mb-2">First Name *</Text>
              <TextInput
                value={address.firstname}
                onChangeText={(text) => setAddress({ ...address, firstname: text })}
                placeholder="John"
                placeholderTextColor="#9CA3AF"
                style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#F9FAFB", fontSize: 15, color: "#1F2937" }}
              />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-gray-600 font-medium mb-2">Last Name</Text>
              <TextInput
                value={address.lastname}
                onChangeText={(text) => setAddress({ ...address, lastname: text })}
                placeholder="Doe"
                placeholderTextColor="#9CA3AF"
                style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#F9FAFB", fontSize: 15, color: "#1F2937" }}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-gray-600 font-medium mb-2">Phone Number *</Text>
            <TextInput
              value={address.phone}
              onChangeText={(text) => setAddress({ ...address, phone: text.replace(/[^0-9]/g, "") })}
              placeholder="8940450960"
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor="#9CA3AF"
              style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#F9FAFB", fontSize: 15, color: "#1F2937" }}
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-600 font-medium mb-2">Street Address *</Text>
            <TextInput
              value={address.street}
              onChangeText={(text) => setAddress({ ...address, street: text })}
              placeholder="House/Flat No, Building, Street, Area"
              multiline
              placeholderTextColor="#9CA3AF"
              style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#F9FAFB", fontSize: 15, color: "#1F2937", minHeight: 70, textAlignVertical: "top" }}
            />
          </View>

          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <Text className="text-gray-600 font-medium mb-2">City *</Text>
              <TextInput
                value={address.city}
                onChangeText={(text) => setAddress({ ...address, city: text })}
                placeholder="Chennai"
                placeholderTextColor="#9CA3AF"
                style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#F9FAFB", fontSize: 15, color: "#1F2937" }}
              />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-gray-600 font-medium mb-2">State</Text>
              <TextInput
                value={address.state}
                onChangeText={(text) => setAddress({ ...address, state: text })}
                placeholder="Tamil Nadu"
                placeholderTextColor="#9CA3AF"
                style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#F9FAFB", fontSize: 15, color: "#1F2937" }}
              />
            </View>
          </View>

          <View className="mb-2">
            <Text className="text-gray-600 font-medium mb-2">Pincode</Text>
            <TextInput
              value={address.pincode}
              onChangeText={(text) => setAddress({ ...address, pincode: text.replace(/[^0-9]/g, "") })}
              placeholder="600001"
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor="#9CA3AF"
              style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#F9FAFB", fontSize: 15, color: "#1F2937" }}
            />
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );

  const renderPaymentStep = () => (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800 mb-4">
          Payment Method
        </Text>

        <View className="bg-white rounded-xl overflow-hidden">
          <Pressable
            onPress={() => setPaymentMethod("cod")}
            className={`flex-row items-center p-4 border-b border-gray-100 ${
              paymentMethod === "cod" ? "bg-primary/5" : ""
            }`}
          >
            <View
              className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center ${
                paymentMethod === "cod" ? "border-primary bg-primary" : "border-gray-300"
              }`}
            >
              {paymentMethod === "cod" && <Check size={14} color="#fff" />}
            </View>
            <Truck size={24} color={paymentMethod === "cod" ? "#1D5A34" : "#6B7280"} />
            <View className="ml-4 flex-1">
              <Text className={`font-semibold ${paymentMethod === "cod" ? "text-primary" : "text-gray-800"}`}>
                Cash on Delivery
              </Text>
              <Text className="text-gray-500 text-sm">Pay when you receive</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setPaymentMethod("online")}
            className={`flex-row items-center p-4 border-b border-gray-100 ${
              paymentMethod === "online" ? "bg-primary/5" : ""
            }`}
          >
            <View
              className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center ${
                paymentMethod === "online" ? "border-primary bg-primary" : "border-gray-300"
              }`}
            >
              {paymentMethod === "online" && <Check size={14} color="#fff" />}
            </View>
            <CreditCard size={24} color={paymentMethod === "online" ? "#1D5A34" : "#6B7280"} />
            <View className="ml-4 flex-1">
              <View className="flex-row items-center">
                <Text className={`font-semibold ${paymentMethod === "online" ? "text-primary" : "text-gray-800"}`}>
                  Online Payment
                </Text>
                {RAZORPAY_TEST_MODE && (
                  <View className="bg-yellow-100 px-2 py-0.5 rounded ml-2">
                    <Text className="text-yellow-700 text-xs font-medium">TEST</Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-500 text-sm">UPI, Cards, Net Banking</Text>
            </View>
          </Pressable>

          <WhatsAppPaymentOption
            selected={paymentMethod === "whatsapp"}
            onSelect={() => setPaymentMethod("whatsapp")}
          />
        </View>

        {/* Test Mode Info */}
        {RAZORPAY_TEST_MODE && paymentMethod === "online" && (
          <View className="bg-yellow-50 mx-4 mt-4 p-4 rounded-xl border border-yellow-200">
            <Text className="text-yellow-800 font-semibold mb-1">Test Mode Active</Text>
            <Text className="text-yellow-700 text-sm">
              Use test card: 4111 1111 1111 1111{"\n"}
              Expiry: Any future date | CVV: Any 3 digits
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderReviewStep = () => (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="p-4">
        {/* Delivery Address */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <MapPin size={20} color="#1D5A34" />
            <Text className="ml-2 font-bold text-gray-800">Delivery Address</Text>
          </View>
          <Text className="text-gray-800 font-medium">
            {address.firstname} {address.lastname}
          </Text>
          <Text className="text-gray-500">{address.phone}</Text>
          <Text className="text-gray-500 mt-1">
            {address.street}, {address.city}
          </Text>
          <Text className="text-gray-500">
            {address.state} - {address.pincode}
          </Text>
        </View>

        {/* Payment Method */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row items-center mb-3">
            {paymentMethod === "whatsapp" ? (
              <MessageCircle size={20} color="#25D366" />
            ) : (
              <CreditCard size={20} color="#1D5A34" />
            )}
            <Text className="ml-2 font-bold text-gray-800">Payment Method</Text>
          </View>
          <Text className={`font-medium ${paymentMethod === "whatsapp" ? "text-green-600" : "text-gray-700"}`}>
            {paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod === "whatsapp" ? "Order via WhatsApp" : "Online Payment"}
          </Text>
        </View>

        {/* Order Items */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="font-bold text-gray-800 mb-3">
            Order Items ({cartCount})
          </Text>
          {cart.map((item, index) => (
            <View key={`${item.id}-${index}`} className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0">
              <View className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                {item.image ? (
                  <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <ShoppingBag size={20} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-gray-800 font-medium" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {item.selectedWeight} x {item.quantity}
                </Text>
              </View>
              <Text className="font-bold text-primary">
                {formatCurrency(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Coupon Section */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="font-bold text-gray-800 mb-3">Apply Coupon</Text>
          <CouponInput />
        </View>

        {/* Order Summary */}
        <View className="bg-white rounded-xl p-4">
          <Text className="font-bold text-gray-800 mb-3">Order Summary</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Subtotal</Text>
            <Text className="font-medium">{formatCurrency(cartTotals.subtotal)}</Text>
          </View>
          {/* Show applied offers/discounts */}
          {cartTotals.totalDiscount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-green-600">Discount</Text>
              <Text className="font-medium text-green-600">
                -{formatCurrency(cartTotals.totalDiscount)}
              </Text>
            </View>
          )}
          {/* Show individual applied offers */}
          {cartTotals.appliedOffers.map((offer, index) => (
            <View key={index} className="flex-row justify-between mb-1 pl-4">
              <Text className="text-gray-400 text-sm">{offer.offerName}</Text>
              <Text className="text-green-600 text-sm">
                -{formatCurrency(offer.discountAmount)}
              </Text>
            </View>
          ))}
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Delivery Fee</Text>
            <Text className={`font-medium ${deliveryResult.isFree ? 'text-primary' : 'text-gray-800'}`}>
              {deliveryResult.isFree ? 'Free' : formatCurrency(deliveryResult.finalCharge)}
            </Text>
          </View>
          {/* Show delivery zone info if applicable */}
          {deliveryResult.zone && !deliveryResult.isFree && (
            <View className="flex-row items-center mb-2">
              <Info size={14} color="#6B7280" />
              <Text className="text-gray-500 text-sm ml-1">
                Zone: {deliveryResult.zone.name}
              </Text>
            </View>
          )}
          {/* Show free delivery message */}
          {!deliveryResult.isFree && deliveryResult.zone?.freeDeliveryThreshold && cartTotals.total < deliveryResult.zone.freeDeliveryThreshold && (
            <View className="bg-green-50 rounded-lg p-2 mb-2">
              <Text className="text-green-700 text-sm">
                Add {formatCurrency(deliveryResult.zone.freeDeliveryThreshold - cartTotals.total)} for free delivery
              </Text>
            </View>
          )}
          <View className="flex-row justify-between pt-3 border-t border-gray-100">
            <Text className="text-lg font-bold text-gray-800">Total</Text>
            <Text className="text-lg font-bold text-primary">
              {formatCurrency(totalAmount)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "address":
        return renderAddressStep();
      case "payment":
        return renderPaymentStep();
      case "review":
        return renderReviewStep();
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (currentStep === "address") {
      if (!address.firstname || !address.phone || !address.street || !address.city) {
        Toast.show({
          type: "error",
          text1: "Missing Information",
          text2: "Please fill all required fields",
        });
        return;
      }
      setCurrentStep("payment");
    } else if (currentStep === "payment") {
      setCurrentStep("review");
    }
  };

  const handleBack = () => {
    if (currentStep === "payment") {
      setCurrentStep("address");
    } else if (currentStep === "review") {
      setCurrentStep("payment");
    } else {
      router.back();
    }
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#1D5A34" }} edges={["top"]}>
        <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-200">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-800">Checkout</Text>
        </View>
        <View className="flex-1 items-center justify-center px-4">
          <ShoppingBag size={64} color="#9CA3AF" />
          <Text className="text-xl font-semibold text-gray-800 mt-4">Cart is empty</Text>
          <Text className="text-gray-500 mt-2">Add items to proceed with checkout</Text>
          <Pressable
            onPress={() => router.push("/(customer)/(tabs)/shop")}
            className="bg-primary px-6 py-3 rounded-xl mt-6"
          >
            <Text className="text-white font-semibold">Browse Products</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1D5A34" }} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />
      {/* Header */}
      <LinearGradient
        colors={["#1D5A34", "#164829"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable
              onPress={handleBack}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </Pressable>
            <Text className="text-xl font-bold text-white">Checkout</Text>
          </View>
          <Image source={Logo} style={{ width: 40, height: 40, tintColor: '#FFFFFF' }} resizeMode="contain" />
        </View>
      </LinearGradient>

      {/* Offline Banner */}
      {isOffline && <OfflineBanner />}

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Current Step Content */}
      {renderCurrentStep()}

      {/* Bottom Button */}
      <View
        className="bg-white px-4 pt-4 border-t border-gray-100"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          onPress={currentStep === "review" ? handlePlaceOrder : handleNext}
          disabled={loading}
          className="py-4 rounded-xl"
          style={{
            backgroundColor: currentStep === "review" && paymentMethod === "whatsapp" ? "#25D366" : "#1D5A34",
            shadowColor: currentStep === "review" && paymentMethod === "whatsapp" ? "#25D366" : "#1D5A34",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              {currentStep === "review"
                ? paymentMethod === "whatsapp"
                  ? "Order via WhatsApp"
                  : `Place Order - ${formatCurrency(totalAmount)}`
                : "Continue"}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Address Picker Modal */}
      <Modal
        visible={showAddressPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setShowAddressPicker(false)}
        >
          <Pressable
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
            style={{ maxHeight: "80%" }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View className="items-center py-3">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-800">Select Address</Text>
              <Pressable onPress={() => setShowAddressPicker(false)}>
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Search Bar */}
            <View className="px-4 py-3">
              <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                <Search size={20} color="#9CA3AF" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by name, address, phone..."
                  placeholderTextColor="#9CA3AF"
                  style={{ flex: 1, marginLeft: 12, fontSize: 15, color: "#1F2937" }}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery("")}>
                    <X size={18} color="#9CA3AF" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Address List */}
            <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
              {addressesLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#1D5A34" />
                </View>
              ) : filteredAddresses.length === 0 ? (
                <View className="items-center py-8">
                  <MapPin size={40} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">
                    {searchQuery ? "No addresses found" : "No saved addresses"}
                  </Text>
                </View>
              ) : (
                filteredAddresses.map((addr, index) => {
                  const LabelIcon = getLabelIcon(addr.label);
                  const isSelected = selectedAddressId === addr.id;

                  return (
                    <Pressable
                      key={`${addr.id}-${index}`}
                      onPress={() => selectAddress(addr)}
                      className={`flex-row items-start p-4 mb-3 rounded-xl border-2 ${
                        isSelected ? "border-primary bg-primary/5" : "border-gray-100 bg-white"
                      }`}
                    >
                      <View
                        className={`w-10 h-10 rounded-full items-center justify-center ${
                          isSelected ? "bg-primary/20" : "bg-gray-100"
                        }`}
                      >
                        <LabelIcon size={18} color={isSelected ? "#1D5A34" : "#6B7280"} />
                      </View>

                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center">
                          <Text className={`font-bold ${isSelected ? "text-primary" : "text-gray-800"}`}>
                            {addr.label || "Address"}
                          </Text>
                          {addr.isDefault && (
                            <View className="flex-row items-center ml-2 bg-primary/10 px-2 py-0.5 rounded-full">
                              <CheckCircle size={10} color="#1D5A34" />
                              <Text className="text-primary text-xs ml-1">Default</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-700 font-medium mt-1">
                          {addr.firstname} {addr.lastname}
                        </Text>
                        <Text className="text-gray-500 text-sm">{addr.phone}</Text>
                        <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                          {addr.address}, {addr.city}, {addr.state} - {addr.zip}
                        </Text>
                      </View>

                      {isSelected && (
                        <View className="w-6 h-6 bg-primary rounded-full items-center justify-center">
                          <Check size={14} color="#fff" />
                        </View>
                      )}
                    </Pressable>
                  );
                })
              )}

              {/* Add New Address Button */}
              <Pressable
                onPress={() => {
                  setShowAddressPicker(false);
                  router.push("/(customer)/addresses/add");
                }}
                className="flex-row items-center justify-center py-4 mb-6 border-2 border-dashed border-gray-300 rounded-xl"
              >
                <Plus size={20} color="#6B7280" />
                <Text className="text-gray-600 font-semibold ml-2">Add New Address</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Razorpay Checkout Modal */}
      {showRazorpay && (
        <RazorpayCheckout
          visible={showRazorpay}
          options={getRazorpayOptions()}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          onClose={handlePaymentClose}
        />
      )}
    </SafeAreaView>
  );
}
