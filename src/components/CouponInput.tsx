import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Keyboard,
  Animated,
} from "react-native";
import { Ticket, X, Check, AlertCircle, Tag, XCircle } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useOffers } from "../context/OfferContext";
import { formatCurrency } from "../utils/formatters";

interface CouponInputProps {
  disabled?: boolean;
  onCouponApplied?: (couponCode: string, discountAmount: number) => void;
  onCouponRemoved?: () => void;
  compact?: boolean;
}

export function CouponInput({
  disabled = false,
  onCouponApplied,
  onCouponRemoved,
  compact = false,
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shakeAnim] = useState(new Animated.Value(0));

  const {
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
  } = useOffers();

  // Clear error when coupon code changes
  useEffect(() => {
    if (errorMessage && couponCode.length > 0) {
      setErrorMessage(null);
    }
  }, [couponCode]);

  // Shake animation for error
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleApply = async () => {
    Keyboard.dismiss();

    const trimmedCode = couponCode.trim().toUpperCase();

    if (!trimmedCode) {
      setErrorMessage("Please enter a coupon code");
      triggerShake();
      return;
    }

    if (trimmedCode.length < 3) {
      setErrorMessage("Coupon code must be at least 3 characters");
      triggerShake();
      return;
    }

    if (loading || disabled) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await applyCoupon(trimmedCode);

      if (result.isValid && result.discountAmount !== undefined) {
        onCouponApplied?.(trimmedCode, result.discountAmount);
        setCouponCode("");
        setErrorMessage(null);
        Toast.show({
          type: "success",
          text1: "Coupon Applied!",
          text2: `You save ${formatCurrency(result.discountAmount)}`,
          visibilityTime: 3000,
        });
      } else {
        // Show error message
        const error = result.error || "Invalid coupon code";
        setErrorMessage(error);
        triggerShake();

        // Also show Toast for better visibility
        Toast.show({
          type: "error",
          text1: "Invalid Coupon",
          text2: error,
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error("Coupon apply error:", error);
      const errorMsg = "Failed to apply coupon. Please try again.";
      setErrorMessage(errorMsg);
      triggerShake();
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    removeCoupon();
    setErrorMessage(null);
    onCouponRemoved?.();
    Toast.show({
      type: "info",
      text1: "Coupon Removed",
      visibilityTime: 2000,
    });
  };

  const handleClearInput = () => {
    setCouponCode("");
    setErrorMessage(null);
  };

  // Show applied coupon - Compact mode
  if (appliedCoupon && couponDiscount) {
    if (compact) {
      return (
        <View className="flex-row items-center bg-green-50 border border-green-200 rounded-lg p-3">
          <Tag size={16} color="#1D5A34" />
          <View className="flex-1 ml-2">
            <Text className="text-green-700 font-semibold text-sm">
              {appliedCoupon.couponCode}
            </Text>
            <Text className="text-green-600 text-xs">
              Saves {formatCurrency(couponDiscount.discountAmount)}
            </Text>
          </View>
          <Pressable
            onPress={handleRemove}
            className="p-2 bg-red-50 rounded-full"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color="#EF4444" />
          </Pressable>
        </View>
      );
    }

    // Full mode - Applied coupon
    return (
      <View className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
              <Check size={24} color="#1D5A34" strokeWidth={3} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-green-800 font-bold text-base">
                Coupon Applied!
              </Text>
              <View className="flex-row items-center mt-1">
                <Ticket size={14} color="#1D5A34" />
                <Text className="text-green-600 font-mono font-bold ml-1.5 text-sm">
                  {appliedCoupon.couponCode}
                </Text>
              </View>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-green-700 font-bold text-xl">
              -{formatCurrency(couponDiscount.discountAmount)}
            </Text>
            <Pressable
              onPress={handleRemove}
              className="mt-2 flex-row items-center bg-red-50 px-3 py-1.5 rounded-full"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={12} color="#EF4444" />
              <Text className="text-red-500 text-xs font-semibold ml-1">Remove</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Compact input mode
  if (compact) {
    return (
      <View>
        <Animated.View
          className="flex-row items-center"
          style={{ transform: [{ translateX: shakeAnim }] }}
        >
          <View
            className={`flex-1 flex-row items-center border rounded-lg px-3 mr-2 ${
              errorMessage
                ? "bg-red-50 border-red-300"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <Ticket size={16} color={errorMessage ? "#EF4444" : "#F59E0B"} />
            <TextInput
              value={couponCode}
              onChangeText={(text) => setCouponCode(text.toUpperCase())}
              placeholder="Coupon code"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              editable={!disabled && !loading}
              className="flex-1 py-2.5 ml-2 text-gray-800 font-mono text-sm"
              onSubmitEditing={handleApply}
              returnKeyType="done"
            />
            {couponCode.length > 0 && !loading && (
              <Pressable onPress={handleClearInput} className="p-1">
                <X size={14} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={handleApply}
            disabled={!couponCode.trim() || loading || disabled}
            className={`px-4 py-2.5 rounded-lg ${
              couponCode.trim() && !loading && !disabled
                ? "bg-amber-500"
                : "bg-gray-200"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                className={`font-semibold text-sm ${
                  couponCode.trim() && !disabled ? "text-white" : "text-gray-400"
                }`}
              >
                Apply
              </Text>
            )}
          </Pressable>
        </Animated.View>

        {/* Error Message - Compact */}
        {errorMessage && (
          <View className="flex-row items-center mt-2 bg-red-50 px-3 py-2 rounded-lg">
            <XCircle size={14} color="#EF4444" />
            <Text className="text-red-600 text-xs font-medium ml-1.5 flex-1">
              {errorMessage}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Full input mode
  return (
    <View>
      {/* Input Row */}
      <Animated.View
        className="flex-row items-center"
        style={{ transform: [{ translateX: shakeAnim }] }}
      >
        <View
          className={`flex-1 flex-row items-center border-2 rounded-xl px-4 mr-3 ${
            errorMessage
              ? "bg-red-50 border-red-300"
              : "bg-white border-gray-200"
          }`}
        >
          <Ticket size={20} color={errorMessage ? "#EF4444" : "#F59E0B"} />
          <TextInput
            value={couponCode}
            onChangeText={(text) => setCouponCode(text.toUpperCase())}
            placeholder="Enter coupon code"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            editable={!disabled && !loading}
            className="flex-1 py-3.5 ml-3 text-gray-800 font-mono text-base"
            onSubmitEditing={handleApply}
            returnKeyType="done"
          />
          {couponCode.length > 0 && !loading && (
            <Pressable
              onPress={handleClearInput}
              className="p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={handleApply}
          disabled={!couponCode.trim() || loading || disabled}
          className={`px-6 py-3.5 rounded-xl ${
            couponCode.trim() && !loading && !disabled
              ? "bg-amber-500"
              : "bg-gray-200"
          }`}
          style={
            couponCode.trim() && !loading && !disabled
              ? {
                  shadowColor: "#F59E0B",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }
              : {}
          }
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text
              className={`font-bold ${
                couponCode.trim() && !disabled ? "text-white" : "text-gray-400"
              }`}
            >
              Apply
            </Text>
          )}
        </Pressable>
      </Animated.View>

      {/* Error Message - Full Mode */}
      {errorMessage && (
        <View className="flex-row items-center mt-3 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
          <View className="w-8 h-8 bg-red-100 rounded-full items-center justify-center">
            <XCircle size={18} color="#EF4444" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-red-800 font-semibold text-sm">Invalid Coupon</Text>
            <Text className="text-red-600 text-xs mt-0.5">{errorMessage}</Text>
          </View>
          <Pressable
            onPress={() => setErrorMessage(null)}
            className="p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color="#EF4444" />
          </Pressable>
        </View>
      )}

      {/* Hint */}
      {!errorMessage && !appliedCoupon && (
        <View className="flex-row items-center mt-2">
          <AlertCircle size={12} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs ml-1.5">
            Have a coupon? Enter the code above to get a discount
          </Text>
        </View>
      )}
    </View>
  );
}

export default CouponInput;
