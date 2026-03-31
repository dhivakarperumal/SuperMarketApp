import { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  Switch,
  Modal,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Camera,
  Scan,
  Plus,
  Minus,
  Trash2,
  Printer,
  ShoppingBag,
  Check,
  Banknote,
  CreditCard,
  Smartphone,
  LogOut,
  Truck,
  Ticket,
  Tag,
  X,
  MapPin,
  ChevronRight,
  Home,
  Briefcase,
  MapPinned,
  Search,
} from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import Toast from "react-native-toast-message";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../../../src/services/firebase/config";
import { useProducts } from "../../../src/hooks/useProducts";
import { useAddresses } from "../../../src/hooks/useAddresses";
import { usePrinter } from "../../../src/context/PrinterContext";
import { SavedAddress } from "../../../src/types";
import { useAuth } from "../../../src/context/AuthContext";
import { usePermissions } from "../../../src/context/PermissionContext";
import { useDeliveryConfig } from "../../../src/context/DeliveryConfigContext";
import { formatCurrency } from "../../../src/utils/formatters";
import { RazorpayCheckout } from "../../../src/components/RazorpayCheckout";
import {
  createRazorpayOptions,
  RazorpayResponse,
  validateRazorpayResponse,
  getRazorpayErrorMessage,
  RAZORPAY_TEST_MODE,
} from "../../../src/services/razorpay/config";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";
import { useOffers } from "../../../src/context/OfferContext";
import { Offer, AppliedOfferSummary } from "../../../src/types/offers";
import { calculateCartWithOffersAndCoupon, validateCoupon } from "../../../src/services/offers/OfferEngine";
import { useReceiptSettings } from "../../../src/hooks/useReceiptSettings";

interface BillingItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedWeight?: string;
  image?: string;
}

export default function BillingScreen() {
  const insets = useSafeAreaInsets();
  const { products } = useProducts();
  const { addresses, loading: addressesLoading } = useAddresses();
  const { isConnected, printReceipt } = usePrinter();
  const { logout, userProfile } = useAuth();
  const { isCashier } = usePermissions();
  const { activeOffers } = useOffers();
  const { settings: receiptSettings } = useReceiptSettings();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [cart, setCart] = useState<BillingItem[]>([]);
  const [manualCode, setManualCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Online">("Cash");
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [pendingAction, setPendingAction] = useState<"complete" | "print" | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string>("");

  // Address selection
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [customer, setCustomer] = useState({
    firstname: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const printerSheetRef = useRef<BottomSheet>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Auto-select default address
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
    setCustomer({
      firstname: `${addr.firstname} ${addr.lastname || ""}`.trim(),
      phone: addr.phone,
      street: addr.address,
      city: addr.city,
      state: addr.state,
      pincode: addr.zip,
    });
    setShowAddressPicker(false);
  };

  const filteredAddresses = addresses.filter((addr) => {
    const query = addressSearchQuery.toLowerCase();
    return (
      addr.firstname.toLowerCase().includes(query) ||
      (addr.lastname?.toLowerCase().includes(query) ?? false) ||
      addr.address.toLowerCase().includes(query) ||
      addr.city.toLowerCase().includes(query) ||
      addr.phone.includes(query)
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

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Offer | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Delivery
  const { calculateCharge, isEnabled: deliveryEnabled, config: deliveryConfig } = useDeliveryConfig();
  const [includeDelivery, setIncludeDelivery] = useState(false);

  // Calculate delivery charge when delivery is enabled and pincode is provided
  const deliveryResult = useMemo(() => {
    if (!includeDelivery || !deliveryEnabled || !customer.pincode) {
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
      pincode: customer.pincode,
      orderValue: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    });
  }, [includeDelivery, deliveryEnabled, customer.pincode, cart, calculateCharge]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanning) return;
    setScanning(false);

    const scannedCode = data.trim().toUpperCase();

    // Search by productId (primary), barcode, or document id
    const product = products.find((p) => {
      const productId = p.productId?.trim().toUpperCase();
      const barcode = p.barcode?.trim().toUpperCase();
      const docId = p.id?.toUpperCase();

      return (
        productId === scannedCode ||
        barcode === scannedCode ||
        docId === scannedCode ||
        // Also check if scanned code contains the productId (for longer barcodes)
        scannedCode.includes(productId || '') ||
        (productId && productId.includes(scannedCode))
      );
    });

    if (product) {
      addToCart(product);
      Toast.show({
        type: "success",
        text1: "Product Added",
        text2: `${product.name} (${product.productId})`,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Not Found",
        text2: `Product with code "${data}" not found`,
      });
    }
  };

  const handleManualSearch = () => {
    if (!manualCode.trim()) return;

    const searchTerm = manualCode.trim().toUpperCase();

    // Search by productId (primary), barcode, or name
    const product = products.find((p) => {
      const productId = p.productId?.trim().toUpperCase();
      const barcode = p.barcode?.trim().toUpperCase();
      const name = p.name?.toLowerCase();

      return (
        productId === searchTerm ||
        barcode === searchTerm ||
        name?.includes(manualCode.toLowerCase()) ||
        // Partial match for productId (e.g., "001" matches "SP001")
        (productId && productId.includes(searchTerm))
      );
    });

    if (product) {
      addToCart(product);
      setManualCode("");
      Toast.show({
        type: "success",
        text1: "Product Added",
        text2: `${product.name} (${product.productId})`,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Not Found",
        text2: `Product "${manualCode}" not found`,
      });
    }
  };

  const addToCart = (product: any) => {
    const firstPrice = product.prices
      ? Object.values(product.prices)[0]
      : product.price || 0;
    const firstWeight = product.weights?.[0] || null;

    const existingIndex = cart.findIndex(
      (item) => item.productId === product.id && item.selectedWeight === firstWeight
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          id: `${product.id}_${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: firstPrice as number,
          quantity: 1,
          selectedWeight: firstWeight,
          image: product.images?.[0],
        },
      ]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setCart(
      cart.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setShowClearCartModal(true);
  };

  const confirmClearCart = () => {
    setCart([]);
    setShowClearCartModal(false);
  };

  // Calculate cart with offers
  const cartWithOffers = useMemo(() => {
    if (cart.length === 0) {
      return {
        itemsWithOffers: [],
        totals: {
          subtotal: 0,
          totalDiscount: 0,
          total: 0,
          freeItems: [],
          appliedOffers: [],
        },
        couponDiscount: null,
      };
    }

    const cartItems = cart.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      selectedWeight: item.selectedWeight,
      image: item.image,
    }));

    return calculateCartWithOffersAndCoupon(cartItems, activeOffers, appliedCoupon);
  }, [cart, activeOffers, appliedCoupon]);

  const cartSubtotal = cartWithOffers.totals.subtotal;
  const cartDiscount = cartWithOffers.totals.totalDiscount;
  const cartAfterDiscount = cartWithOffers.totals.total;

  const deliveryCharge = includeDelivery ? deliveryResult.finalCharge : 0;
  const cartTotal = cartAfterDiscount + deliveryCharge;

  // Apply coupon
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    const result = validateCoupon(
      couponCode,
      activeOffers,
      cartSubtotal,
      0,
      false
    );

    if (result.isValid && result.coupon) {
      setAppliedCoupon(result.coupon);
      setCouponError(null);
      setCouponCode("");
      Toast.show({
        type: "success",
        text1: "Coupon Applied",
        text2: `${result.coupon.name} - Save ${formatCurrency(result.discountAmount || 0)}`,
      });
    } else {
      setCouponError(result.error || "Invalid coupon");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Generate next order ID (ORD001, ORD002, etc.)
  const generateOrderId = async (): Promise<string> => {
    try {
      const snapshot = await getDocs(collection(db, "orders"));
      let maxNumber = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const orderId = data.orderId || "";
        // Match orders like ORD001, ORD002
        const match = orderId.match(/^ORD(\d{1,4})$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });

      const nextNumber = maxNumber + 1;
      return `ORD${nextNumber.toString().padStart(3, "0")}`;
    } catch (error) {
      return `ORD001`;
    }
  };

  // Save order to Firebase
  const saveOrder = async (orderId: string, printed: boolean, razorpayId?: string) => {
    try {
      const orderData: any = {
        orderId,
        userId: "POS", // POS sale - no user
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          selectedWeight: item.selectedWeight || null,
          image: item.image || null,
        })),
        status: "Delivered", // POS billing - direct delivery
        totalAmount: cartTotal,
        subtotal: cartSubtotal,
        deliveryFee: deliveryCharge,
        discount: cartDiscount,
        totalDiscount: cartDiscount,
        paymentMethod: paymentMethod,
        // Applied offers
        appliedOffers: cartWithOffers.totals.appliedOffers.map((offer: AppliedOfferSummary) => ({
          offerId: offer.offerId,
          offerName: offer.offerName,
          offerType: offer.offerType,
          discountAmount: offer.discountAmount,
        })),
        appliedCoupon: appliedCoupon
          ? {
              couponId: appliedCoupon.id,
              couponCode: appliedCoupon.couponCode,
              discountAmount: cartWithOffers.couponDiscount?.discountAmount || 0,
            }
          : null,
        orderType: "POS", // Mark as POS order
        printed,
        createdAt: serverTimestamp(),
        // Customer address (same structure as online orders)
        address: {
          firstname: customer.firstname.trim() || "Walk-in Customer",
          phone: customer.phone.trim() || "",
          street: customer.street.trim() || "",
          city: customer.city.trim() || "",
          state: customer.state.trim() || "",
          pincode: customer.pincode.trim() || "",
        },
        // Delivery details for audit (if delivery included)
        ...(includeDelivery && customer.pincode && {
          deliveryDetails: {
            calculatedAt: serverTimestamp(),
            configSnapshot: {
              isEnabled: deliveryEnabled,
              defaultCharge: deliveryConfig?.defaultCharge || 0,
              zoneId: deliveryResult.zone?.id || null,
              zoneName: deliveryResult.zone?.name || null,
            },
            inputData: {
              pincode: customer.pincode,
              orderValue: cartSubtotal,
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
        }),
      };

      // Add Razorpay payment ID if available
      if (razorpayId) {
        orderData.razorpayPaymentId = razorpayId;
        orderData.paymentStatus = "Paid";
      } else {
        orderData.paymentStatus = paymentMethod === "Cash" ? "Paid" : "Pending";
      }

      await addDoc(collection(db, "orders"), orderData);
      return true;
    } catch (error) {
      console.error("Error saving order:", error);
      return false;
    }
  };

  const handleCompleteSale = async () => {
    // Validate cart is not empty
    if (cart.length === 0) {
      Toast.show({
        type: "error",
        text1: "Empty Cart",
        text2: "Please add items to the cart",
      });
      return;
    }

    // Validate amount for online payment
    if (paymentMethod === "Online" && cartTotal < 1) {
      Toast.show({
        type: "error",
        text1: "Invalid Amount",
        text2: "Order total must be at least ₹1 for online payment",
      });
      return;
    }

    const orderId = await generateOrderId();
    setCurrentOrderId(orderId);

    // If Online, open Razorpay
    if (paymentMethod === "Online") {
      setPendingAction("complete");
      setShowRazorpay(true);
      return;
    }

    // Cash payment - complete directly
    await completeSale(orderId, false);
  };

  const handlePrintReceipt = async () => {
    if (!isConnected) {
      Toast.show({
        type: "error",
        text1: "Printer Not Connected",
        text2: "Please connect a printer first",
      });
      return;
    }

    // Validate cart is not empty
    if (cart.length === 0) {
      Toast.show({
        type: "error",
        text1: "Empty Cart",
        text2: "Please add items to the cart",
      });
      return;
    }

    // Validate amount for online payment
    if (paymentMethod === "Online" && cartTotal < 1) {
      Toast.show({
        type: "error",
        text1: "Invalid Amount",
        text2: "Order total must be at least ₹1 for online payment",
      });
      return;
    }

    const orderId = await generateOrderId();
    setCurrentOrderId(orderId);

    // If Online, open Razorpay
    if (paymentMethod === "Online") {
      setPendingAction("print");
      setShowRazorpay(true);
      return;
    }

    // Cash payment - print directly
    await printAndSave(orderId);
  };

  // Clear all fields after sale
  const clearAllFields = () => {
    setCart([]);
    setPaymentMethod("Cash");
    setIncludeDelivery(false);
    // Reset to default address if available
    const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0];
    if (defaultAddress) {
      selectAddress(defaultAddress);
    } else {
      setSelectedAddressId(null);
      setCustomer({
        firstname: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
      });
    }
    // Clear coupon
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };

  // Complete sale after payment
  const completeSale = async (orderId: string, printed: boolean, razorpayId?: string) => {
    const saved = await saveOrder(orderId, printed, razorpayId);

    if (saved) {
      Toast.show({
        type: "success",
        text1: "Sale Completed",
        text2: `Order ${orderId} - ${formatCurrency(cartTotal)}`,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save order",
      });
    }
    clearAllFields();
  };

  // Print and save after payment
  const printAndSave = async (orderId: string, razorpayId?: string) => {
    try {
      await printReceipt(
        {
          orderId,
          items: cart,
          totals: {
            subtotal: cartSubtotal,
            discount: cartDiscount,
            tax: 0,
            delivery: deliveryCharge,
            total: cartTotal,
          },
          paymentMethod: paymentMethod,
          customer: {
            name: customer.firstname.trim() || "Walk-in Customer",
            phone: customer.phone.trim() || undefined,
          },
          deliveryDetails: includeDelivery ? {
            zoneName: deliveryResult.zone?.name,
            message: deliveryResult.message,
          } : undefined,
          appliedOffers: cartWithOffers.totals.appliedOffers.length > 0
            ? cartWithOffers.totals.appliedOffers.map((o: AppliedOfferSummary) => o.offerName)
            : undefined,
          couponCode: appliedCoupon?.couponCode || undefined,
        },
        receiptSettings
      );

      await saveOrder(orderId, true, razorpayId);

      Toast.show({
        type: "success",
        text1: "Printed & Saved",
        text2: `Order ${orderId} - ${formatCurrency(cartTotal)}`,
      });

      clearAllFields();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Print Failed",
        text2: "Failed to print receipt",
      });
    }
  };

  // Razorpay success handler
  const handleRazorpaySuccess = async (response: RazorpayResponse) => {
    setShowRazorpay(false);

    // Validate the payment response first
    const validation = validateRazorpayResponse(response);
    if (!validation.isValid) {
      Toast.show({
        type: "error",
        text1: "Payment Verification Failed",
        text2: validation.error || "Invalid payment response",
      });
      setPendingAction(null);
      return;
    }

    if (pendingAction === "complete") {
      await completeSale(currentOrderId, false, response.razorpay_payment_id);
    } else if (pendingAction === "print") {
      await printAndSave(currentOrderId, response.razorpay_payment_id);
    }

    setPendingAction(null);
  };

  // Razorpay failure handler
  const handleRazorpayFailure = (error: string) => {
    setShowRazorpay(false);
    setPendingAction(null);
    const errorMessage = getRazorpayErrorMessage(error);
    Toast.show({
      type: "error",
      text1: "Payment Failed",
      text2: errorMessage,
    });
  };

  // Razorpay close handler
  const handleRazorpayClose = () => {
    setShowRazorpay(false);
    setPendingAction(null);
  };

  // Logout handler for cashiers
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={['top']}>
        <Text>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-4" edges={['top']}>
        <Camera size={48} color="#9CA3AF" />
        <Text className="text-gray-800 font-semibold text-lg mt-4 text-center">
          Camera Permission Required
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          We need camera access to scan barcodes
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-primary px-6 py-3 rounded-xl mt-6"
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </Pressable>
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
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-white">Billing</Text>
            {isCashier && userProfile?.displayName && (
              <Text className="text-sm text-white/80">{userProfile.displayName}</Text>
            )}
          </View>
          <View className="flex-row">
            <Pressable
              onPress={() => printerSheetRef.current?.expand()}
              className={`p-2 rounded-lg mr-2 ${
                isConnected ? "bg-green-100" : "bg-white/20 border border-white/30"
              }`}
            >
              <Printer size={20} color={isConnected ? "#66BB6A" : "#FFFFFF"} />
            </Pressable>
            {cart.length > 0 && (
              <Pressable
                onPress={clearCart}
                className="p-2 bg-white/20 border border-white/30 rounded-lg mr-2"
              >
                <Trash2 size={20} color="#FFFFFF" />
              </Pressable>
            )}
            {isCashier && (
              <Pressable
                onPress={handleLogout}
                className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg"
              >
                <LogOut size={20} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Manual Input */}
        <View className="flex-row items-center">
          <View className="flex-1 flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm">
            <TextInput
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Enter product code or name"
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-gray-800"
              onSubmitEditing={handleManualSearch}
            />
            <Pressable onPress={handleManualSearch} className="ml-2">
              <Search size={22} color="#2E7D32" />
            </Pressable>
          </View>
          <Pressable
            onPress={() => setScanning(true)}
            className="ml-3 w-12 h-12 bg-white rounded-xl items-center justify-center shadow-sm"
          >
            <Scan size={24} color="#2E7D32" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Scanner Section */}
      {scanning && (
        <View className="h-64 bg-black">
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerEnabled={true}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"],
            }}
          />
          <Pressable
            onPress={() => setScanning(false)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full"
          >
            <Text className="font-semibold">Cancel</Text>
          </Pressable>
        </View>
      )}

      {/* Cart Items */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {cart.length === 0 ? (
          <View className="items-center justify-center py-16">
            <ShoppingBag size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4">No items in cart</Text>
            <Text className="text-gray-400 text-sm mt-1">
              Scan a barcode or enter product code
            </Text>
          </View>
        ) : (
          cart.map((item) => (
            <View key={item.id} className="bg-white p-4 rounded-xl mb-3">
              <View className="flex-row">
                <View className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <ShoppingBag size={20} color="#9CA3AF" />
                    </View>
                  )}
                </View>
                <View className="flex-1 ml-3">
                  <Text className="font-semibold text-gray-800" numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.selectedWeight && (
                    <Text className="text-gray-500 text-sm">
                      {item.selectedWeight}
                    </Text>
                  )}
                  <Text className="text-primary font-bold">
                    {formatCurrency(item.price)}
                  </Text>
                </View>
                <View className="items-end justify-between">
                  <Pressable
                    onPress={() => removeFromCart(item.id)}
                    className="p-1"
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </Pressable>
                  <View className="flex-row items-center bg-gray-100 rounded-lg">
                    <Pressable
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2"
                    >
                      <Minus size={14} color="#374151" />
                    </Pressable>
                    <Text className="px-2 font-semibold">{item.quantity}</Text>
                    <Pressable
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2"
                    >
                      <Plus size={14} color="#374151" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Total & Buttons */}
      {cart.length > 0 && (
        <View className="bg-white px-3 pt-2 pb-2 border-t border-gray-200">
          {/* Total & Button Row */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: "#6B7280", fontSize: 11 }}>{cart.length} items</Text>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "#2E7D32" }}>
                {formatCurrency(cartTotal)}
              </Text>
            </View>
            <Pressable
              onPress={() => setShowCheckoutModal(true)}
              style={{
                backgroundColor: "#2E7D32",
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Check size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 6, fontSize: 14 }}>Complete</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Checkout Modal */}
      <Modal
        visible={showCheckoutModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCheckoutModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            {/* Handle */}
            <View style={{ alignItems: "center", paddingVertical: 10 }}>
              <View style={{ width: 36, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2 }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 12, color: "#9CA3AF" }}>{cart.length} items</Text>
                <Text style={{ fontSize: 24, fontWeight: "700", color: "#2E7D32" }}>{formatCurrency(cartTotal)}</Text>
              </View>
              <Pressable onPress={() => setShowCheckoutModal(false)} style={{ padding: 8 }}>
                <X size={22} color="#9CA3AF" />
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
              {/* Payment Method */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
                <Pressable
                  onPress={() => setPaymentMethod("Cash")}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: paymentMethod === "Cash" ? "#2E7D32" : "#F3F4F6",
                  }}
                >
                  <Banknote size={20} color={paymentMethod === "Cash" ? "#fff" : "#6B7280"} />
                  <Text style={{ marginLeft: 8, fontWeight: "600", fontSize: 14, color: paymentMethod === "Cash" ? "#fff" : "#6B7280" }}>Cash</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPaymentMethod("Online")}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: paymentMethod === "Online" ? "#2E7D32" : "#F3F4F6",
                  }}
                >
                  <Smartphone size={20} color={paymentMethod === "Online" ? "#fff" : "#6B7280"} />
                  <Text style={{ marginLeft: 8, fontWeight: "600", fontSize: 14, color: paymentMethod === "Online" ? "#fff" : "#6B7280" }}>UPI</Text>
                </Pressable>
              </View>

              {/* Customer & Delivery */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
                <Pressable
                  onPress={() => {
                    setShowCheckoutModal(false);
                    setTimeout(() => setShowAddressPicker(true), 300);
                  }}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: selectedAddressId ? "#F0FDF4" : "#F3F4F6",
                    borderRadius: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderWidth: selectedAddressId ? 1.5 : 0,
                    borderColor: "#66BB6A",
                  }}
                >
                  <MapPin size={18} color={selectedAddressId ? "#66BB6A" : "#9CA3AF"} />
                  <View style={{ marginLeft: 8, flex: 1 }}>
                    <Text style={{ fontSize: 10, color: "#9CA3AF" }}>Customer</Text>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151" }} numberOfLines={1}>
                      {selectedAddressId && customer.firstname ? customer.firstname : "Select"}
                    </Text>
                  </View>
                </Pressable>

                {deliveryEnabled && (
                  <Pressable
                    onPress={() => setIncludeDelivery(!includeDelivery)}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: includeDelivery ? "#E8F5E9" : "#F3F4F6",
                      borderRadius: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderWidth: includeDelivery ? 1.5 : 0,
                      borderColor: "#66BB6A",
                    }}
                  >
                    <Truck size={18} color={includeDelivery ? "#2E7D32" : "#9CA3AF"} />
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text style={{ fontSize: 10, color: includeDelivery ? "#2E7D32" : "#9CA3AF" }}>Delivery</Text>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: includeDelivery ? "#2E7D32" : "#374151" }}>
                        {includeDelivery ? (deliveryResult.isFree ? "Free" : formatCurrency(deliveryResult.finalCharge)) : "Add"}
                      </Text>
                    </View>
                  </Pressable>
                )}
              </View>

              {/* Coupon */}
              {appliedCoupon ? (
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDF4", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 14, borderWidth: 1.5, borderColor: "#66BB6A" }}>
                  <Ticket size={18} color="#66BB6A" />
                  <Text style={{ flex: 1, marginLeft: 8, fontWeight: "600", fontSize: 13, color: "#2E7D32" }}>
                    {appliedCoupon.couponCode}
                  </Text>
                  <Text style={{ fontWeight: "700", fontSize: 13, color: "#2E7D32", marginRight: 10 }}>
                    -{formatCurrency(cartWithOffers.couponDiscount?.discountAmount || 0)}
                  </Text>
                  <Pressable onPress={handleRemoveCoupon}>
                    <X size={18} color="#EF4444" />
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FFFBEB", borderRadius: 12, paddingLeft: 12, marginBottom: 14, borderWidth: 1, borderColor: "#FDE68A" }}>
                  <Ticket size={18} color="#F59E0B" />
                  <TextInput
                    value={couponCode}
                    onChangeText={(text) => {
                      setCouponCode(text.toUpperCase());
                      setCouponError(null);
                    }}
                    placeholder="Enter coupon"
                    placeholderTextColor="#D1D5DB"
                    autoCapitalize="characters"
                    style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 10, fontSize: 13, color: "#374151" }}
                  />
                  <Pressable
                    onPress={handleApplyCoupon}
                    style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                  >
                    <Text style={{ fontWeight: "600", fontSize: 13, color: couponCode.trim() ? "#F59E0B" : "#D1D5DB" }}>Apply</Text>
                  </Pressable>
                </View>
              )}
              {couponError && (
                <Text style={{ fontSize: 11, color: "#EF4444", marginBottom: 10, marginTop: -10 }}>{couponError}</Text>
              )}

              {/* Summary */}
              {(cartDiscount > 0 || deliveryCharge > 0) && (
                <View style={{ backgroundColor: "#F9FAFB", borderRadius: 10, padding: 12, marginBottom: 14 }}>
                  {cartDiscount > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ color: "#2E7D32", fontSize: 13 }}>Discount</Text>
                      <Text style={{ fontSize: 13, color: "#2E7D32", fontWeight: "600" }}>-{formatCurrency(cartDiscount)}</Text>
                    </View>
                  )}
                  {deliveryCharge > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: "#6B7280", fontSize: 13 }}>Delivery</Text>
                      <Text style={{ fontSize: 13, color: "#374151", fontWeight: "600" }}>+{formatCurrency(deliveryCharge)}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Confirm Button */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 20, paddingTop: 6 }}>
              <Pressable
                onPress={() => {
                  setShowCheckoutModal(false);
                  handleCompleteSale();
                }}
                style={{
                  backgroundColor: "#2E7D32",
                  paddingVertical: 14,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {paymentMethod === "Cash" ? (
                  <Banknote size={20} color="#fff" />
                ) : (
                  <Smartphone size={20} color="#fff" />
                )}
                <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 8, fontSize: 15 }}>
                  Pay {formatCurrency(cartTotal)} {paymentMethod === "Cash" ? "Cash" : "UPI"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Printer Bottom Sheet */}
      <BottomSheet
        ref={printerSheetRef}
        index={-1}
        snapPoints={["50%"]}
        enablePanDownToClose
      >
        <BottomSheetView className="flex-1 px-4">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Printer Settings
          </Text>
          <View className="bg-gray-100 p-4 rounded-xl">
            <Text className="text-gray-600">
              {isConnected
                ? "Printer is connected and ready"
                : "No printer connected. Go to Settings to connect a printer."}
            </Text>
          </View>
        </BottomSheetView>
      </BottomSheet>

      {/* Razorpay Payment Modal */}
      <RazorpayCheckout
        visible={showRazorpay}
        options={createRazorpayOptions(
          cartTotal,
          currentOrderId,
          customer.firstname.trim() || "POS Customer",
          `${customer.firstname.trim().toLowerCase().replace(/\s+/g, '') || "customer"}@pos.com`,
          customer.phone.trim() || "9999999999"
        )}
        onSuccess={handleRazorpaySuccess}
        onFailure={handleRazorpayFailure}
        onClose={handleRazorpayClose}
      />

      {/* Clear Cart Confirmation Modal */}
      <ConfirmationModal
        visible={showClearCartModal}
        title="Clear Cart"
        message="Are you sure you want to clear all items from the cart?"
        confirmText="Clear"
        cancelText="Cancel"
        type="clear"
        onConfirm={confirmClearCart}
        onCancel={() => setShowClearCartModal(false)}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        visible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout from your account?"
        confirmText="Logout"
        cancelText="Cancel"
        type="logout"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

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
                  value={addressSearchQuery}
                  onChangeText={setAddressSearchQuery}
                  placeholder="Search by name, address, phone..."
                  placeholderTextColor="#9CA3AF"
                  style={{ flex: 1, marginLeft: 12, fontSize: 15, color: "#1F2937" }}
                />
                {addressSearchQuery.length > 0 && (
                  <Pressable onPress={() => setAddressSearchQuery("")}>
                    <X size={18} color="#9CA3AF" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Address List */}
            <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
              {addressesLoading ? (
                <View className="items-center py-8">
                  <Text className="text-gray-500">Loading addresses...</Text>
                </View>
              ) : filteredAddresses.length === 0 ? (
                <View className="items-center py-8">
                  <MapPin size={40} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">
                    {addressSearchQuery ? "No addresses found" : "No saved addresses"}
                  </Text>
                  <Text className="text-gray-400 text-sm mt-1">
                    Add addresses from customer app
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
                        <LabelIcon size={18} color={isSelected ? "#2E7D32" : "#6B7280"} />
                      </View>

                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center">
                          <Text className={`font-bold ${isSelected ? "text-primary" : "text-gray-800"}`}>
                            {addr.label || "Address"}
                          </Text>
                          {addr.isDefault && (
                            <View className="flex-row items-center ml-2 bg-primary/10 px-2 py-0.5 rounded-full">
                              <Check size={10} color="#2E7D32" />
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
                className="flex-row items-center justify-center py-4 mb-3 bg-primary/10 rounded-xl"
              >
                <Plus size={20} color="#2E7D32" />
                <Text className="text-primary font-semibold ml-2">Add New Address</Text>
              </Pressable>

              {/* Walk-in Customer Option */}
              <Pressable
                onPress={() => {
                  setSelectedAddressId(null);
                  setCustomer({
                    firstname: "Walk-in Customer",
                    phone: "",
                    street: "",
                    city: "",
                    state: "",
                    pincode: "",
                  });
                  setShowAddressPicker(false);
                }}
                className="flex-row items-center justify-center py-4 mb-6 border-2 border-dashed border-gray-300 rounded-xl"
              >
                <ShoppingBag size={20} color="#6B7280" />
                <Text className="text-gray-600 font-semibold ml-2">Walk-in Customer (No Address)</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
