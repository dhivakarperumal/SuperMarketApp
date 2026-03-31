import React, { useState } from "react";
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from "react-native";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";
import { useWhatsApp } from "../../context/WhatsAppContext";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { Address, CartItem } from "../../types";
import { createWhatsAppOrder } from "../../services/whatsapp/WhatsAppOrderService";
import Toast from "react-native-toast-message";

// WhatsApp brand colors
const WHATSAPP_GREEN = "#25D366";
const WHATSAPP_DARK = "#128C7E";
const WHATSAPP_LIGHT_BG = "#E8FDF3";

interface ProductOrderProps {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedWeight?: string;
  image?: string;
}

interface CartOrderProps {
  items: {
    productId?: string;
    name: string;
    quantity: number;
    price: number;
    selectedWeight?: string;
    image?: string;
  }[];
  subtotal: number;
  discount?: number;
  discountLabel?: string;
  deliveryFee: number;
  total: number;
  deliveryAddress?: Address;
  paymentMethod?: "cod" | "online";
  notes?: string;
}

interface WhatsAppOrderButtonProps {
  // For product page - pass product details
  product?: ProductOrderProps;

  // For cart/checkout - pass cart data
  cart?: CartOrderProps;

  // Styling
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  style?: ViewStyle;

  // Callbacks
  onPress?: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;

  // Custom label
  label?: string;

  // Show icon only (for compact view)
  iconOnly?: boolean;

  // Disabled state
  disabled?: boolean;
}

export function WhatsAppOrderButton({
  product,
  cart,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  style,
  onPress,
  onSuccess,
  onError,
  label,
  iconOnly = false,
  disabled = false,
}: WhatsAppOrderButtonProps) {
  const {
    isAvailable,
    config,
    checkAvailability,
    generateProductMessage,
    generateOrderMessage,
    sendWhatsAppMessage,
  } = useWhatsApp();
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Check if the specific feature is enabled
  if (product && !config.enableProductOrders) {
    return null;
  }

  if (cart && !config.enableCartOrders) {
    return null;
  }

  // Check if WhatsApp is fully configured
  const isFullyConfigured = config.isEnabled && config.phoneNumber;
  const isWithinHours = checkAvailability();
  const canUseWhatsApp = isAvailable && isFullyConfigured;

  // Show disabled state if feature enabled but WhatsApp not available
  if (!canUseWhatsApp) {
    let unavailableMessage = "WhatsApp not available";
    if (!config.isEnabled) {
      unavailableMessage = "WhatsApp disabled";
    } else if (!config.phoneNumber) {
      unavailableMessage = "Not configured";
    } else if (!isWithinHours) {
      unavailableMessage = `Available ${config.availableFromTime} - ${config.availableToTime}`;
    }

    if (iconOnly) return null; // Don't show disabled icon-only buttons

    return (
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            paddingVertical: size === "small" ? 10 : size === "large" ? 16 : 12,
            paddingHorizontal: size === "small" ? 14 : size === "large" ? 24 : 18,
            backgroundColor: "#F3F4F6",
            opacity: 0.6,
          },
          fullWidth ? { width: "100%" } : {},
          style,
        ]}
      >
        <WhatsAppIcon size={size === "small" ? 18 : size === "large" ? 22 : 20} color="#9CA3AF" />
        <Text style={{ color: "#9CA3AF", fontSize: size === "small" ? 14 : size === "large" ? 18 : 15, fontWeight: "600", marginLeft: 10 }}>
          {unavailableMessage}
        </Text>
      </View>
    );
  }

  const handlePress = async () => {
    if (disabled || loading) return;

    onPress?.();
    setLoading(true);

    try {
      let message: string;
      const customerName =
        userProfile?.displayName || user?.displayName || "Customer";
      const customerPhone = userProfile?.phone || user?.phoneNumber || "";

      if (product) {
        // Generate product order message
        message = generateProductMessage({
          productName: product.name,
          price: product.price,
          quantity: product.quantity,
          selectedWeight: product.selectedWeight,
          customerName,
        });
      } else if (cart) {
        // Generate cart order message
        message = generateOrderMessage({
          items: cart.items,
          subtotal: cart.subtotal,
          discount: cart.discount,
          discountLabel: cart.discountLabel,
          deliveryFee: cart.deliveryFee,
          total: cart.total,
          customerName,
          customerPhone,
          deliveryAddress: cart.deliveryAddress,
          paymentMethod: cart.paymentMethod,
          notes: cart.notes,
        });
      } else {
        throw new Error("Please provide product or cart data");
      }

      const success = await sendWhatsAppMessage(message);

      if (success) {
        Toast.show({
          type: "success",
          text1: "WhatsApp Opened",
          text2: "Complete your order in WhatsApp",
        });
        onSuccess?.();
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to open WhatsApp";
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
      });
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get styles based on variant and size
  const getContainerStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
    };

    // Size styles - matching app's button sizing
    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        paddingVertical: 10,
        paddingHorizontal: iconOnly ? 10 : 14,
        minHeight: 40,
      },
      medium: {
        paddingVertical: 12,
        paddingHorizontal: iconOnly ? 12 : 18,
        minHeight: 48,
      },
      large: {
        paddingVertical: 16,
        paddingHorizontal: iconOnly ? 16 : 24,
        minHeight: 56,
      },
    };

    // Variant styles with improved appearance
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: WHATSAPP_GREEN,
        ...Platform.select({
          ios: {
            shadowColor: WHATSAPP_GREEN,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          },
          android: {
            elevation: 6,
          },
        }),
      },
      secondary: {
        backgroundColor: WHATSAPP_DARK,
        ...Platform.select({
          ios: {
            shadowColor: WHATSAPP_DARK,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          },
          android: {
            elevation: 6,
          },
        }),
      },
      outline: {
        backgroundColor: WHATSAPP_LIGHT_BG,
        borderWidth: 2,
        borderColor: WHATSAPP_GREEN,
      },
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth ? { width: "100%" } : {}),
      ...(disabled ? { opacity: 0.5 } : {}),
    };
  };

  const getTextStyles = (): TextStyle => {
    const baseStyles: TextStyle = {
      fontWeight: "700",
    };

    // Size styles - matching app's text sizing
    const sizeStyles: Record<string, TextStyle> = {
      small: { fontSize: 14 },
      medium: { fontSize: 15 },
      large: { fontSize: 18 },
    };

    const variantStyles: Record<string, TextStyle> = {
      primary: { color: "#FFFFFF" },
      secondary: { color: "#FFFFFF" },
      outline: { color: WHATSAPP_DARK },
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 18;
      case "large":
        return 22;
      default:
        return 20;
    }
  };

  const getIconColor = () => {
    return variant === "outline" ? WHATSAPP_DARK : "#FFFFFF";
  };

  const buttonLabel = label || (product ? "Order via WhatsApp" : "Order via WhatsApp");

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        getContainerStyles(),
        pressed && !disabled && {
          opacity: 0.85,
          transform: [{ scale: 0.98 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" ? WHATSAPP_DARK : "#FFFFFF"}
        />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <WhatsAppIcon
            size={getIconSize()}
            color={getIconColor()}
          />
          {!iconOnly && (
            <Text style={[getTextStyles(), { marginLeft: 10 }]}>
              {buttonLabel}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

/**
 * Compact WhatsApp icon button for product cards
 */
export function WhatsAppIconButton({
  product,
  size = "medium",
  style,
  onSuccess,
  onError,
}: {
  product: ProductOrderProps;
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}) {
  return (
    <WhatsAppOrderButton
      product={product}
      variant="primary"
      size={size}
      iconOnly
      style={style}
      onSuccess={onSuccess}
      onError={onError}
    />
  );
}

/**
 * WhatsApp checkout button for cart page
 */
export function WhatsAppCheckoutButton({
  cart,
  style,
  onSuccess,
  onError,
}: {
  cart: CartOrderProps;
  style?: ViewStyle;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}) {
  const {
    isAvailable,
    config,
    checkAvailability,
    generateOrderMessage,
    sendWhatsAppMessage,
  } = useWhatsApp();
  const { user, userProfile } = useAuth();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  // Don't render if cart orders feature is disabled
  if (!config.enableCartOrders) {
    return null;
  }

  // Check if WhatsApp is fully configured
  const isFullyConfigured = config.isEnabled && config.phoneNumber;
  const isWithinHours = checkAvailability();
  const canUseWhatsApp = isAvailable && isFullyConfigured;

  // Show disabled state if feature enabled but WhatsApp not available
  if (!canUseWhatsApp) {
    let unavailableMessage = "WhatsApp ordering not available";
    if (!config.isEnabled) {
      unavailableMessage = "WhatsApp ordering is disabled";
    } else if (!config.phoneNumber) {
      unavailableMessage = "WhatsApp number not configured";
    } else if (!isWithinHours) {
      unavailableMessage = `WhatsApp available ${config.availableFromTime} - ${config.availableToTime}`;
    }

    return (
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F3F4F6",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            width: "100%",
            minHeight: 56,
            opacity: 0.6,
          },
          style,
        ]}
      >
        <WhatsAppIcon size={22} color="#9CA3AF" />
        <Text
          style={{
            color: "#9CA3AF",
            fontSize: 16,
            fontWeight: "600",
            marginLeft: 10,
          }}
        >
          {unavailableMessage}
        </Text>
      </View>
    );
  }

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const customerName =
        userProfile?.displayName || user?.displayName || "Customer";
      const customerPhone = userProfile?.phone || user?.phoneNumber || "";
      const safeItems = Array.isArray(cart?.items) ? cart.items : [];

      if (safeItems.length === 0) {
        throw new Error("Your cart is empty");
      }

      // Create WhatsApp order items for Firebase
      const whatsappOrderItems = safeItems.map(item => ({
        productId: item.productId || "",
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        selectedWeight: item.selectedWeight,
        image: item.image,
      }));

      // Create WhatsApp order in Firebase FIRST
      const whatsappOrder = await createWhatsAppOrder({
        items: whatsappOrderItems,
        subtotal: cart.subtotal,
        deliveryFee: cart.deliveryFee,
        discount: cart.discount || 0,
        totalAmount: cart.total,
        customerName,
        customerPhone,
        deliveryAddress: cart.deliveryAddress,
        deliveryNotes: cart.notes,
        paymentMethod: cart.paymentMethod || "cod",
      });

      // Generate WhatsApp message with order ID
      const message = generateOrderMessage({
        items: safeItems,
        subtotal: cart.subtotal,
        discount: cart.discount,
        discountLabel: cart.discountLabel,
        deliveryFee: cart.deliveryFee,
        total: cart.total,
        customerName,
        customerPhone,
        deliveryAddress: cart.deliveryAddress,
        paymentMethod: cart.paymentMethod,
        notes: `Order ID: ${whatsappOrder.whatsappOrderId}`,
      });

      // Open WhatsApp
      const success = await sendWhatsAppMessage(message);

      if (success) {
        // Clear the cart after successful order
        await clearCart();

        Toast.show({
          type: "success",
          text1: "Order Sent!",
          text2: `Order ${whatsappOrder.whatsappOrderId} sent to WhatsApp`,
        });
        onSuccess?.();
      }
    } catch (error: any) {
      console.error("WhatsApp order error:", error);
      const errorMessage = error.message || "Failed to place WhatsApp order";
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
      });
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: WHATSAPP_GREEN,
          paddingVertical: 16,
          paddingHorizontal: 24,
          borderRadius: 12,
          width: "100%",
          minHeight: 56,
          ...Platform.select({
            ios: {
              shadowColor: WHATSAPP_GREEN,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            android: {
              elevation: 6,
            },
          }),
        },
        pressed && {
          opacity: 0.9,
          transform: [{ scale: 0.98 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <WhatsAppIcon size={22} color="#FFFFFF" />
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: "700",
              marginLeft: 10,
            }}
          >
            Order via WhatsApp
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Additional styles if needed
});
