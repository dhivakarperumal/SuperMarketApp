import React from "react";
import { View, Text, Pressable } from "react-native";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X,
  ShoppingCart,
  Wifi,
  WifiOff,
  Package,
  Truck,
} from "lucide-react-native";
import { BaseToast, ErrorToast, ToastConfig } from "react-native-toast-message";

interface CustomToastProps {
  text1?: string;
  text2?: string;
  onPress?: () => void;
  hide?: () => void;
  props?: {
    icon?: string;
  };
}

// Success Toast - Green theme
const SuccessToast = ({ text1, text2, hide, props }: CustomToastProps) => {
  const getIcon = () => {
    switch (props?.icon) {
      case "cart":
        return <ShoppingCart size={22} color="#fff" />;
      case "package":
        return <Package size={22} color="#fff" />;
      case "truck":
        return <Truck size={22} color="#fff" />;
      default:
        return <CheckCircle size={22} color="#fff" />;
    }
  };

  return (
    <View
      style={{
        width: "92%",
        backgroundColor: "#fff",
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
        borderLeftWidth: 0,
      }}
    >
      {/* Icon Container */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: "#66BB6A",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {getIcon()}
      </View>

      {/* Text Content */}
      <View style={{ flex: 1, marginLeft: 14 }}>
        {text1 && (
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#1F2937",
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              fontSize: 13,
              color: "#6B7280",
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {text2}
          </Text>
        )}
      </View>

      {/* Close Button */}
      <Pressable
        onPress={hide}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 8,
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={14} color="#9CA3AF" />
      </Pressable>
    </View>
  );
};

// Error Toast - Red theme
const CustomErrorToast = ({ text1, text2, hide }: CustomToastProps) => {
  return (
    <View
      style={{
        width: "92%",
        backgroundColor: "#fff",
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
      }}
    >
      {/* Icon Container */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: "#FEE2E2",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <XCircle size={24} color="#EF4444" />
      </View>

      {/* Text Content */}
      <View style={{ flex: 1, marginLeft: 14 }}>
        {text1 && (
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#DC2626",
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              fontSize: 13,
              color: "#6B7280",
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {text2}
          </Text>
        )}
      </View>

      {/* Close Button */}
      <Pressable
        onPress={hide}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#FEE2E2",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 8,
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={14} color="#EF4444" />
      </Pressable>
    </View>
  );
};

// Info Toast - Blue theme
const InfoToast = ({ text1, text2, hide, props }: CustomToastProps) => {
  const isOffline = props?.icon === "offline";
  const isOnline = props?.icon === "online";

  return (
    <View
      style={{
        width: "92%",
        backgroundColor: "#fff",
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        shadowColor: "#3B82F6",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
      }}
    >
      {/* Icon Container */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: isOffline ? "#FEF3C7" : isOnline ? "#E8F5E9" : "#DBEAFE",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isOffline ? (
          <WifiOff size={22} color="#D97706" />
        ) : isOnline ? (
          <Wifi size={22} color="#1D5A34" />
        ) : (
          <Info size={22} color="#3B82F6" />
        )}
      </View>

      {/* Text Content */}
      <View style={{ flex: 1, marginLeft: 14 }}>
        {text1 && (
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: isOffline ? "#D97706" : isOnline ? "#1D5A34" : "#1D4ED8",
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              fontSize: 13,
              color: "#6B7280",
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {text2}
          </Text>
        )}
      </View>

      {/* Close Button */}
      <Pressable
        onPress={hide}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 8,
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={14} color="#9CA3AF" />
      </Pressable>
    </View>
  );
};

// Warning Toast - Yellow/Amber theme
const WarningToast = ({ text1, text2, hide }: CustomToastProps) => {
  return (
    <View
      style={{
        width: "92%",
        backgroundColor: "#fff",
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        shadowColor: "#F59E0B",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
      }}
    >
      {/* Icon Container */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: "#FEF3C7",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AlertCircle size={24} color="#F59E0B" />
      </View>

      {/* Text Content */}
      <View style={{ flex: 1, marginLeft: 14 }}>
        {text1 && (
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#D97706",
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              fontSize: 13,
              color: "#6B7280",
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {text2}
          </Text>
        )}
      </View>

      {/* Close Button */}
      <Pressable
        onPress={hide}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#FEF3C7",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 8,
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={14} color="#D97706" />
      </Pressable>
    </View>
  );
};

// Cart Toast - Special toast for cart actions
const CartToast = ({ text1, text2, hide, onPress }: CustomToastProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: "92%",
        backgroundColor: "#1D5A34",
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        shadowColor: "#1D5A34",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
      }}
    >
      {/* Icon Container */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.2)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ShoppingCart size={22} color="#fff" />
      </View>

      {/* Text Content */}
      <View style={{ flex: 1, marginLeft: 14 }}>
        {text1 && (
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#fff",
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 18,
            }}
            numberOfLines={1}
          >
            {text2}
          </Text>
        )}
      </View>

      {/* View Cart Button */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#1D5A34", fontWeight: "700", fontSize: 13 }}>
          View
        </Text>
      </View>
    </Pressable>
  );
};

// Export toast config
export const toastConfig: ToastConfig = {
  success: (props) => (
    <SuccessToast
      text1={props.text1}
      text2={props.text2}
      hide={props.hide}
      props={props.props}
    />
  ),
  error: (props) => (
    <CustomErrorToast
      text1={props.text1}
      text2={props.text2}
      hide={props.hide}
    />
  ),
  info: (props) => (
    <InfoToast
      text1={props.text1}
      text2={props.text2}
      hide={props.hide}
      props={props.props}
    />
  ),
  warning: (props) => (
    <WarningToast
      text1={props.text1}
      text2={props.text2}
      hide={props.hide}
    />
  ),
  cart: (props) => (
    <CartToast
      text1={props.text1}
      text2={props.text2}
      hide={props.hide}
      onPress={props.onPress}
    />
  ),
};

export default toastConfig;
