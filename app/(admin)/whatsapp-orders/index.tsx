import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ChevronLeft,
  Search,
  Phone,
  Clock,
  Package,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react-native";
import { WhatsAppIcon } from "../../../src/components/icons/WhatsAppIcon";
import { useTheme } from "../../../src/context/ThemeContext";
import { useWhatsAppOrders } from "../../../src/hooks/useWhatsAppOrders";
import { WhatsAppOrder, WhatsAppOrderStatus } from "../../../src/types";
import { formatCurrency } from "../../../src/utils/formatters";

const WHATSAPP_GREEN = "#25D366";

const STATUS_TABS: { key: WhatsAppOrderStatus | "All"; label: string }[] = [
  { key: "Pending", label: "Pending" },
  { key: "Confirmed", label: "Confirmed" },
  { key: "Converted", label: "Converted" },
  { key: "Rejected", label: "Rejected" },
  { key: "All", label: "All" },
];

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

const getStatusIcon = (status: WhatsAppOrderStatus) => {
  switch (status) {
    case "Pending":
      return Clock;
    case "Confirmed":
      return CheckCircle2;
    case "Converted":
      return RefreshCw;
    case "Rejected":
      return XCircle;
    case "Completed":
      return CheckCircle2;
    default:
      return AlertCircle;
  }
};

export default function WhatsAppOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<WhatsAppOrderStatus | "All">(
    "Pending"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const statusFilter =
    activeTab === "All" ? undefined : (activeTab as WhatsAppOrderStatus);
  const { orders, loading, getCounts } = useWhatsAppOrders({
    status: statusFilter,
  });

  const counts = getCounts();

  // Filter orders by search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;

    const query = searchQuery.toLowerCase();
    return orders.filter(
      (order) =>
        order.whatsappOrderId.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.includes(query)
    );
  }, [orders, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    // The hook uses real-time listener, so just wait a bit
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatTime = (date: any) => {
    const d = date?.toDate?.() || new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const OrderCard = ({ order }: { order: WhatsAppOrder }) => {
    const statusColor = getStatusColor(order.status);
    const StatusIcon = getStatusIcon(order.status);

    return (
      <Pressable
        onPress={() => router.push(`/(admin)/whatsapp-orders/${order.id}`)}
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: `${WHATSAPP_GREEN}15`,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: WHATSAPP_GREEN,
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  {order.whatsappOrderId}
                </Text>
              </View>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 12,
                  marginLeft: 8,
                }}
              >
                {formatTime(order.receivedAt)}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: `${statusColor}15`,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <StatusIcon size={14} color={statusColor} />
            <Text
              style={{
                color: statusColor,
                fontWeight: "600",
                fontSize: 12,
                marginLeft: 4,
              }}
            >
              {order.status}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WhatsAppIcon size={18} color={WHATSAPP_GREEN} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text
              style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}
            >
              {order.customerName}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Phone size={12} color={colors.textMuted} />
              <Text
                style={{ color: colors.textMuted, fontSize: 13, marginLeft: 4 }}
              >
                {order.customerPhone}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Preview */}
        <View
          style={{
            backgroundColor: colors.surface,
            padding: 12,
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Package size={16} color={colors.textMuted} />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 13,
                marginLeft: 6,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {order.items.length} item{order.items.length > 1 ? "s" : ""} •{" "}
              {order.items
                .slice(0, 2)
                .map((i) => i.productName)
                .join(", ")}
              {order.items.length > 2 ? "..." : ""}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>
            {formatCurrency(order.totalAmount)}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{ color: WHATSAPP_GREEN, fontWeight: "600", fontSize: 13 }}
            >
              View Details
            </Text>
            <ChevronRight size={16} color={WHATSAPP_GREEN} />
          </View>
        </View>
      </Pressable>
    );
  };

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
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
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
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${WHATSAPP_GREEN}15`,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 12,
          }}
        >
          <WhatsAppIcon size={22} color={WHATSAPP_GREEN} />
        </View>
        <View style={{ marginLeft: 12 }}>
          <Text
            style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}
          >
            WhatsApp Orders
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            {counts.pending} pending
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderRadius: 12,
            paddingHorizontal: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Search size={20} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by ID, name, or phone..."
            placeholderTextColor={colors.textMuted}
            style={{
              flex: 1,
              paddingVertical: 14,
              paddingHorizontal: 12,
              color: colors.text,
              fontSize: 15,
            }}
          />
        </View>
      </View>

      {/* Status Tabs */}
      <View style={{ paddingVertical: 16 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count =
              tab.key === "All"
                ? counts.total
                : counts[tab.key.toLowerCase() as keyof typeof counts];

            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  marginRight: 8,
                  backgroundColor: isActive ? WHATSAPP_GREEN : colors.card,
                  borderWidth: 1,
                  borderColor: isActive ? WHATSAPP_GREEN : colors.border,
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#FFFFFF" : colors.text,
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    style={{
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.3)"
                        : colors.surface,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10,
                      marginLeft: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: isActive ? "#FFFFFF" : colors.textSecondary,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={WHATSAPP_GREEN} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${WHATSAPP_GREEN}15`,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <WhatsAppIcon size={40} color={WHATSAPP_GREEN} />
          </View>
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            No Orders Found
          </Text>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {searchQuery
              ? "Try a different search query"
              : `No ${
                  activeTab === "All" ? "" : activeTab.toLowerCase()
                } WhatsApp orders yet`}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={WHATSAPP_GREEN}
              colors={[WHATSAPP_GREEN]}
            />
          }
        >
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
