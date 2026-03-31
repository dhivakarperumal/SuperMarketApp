import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import {
  AlertTriangle,
  Trash2,
  LogOut,
  UserX,
  UserCheck,
  ShoppingCart,
  HelpCircle,
  XCircle,
  CheckCircle,
  Info,
  LucideIcon,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

export type ConfirmationType =
  | "danger"
  | "warning"
  | "info"
  | "success"
  | "logout"
  | "delete"
  | "clear"
  | "deactivate"
  | "activate";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const getTypeConfig = (type: ConfirmationType) => {
  const configs: Record<
    ConfirmationType,
    {
      icon: LucideIcon;
      iconBg: string;
      iconColor: string;
      confirmBg: string;
      confirmText: string;
    }
  > = {
    danger: {
      icon: AlertTriangle,
      iconBg: "#FEE2E2",
      iconColor: "#DC2626",
      confirmBg: "#DC2626",
      confirmText: "#FFFFFF",
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "#FEF3C7",
      iconColor: "#D97706",
      confirmBg: "#D97706",
      confirmText: "#FFFFFF",
    },
    info: {
      icon: Info,
      iconBg: "#DBEAFE",
      iconColor: "#2563EB",
      confirmBg: "#2563EB",
      confirmText: "#FFFFFF",
    },
    success: {
      icon: CheckCircle,
      iconBg: "#E8F5E9",
      iconColor: "#2E7D32",
      confirmBg: "#2E7D32",
      confirmText: "#FFFFFF",
    },
    logout: {
      icon: LogOut,
      iconBg: "#FEE2E2",
      iconColor: "#DC2626",
      confirmBg: "#DC2626",
      confirmText: "#FFFFFF",
    },
    delete: {
      icon: Trash2,
      iconBg: "#FEE2E2",
      iconColor: "#DC2626",
      confirmBg: "#DC2626",
      confirmText: "#FFFFFF",
    },
    clear: {
      icon: ShoppingCart,
      iconBg: "#FEF3C7",
      iconColor: "#D97706",
      confirmBg: "#D97706",
      confirmText: "#FFFFFF",
    },
    deactivate: {
      icon: UserX,
      iconBg: "#FEE2E2",
      iconColor: "#DC2626",
      confirmBg: "#DC2626",
      confirmText: "#FFFFFF",
    },
    activate: {
      icon: UserCheck,
      iconBg: "#E8F5E9",
      iconColor: "#2E7D32",
      confirmBg: "#2E7D32",
      confirmText: "#FFFFFF",
    },
  };

  return configs[type] || configs.danger;
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const config = getTypeConfig(type);
  const IconComponent = config.icon;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          opacity: opacityAnim,
        }}
      >
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onPress={onCancel}
        />
        <Animated.View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 24,
            width: width - 48,
            maxWidth: 340,
            alignItems: "center",
            transform: [{ scale: scaleAnim }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: config.iconBg,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <IconComponent size={36} color={config.iconColor} strokeWidth={2} />
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#1F2937",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {title}
          </Text>

          {/* Message */}
          <Text
            style={{
              fontSize: 15,
              color: "#6B7280",
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 24,
              paddingHorizontal: 8,
            }}
          >
            {message}
          </Text>

          {/* Buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {/* Cancel Button */}
            <Pressable
              onPress={onCancel}
              disabled={loading}
              style={{
                width: "48%",
                height: 50,
                borderRadius: 14,
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#4B5563",
                }}
              >
                {cancelText}
              </Text>
            </Pressable>

            {/* Confirm Button */}
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={{
                width: "48%",
                height: 50,
                borderRadius: 14,
                backgroundColor: config.confirmBg,
                alignItems: "center",
                justifyContent: "center",
                opacity: loading ? 0.7 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: config.confirmText,
                }}
              >
                {loading ? "Please wait..." : confirmText}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Hook for easier usage
interface UseConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
}

export const useConfirmation = () => {
  const [modalState, setModalState] = React.useState<{
    visible: boolean;
    options: UseConfirmationOptions;
    onConfirm: () => void;
  }>({
    visible: false,
    options: { title: "", message: "" },
    onConfirm: () => {},
  });

  const confirm = (
    options: UseConfirmationOptions,
    onConfirm: () => void | Promise<void>
  ) => {
    setModalState({
      visible: true,
      options,
      onConfirm: async () => {
        await onConfirm();
        setModalState((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  const close = () => {
    setModalState((prev) => ({ ...prev, visible: false }));
  };

  const ConfirmationModalComponent = () => (
    <ConfirmationModal
      visible={modalState.visible}
      title={modalState.options.title}
      message={modalState.options.message}
      confirmText={modalState.options.confirmText}
      cancelText={modalState.options.cancelText}
      type={modalState.options.type}
      onConfirm={modalState.onConfirm}
      onCancel={close}
    />
  );

  return { confirm, close, ConfirmationModal: ConfirmationModalComponent };
};

export default ConfirmationModal;
