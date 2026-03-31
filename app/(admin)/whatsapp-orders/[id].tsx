import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  ChevronLeft,
  MessageCircle,
  Phone,
  MapPin,
  CreditCard,
  Package,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  User,
  FileText,
  Send,
  AlertTriangle,
  ChevronRight,
  ShoppingBag,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useTheme } from "../../../src/context/ThemeContext";
import { useWhatsAppOrders } from "../../../src/hooks/useWhatsAppOrders";
import { useAuth } from "../../../src/context/AuthContext";
import { WhatsAppOrder, WhatsAppOrderStatus } from "../../../src/types";
import { formatCurrency } from "../../../src/utils/formatters";

const WHATSAPP_GREEN = "#25D366";

const getStatusColor = (status: WhatsAppOrderStatus) => {
  switch (status) {
    case "Pending":
      return "#F59E0B";
    case "Confirmed":
      return "#3B82F6";
    case "Converted":
      return "#66BB6A";
    case "Rejected":
      return "#EF4444";
    case "Completed":
      return "#8B5CF6";
    default:
      return "#6B7280";
  }
};

export default function WhatsAppOrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { getOrder, confirmOrder, rejectOrder, convertOrder, addNote } =
    useWhatsAppOrders();

  const [order, setOrder] = useState<WhatsAppOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      const orderData = await getOrder(id);
      setOrder(orderData);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!order || !user) return;

    Alert.alert("Confirm Order", "Are you sure you want to confirm this order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          setActionLoading("confirm");
          try {
            await confirmOrder(order.id, user.uid, "Order confirmed");
            Toast.show({
              type: "success",
              text1: "Order Confirmed",
              text2: "The order has been confirmed successfully",
            });
            fetchOrder();
          } catch (error: any) {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: error.message || "Failed to confirm order",
            });
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleReject = async () => {
    if (!order || !user || !rejectReason.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please provide a reason for rejection",
      });
      return;
    }

    setActionLoading("reject");
    try {
      await rejectOrder(order.id, user.uid, rejectReason);
      Toast.show({
        type: "success",
        text1: "Order Rejected",
        text2: "The order has been rejected",
      });
      setShowRejectModal(false);
      setRejectReason("");
      fetchOrder();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to reject order",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvert = async () => {
    if (!order || !user) return;

    Alert.alert(
      "Convert to Regular Order",
      "This will create a regular order, deduct stock, and mark this WhatsApp order as converted. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Convert",
          onPress: async () => {
            setActionLoading("convert");
            try {
              const result = await convertOrder(order.id, user.uid);
              Toast.show({
                type: "success",
                text1: "Order Converted",
                text2: `Created order ${result.regularOrderId}`,
              });
              fetchOrder();
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: error.message || "Failed to convert order",
              });
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleAddNote = async () => {
    if (!order || !user || !noteText.trim()) return;

    setActionLoading("note");
    try {
      await addNote(order.id, user.uid, noteText);
      Toast.show({
        type: "success",
        text1: "Note Added",
        text2: "Admin note added successfully",
      });
      setNoteText("");
      fetchOrder();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to add note",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMessageCustomer = async () => {
    if (!order) return;

    const phone = order.customerPhone.replace(/[^0-9]/g, "");
    const url = Platform.select({
      ios: `whatsapp://send?phone=${phone}`,
      android: `whatsapp://send?phone=${phone}`,
      default: `https://wa.me/${phone}`,
    });

    try {
      await Linking.openURL(url as string);
    } catch (error) {
      Linking.openURL(`https://wa.me/${phone}`);
    }
  };

  const formatDate = (date: any) => {
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          justifyContent: "center",
          alignItems: "center",
        }}
        edges={["top"]}
      >
        <ActivityIndicator size="large" color={WHATSAPP_GREEN} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.surface }}
        edges={["top"]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 16,
            backgroundColor: colors.card,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={22} color={colors.text} />
          </Pressable>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: colors.text,
              marginLeft: 12,
            }}
          >
            Order Not Found
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Package size={64} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, marginTop: 16 }}>
            Order not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(order.status);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.surface }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={22} color={colors.text} />
          </Pressable>
          <View style={{ marginLeft: 12 }}>
            <Text
              style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}
            >
              {order.whatsappOrderId}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>
              {formatDate(order.receivedAt)}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={handleMessageCustomer}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: WHATSAPP_GREEN,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Send size={16} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "600", marginLeft: 6 }}>
            Message
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(insets.bottom, 100),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontWeight: "600",
              fontSize: 16,
              marginBottom: 12,
            }}
          >
            Order Status
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: `${statusColor}15`,
              padding: 14,
              borderRadius: 12,
            }}
          >
            {order.status === "Pending" && <Clock size={24} color={statusColor} />}
            {order.status === "Confirmed" && (
              <CheckCircle2 size={24} color={statusColor} />
            )}
            {order.status === "Converted" && (
              <RefreshCw size={24} color={statusColor} />
            )}
            {order.status === "Rejected" && (
              <XCircle size={24} color={statusColor} />
            )}
            <Text
              style={{
                color: statusColor,
                fontWeight: "700",
                fontSize: 17,
                marginLeft: 12,
              }}
            >
              {order.status}
            </Text>
          </View>

          {order.convertedOrderId && (
            <Pressable
              onPress={() =>
                router.push(`/(admin)/orders/${order.convertedOrderId}`)
              }
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.surface,
                padding: 12,
                borderRadius: 10,
                marginTop: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <FileText size={18} color={WHATSAPP_GREEN} />
                <Text style={{ color: colors.text, marginLeft: 8 }}>
                  View Converted Order
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Customer Info */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <User size={18} color={WHATSAPP_GREEN} />
            <Text
              style={{
                color: colors.text,
                fontWeight: "600",
                fontSize: 16,
                marginLeft: 8,
              }}
            >
              Customer
            </Text>
          </View>
          <Text
            style={{ color: colors.text, fontWeight: "500", fontSize: 16 }}
          >
            {order.customerName}
          </Text>
          <View
            style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}
          >
            <Phone size={14} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginLeft: 6 }}>
              {order.customerPhone}
            </Text>
          </View>
        </View>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <MapPin size={18} color={WHATSAPP_GREEN} />
              <Text
                style={{
                  color: colors.text,
                  fontWeight: "600",
                  fontSize: 16,
                  marginLeft: 8,
                }}
              >
                Delivery Address
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
              {order.deliveryAddress.firstname} {order.deliveryAddress.lastname}
              {"\n"}
              {order.deliveryAddress.address}
              {"\n"}
              {order.deliveryAddress.city}, {order.deliveryAddress.state} -{" "}
              {order.deliveryAddress.zip}
            </Text>
            {order.deliveryNotes && (
              <View
                style={{
                  backgroundColor: colors.surface,
                  padding: 10,
                  borderRadius: 8,
                  marginTop: 10,
                }}
              >
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  Note: {order.deliveryNotes}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Payment Info */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <CreditCard size={18} color={WHATSAPP_GREEN} />
              <Text
                style={{
                  color: colors.text,
                  fontWeight: "600",
                  fontSize: 16,
                  marginLeft: 8,
                }}
              >
                Payment
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.surface,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "500" }}>
                {order.paymentMethod === "cod"
                  ? "Cash on Delivery"
                  : order.paymentMethod === "online"
                  ? "Online Payment"
                  : "Pending"}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontWeight: "600",
              fontSize: 16,
              marginBottom: 12,
            }}
          >
            Items ({order.items.length})
          </Text>
          {order.items.map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: index < order.items.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <ShoppingBag size={20} color={colors.textMuted} />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={{ color: colors.text, fontWeight: "500" }}
                  numberOfLines={1}
                >
                  {item.productName}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  {formatCurrency(item.price)} × {item.quantity}
                  {item.selectedWeight ? ` • ${item.selectedWeight}` : ""}
                </Text>
              </View>
              <Text style={{ color: WHATSAPP_GREEN, fontWeight: "600" }}>
                {formatCurrency(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontWeight: "600",
              fontSize: 16,
              marginBottom: 12,
            }}
          >
            Summary
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text style={{ color: colors.textMuted }}>Subtotal</Text>
            <Text style={{ color: colors.text, fontWeight: "500" }}>
              {formatCurrency(order.subtotal)}
            </Text>
          </View>
          {order.discount > 0 && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: colors.textMuted }}>Discount</Text>
              <Text style={{ color: "#66BB6A", fontWeight: "500" }}>
                -{formatCurrency(order.discount)}
              </Text>
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text style={{ color: colors.textMuted }}>Delivery</Text>
            <Text style={{ color: WHATSAPP_GREEN, fontWeight: "500" }}>
              {order.deliveryFee > 0
                ? formatCurrency(order.deliveryFee)
                : "FREE"}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 17 }}>
              Total
            </Text>
            <Text
              style={{ color: WHATSAPP_GREEN, fontWeight: "700", fontSize: 17 }}
            >
              {formatCurrency(order.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Status History */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontWeight: "600",
                fontSize: 16,
                marginBottom: 12,
              }}
            >
              Status History
            </Text>
            {order.statusHistory.map((entry, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  paddingVertical: 10,
                  borderLeftWidth: 2,
                  borderLeftColor: getStatusColor(entry.status),
                  paddingLeft: 12,
                  marginLeft: 6,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "500" }}>
                    {entry.status}
                  </Text>
                  {entry.note && (
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 13,
                        marginTop: 2,
                      }}
                    >
                      {entry.note}
                    </Text>
                  )}
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {formatDate(entry.timestamp)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Admin Notes */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontWeight: "600",
              fontSize: 16,
              marginBottom: 12,
            }}
          >
            Admin Notes
          </Text>
          {order.adminNotes ? (
            <View
              style={{
                backgroundColor: colors.surface,
                padding: 12,
                borderRadius: 10,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
                {order.adminNotes}
              </Text>
            </View>
          ) : (
            <Text style={{ color: colors.textMuted, marginBottom: 12 }}>
              No notes yet
            </Text>
          )}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 10,
              paddingHorizontal: 12,
            }}
          >
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Add a note..."
              placeholderTextColor={colors.textMuted}
              style={{
                flex: 1,
                paddingVertical: 12,
                color: colors.text,
                fontSize: 15,
              }}
            />
            <Pressable
              onPress={handleAddNote}
              disabled={!noteText.trim() || actionLoading === "note"}
            >
              {actionLoading === "note" ? (
                <ActivityIndicator size="small" color={WHATSAPP_GREEN} />
              ) : (
                <Send
                  size={20}
                  color={noteText.trim() ? WHATSAPP_GREEN : colors.textMuted}
                />
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {order.status === "Pending" && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: "row",
            padding: 16,
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => setShowRejectModal(true)}
            disabled={actionLoading !== null}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FEE2E2",
              paddingVertical: 14,
              borderRadius: 12,
            }}
          >
            <XCircle size={18} color="#EF4444" />
            <Text style={{ color: "#EF4444", fontWeight: "600", marginLeft: 6 }}>
              Reject
            </Text>
          </Pressable>
          <Pressable
            onPress={handleConfirm}
            disabled={actionLoading !== null}
            style={{
              flex: 2,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: WHATSAPP_GREEN,
              paddingVertical: 14,
              borderRadius: 12,
            }}
          >
            {actionLoading === "confirm" ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <CheckCircle2 size={18} color="#FFFFFF" />
                <Text
                  style={{ color: "#FFFFFF", fontWeight: "600", marginLeft: 6 }}
                >
                  Confirm Order
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {order.status === "Confirmed" && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Pressable
            onPress={handleConvert}
            disabled={actionLoading !== null}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: WHATSAPP_GREEN,
              paddingVertical: 16,
              borderRadius: 12,
            }}
          >
            {actionLoading === "convert" ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <RefreshCw size={20} color="#FFFFFF" />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "700",
                    fontSize: 16,
                    marginLeft: 8,
                  }}
                >
                  Convert to Regular Order
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 20,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "#FEE2E2",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={24} color="#EF4444" />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "700",
                    fontSize: 18,
                  }}
                >
                  Reject Order
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  Please provide a reason
                </Text>
              </View>
            </View>

            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Reason for rejection..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                color: colors.text,
                fontSize: 15,
                marginTop: 16,
                textAlignVertical: "top",
                minHeight: 100,
              }}
            />

            <View
              style={{ flexDirection: "row", gap: 12, marginTop: 16 }}
            >
              <Pressable
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleReject}
                disabled={!rejectReason.trim() || actionLoading === "reject"}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: "#EF4444",
                  alignItems: "center",
                  opacity: rejectReason.trim() ? 1 : 0.5,
                }}
              >
                {actionLoading === "reject" ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    Reject Order
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
