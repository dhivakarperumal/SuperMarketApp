import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ChevronLeft,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  Calendar,
  CreditCard,
  Banknote,
  RefreshCw,
  X,
  CalendarRange,
  Truck,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react-native";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../../../src/services/firebase/config";
import { useTheme } from "../../../src/context/ThemeContext";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import Toast from "react-native-toast-message";

interface OrderData {
  id: string;
  orderId: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: Timestamp;
  items: any[];
  deliveryFee?: number;
}

interface ReportStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  cashOrders: number;
  onlineOrders: number;
  cashRevenue: number;
  onlineRevenue: number;
  totalItems: number;
  // Delivery stats
  deliveryRevenue: number;
  paidDeliveryOrders: number;
  freeDeliveryOrders: number;
}

type Period = "today" | "week" | "month" | "all" | "custom";

export default function ReportScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>("today");
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    cashOrders: 0,
    onlineOrders: 0,
    cashRevenue: 0,
    onlineRevenue: 0,
    totalItems: 0,
    deliveryRevenue: 0,
    paidDeliveryOrders: 0,
    freeDeliveryOrders: 0,
  });

  // Custom date range
  const [showDateModal, setShowDateModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState<Date | null>(null);
  const [appliedEndDate, setAppliedEndDate] = useState<Date | null>(null);

  // Date picker state
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [currentPicker, setCurrentPicker] = useState<"start" | "end">("start");

  // Download state
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [orders, period, appliedStartDate, appliedEndDate]);

  const fetchOrders = async () => {
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const fetchedOrders: OrderData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedOrders.push({
          id: doc.id,
          orderId: data.orderId || "",
          totalAmount: data.totalAmount || 0,
          paymentMethod: data.paymentMethod || "Cash",
          status: data.status || "",
          createdAt: data.createdAt,
          items: data.items || [],
          deliveryFee: data.deliveryFee || 0,
        });
      });

      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const parseDate = (dateStr: string): Date | null => {
    // Parse DD/MM/YYYY format
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    return null;
  };

  const formatDateDisplay = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const applyCustomRange = () => {
    const start = parseDate(customStartDate);
    const end = parseDate(customEndDate);

    if (start && end) {
      // Set end date to end of day
      end.setHours(23, 59, 59, 999);
      setAppliedStartDate(start);
      setAppliedEndDate(end);
      setPeriod("custom");
      setShowDateModal(false);
    }
  };

  const openDatePicker = (type: "start" | "end") => {
    setCurrentPicker(type);
    const now = new Date();
    if (type === "start" && customStartDate) {
      const parsed = parseDate(customStartDate);
      if (parsed) {
        setSelectedDay(parsed.getDate());
        setSelectedMonth(parsed.getMonth() + 1);
        setSelectedYear(parsed.getFullYear());
      }
    } else if (type === "end" && customEndDate) {
      const parsed = parseDate(customEndDate);
      if (parsed) {
        setSelectedDay(parsed.getDate());
        setSelectedMonth(parsed.getMonth() + 1);
        setSelectedYear(parsed.getFullYear());
      }
    } else {
      setSelectedDay(now.getDate());
      setSelectedMonth(now.getMonth() + 1);
      setSelectedYear(now.getFullYear());
    }
    if (type === "start") {
      setShowStartPicker(true);
    } else {
      setShowEndPicker(true);
    }
  };

  const confirmDateSelection = () => {
    const dateStr = `${selectedDay.toString().padStart(2, "0")}/${selectedMonth.toString().padStart(2, "0")}/${selectedYear}`;
    if (currentPicker === "start") {
      setCustomStartDate(dateStr);
      setShowStartPicker(false);
    } else {
      setCustomEndDate(dateStr);
      setShowEndPicker(false);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i);

  const getStartDate = (period: Period): Date => {
    const now = new Date();
    switch (period) {
      case "today":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case "week":
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo;
      case "month":
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo;
      case "all":
        return new Date(0);
      case "custom":
        return appliedStartDate || new Date(0);
    }
  };

  const calculateStats = () => {
    let filteredOrders: OrderData[];

    if (period === "custom" && appliedStartDate && appliedEndDate) {
      filteredOrders = orders.filter((order) => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.toDate();
        return orderDate >= appliedStartDate && orderDate <= appliedEndDate;
      });
    } else {
      const startDate = getStartDate(period);
      filteredOrders = orders.filter((order) => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.toDate();
        return orderDate >= startDate;
      });
    }

    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const cashOrders = filteredOrders.filter((o) => o.paymentMethod === "Cash").length;
    const onlineOrders = filteredOrders.filter((o) => o.paymentMethod === "Online").length;

    const cashRevenue = filteredOrders
      .filter((o) => o.paymentMethod === "Cash")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const onlineRevenue = filteredOrders
      .filter((o) => o.paymentMethod === "Online")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const totalItems = filteredOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);

    // Delivery stats
    const deliveryRevenue = filteredOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
    const paidDeliveryOrders = filteredOrders.filter((o) => (o.deliveryFee || 0) > 0).length;
    const freeDeliveryOrders = filteredOrders.filter((o) => (o.deliveryFee || 0) === 0).length;

    setStats({
      totalOrders,
      totalRevenue,
      avgOrderValue,
      cashOrders,
      onlineOrders,
      cashRevenue,
      onlineRevenue,
      totalItems,
      deliveryRevenue,
      paidDeliveryOrders,
      freeDeliveryOrders,
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  const getFilteredOrders = () => {
    if (period === "custom" && appliedStartDate && appliedEndDate) {
      return orders.filter((order) => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.toDate();
        return orderDate >= appliedStartDate && orderDate <= appliedEndDate;
      });
    } else {
      const startDate = getStartDate(period);
      return orders.filter((order) => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.toDate();
        return orderDate >= startDate;
      });
    }
  };

  const getPeriodLabel = () => {
    if (period === "today") return "Today";
    if (period === "week") return "This Week";
    if (period === "month") return "This Month";
    if (period === "all") return "All Time";
    if (period === "custom" && appliedStartDate && appliedEndDate) {
      return `${formatDateDisplay(appliedStartDate)} to ${formatDateDisplay(appliedEndDate)}`;
    }
    return "";
  };

  const downloadExcel = async () => {
    setDownloading(true);
    try {
      const filteredOrders = getFilteredOrders();
      const periodLabel = getPeriodLabel();

      // Create CSV content with BOM for Excel compatibility
      let csvContent = "\uFEFF"; // BOM for UTF-8
      csvContent += "Sales Report - Dhiva Deva Super Markets\n";
      csvContent += `Period: ${periodLabel}\n`;
      csvContent += `Generated: ${new Date().toLocaleString("en-IN")}\n\n`;

      // Summary section
      csvContent += "SUMMARY\n";
      csvContent += `Total Revenue,${stats.totalRevenue.toFixed(2)}\n`;
      csvContent += `Total Orders,${stats.totalOrders}\n`;
      csvContent += `Average Order Value,${stats.avgOrderValue.toFixed(2)}\n`;
      csvContent += `Total Items Sold,${stats.totalItems}\n\n`;

      // Payment breakdown
      csvContent += "PAYMENT BREAKDOWN\n";
      csvContent += `Cash Orders,${stats.cashOrders}\n`;
      csvContent += `Cash Revenue,${stats.cashRevenue.toFixed(2)}\n`;
      csvContent += `Online Orders,${stats.onlineOrders}\n`;
      csvContent += `Online Revenue,${stats.onlineRevenue.toFixed(2)}\n\n`;

      // Delivery breakdown
      csvContent += "DELIVERY BREAKDOWN\n";
      csvContent += `Delivery Revenue,${stats.deliveryRevenue.toFixed(2)}\n`;
      csvContent += `Paid Deliveries,${stats.paidDeliveryOrders}\n`;
      csvContent += `Free Deliveries,${stats.freeDeliveryOrders}\n\n`;

      // Order details
      csvContent += "ORDER DETAILS\n";
      csvContent += "Order ID,Date,Time,Payment Method,Items,Delivery Fee,Total Amount,Status\n";

      filteredOrders.forEach((order) => {
        const orderDate = order.createdAt?.toDate() || new Date();
        const dateStr = orderDate.toLocaleDateString("en-IN");
        const timeStr = orderDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        const itemCount = order.items?.length || 0;

        csvContent += `"${order.orderId}","${dateStr}","${timeStr}","${order.paymentMethod}",${itemCount},${(order.deliveryFee || 0).toFixed(2)},${order.totalAmount.toFixed(2)},"${order.status}"\n`;
      });

      // Use cacheDirectory for better sharing support on Android
      const directory = Platform.OS === "android" ? FileSystem.cacheDirectory : FileSystem.documentDirectory;
      const fileName = `SalesReport_${periodLabel.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.csv`;
      const filePath = `${directory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: "text/csv",
          dialogTitle: "Download Sales Report (Excel)",
          UTI: "public.comma-separated-values-text",
        });

        Toast.show({
          type: "success",
          text1: "Report Ready",
          text2: "Excel report has been generated",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Sharing Not Available",
          text2: "Cannot share files on this device",
        });
      }
    } catch (error: any) {
      console.error("Error downloading Excel:", error);
      Toast.show({
        type: "error",
        text1: "Download Failed",
        text2: error?.message || "Failed to generate Excel report",
      });
    } finally {
      setDownloading(false);
      setShowDownloadModal(false);
    }
  };

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const filteredOrders = getFilteredOrders();
      const periodLabel = getPeriodLabel();

      // Generate HTML for PDF
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
              margin: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #1D5A34;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #1D5A34;
              margin: 0;
              font-size: 24px;
            }
            .header p {
              color: #666;
              margin: 5px 0 0 0;
            }
            .period {
              background: #f0fdf4;
              padding: 10px 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              text-align: center;
            }
            .period span {
              color: #15803d;
              font-weight: bold;
            }
            .stats-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 15px;
              margin-bottom: 25px;
            }
            .stat-card {
              flex: 1;
              min-width: 140px;
              background: #f9fafb;
              border-radius: 10px;
              padding: 15px;
              text-align: center;
              border: 1px solid #e5e7eb;
            }
            .stat-card .value {
              font-size: 20px;
              font-weight: bold;
              color: #111;
            }
            .stat-card .label {
              font-size: 12px;
              color: #6b7280;
              margin-top: 5px;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 1px solid #e5e7eb;
            }
            .breakdown-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .breakdown-row:last-child {
              border-bottom: none;
            }
            .breakdown-label {
              color: #4b5563;
            }
            .breakdown-value {
              font-weight: bold;
              color: #111;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 10px;
            }
            th {
              background: #1D5A34;
              color: white;
              padding: 8px 6px;
              text-align: left;
              font-weight: 600;
            }
            td {
              padding: 6px;
              border-bottom: 1px solid #e5e7eb;
              word-break: break-word;
            }
            tr:nth-child(even) {
              background: #f9fafb;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #9ca3af;
              font-size: 11px;
            }
            .cash { color: #66bb6a; }
            .online { color: #3b82f6; }
            @media print {
              body { padding: 10px; }
              .stat-card { page-break-inside: avoid; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Dhiva Deva Super Markets</h1>
            <p>Sales Report</p>
          </div>

          <div class="period">
            Period: <span>${periodLabel}</span>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="value">Rs.${stats.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
              <div class="label">Total Revenue</div>
            </div>
            <div class="stat-card">
              <div class="value">${stats.totalOrders}</div>
              <div class="label">Total Orders</div>
            </div>
            <div class="stat-card">
              <div class="value">Rs.${stats.avgOrderValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
              <div class="label">Avg Order Value</div>
            </div>
            <div class="stat-card">
              <div class="value">${stats.totalItems}</div>
              <div class="label">Items Sold</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Payment Breakdown</div>
            <div class="breakdown-row">
              <span class="breakdown-label">Cash Payments (${stats.cashOrders} orders)</span>
              <span class="breakdown-value cash">Rs.${stats.cashRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="breakdown-row">
              <span class="breakdown-label">Online Payments (${stats.onlineOrders} orders)</span>
              <span class="breakdown-value online">Rs.${stats.onlineRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Delivery Breakdown</div>
            <div class="breakdown-row">
              <span class="breakdown-label">Delivery Revenue (${stats.paidDeliveryOrders} paid)</span>
              <span class="breakdown-value">Rs.${stats.deliveryRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="breakdown-row">
              <span class="breakdown-label">Free Deliveries</span>
              <span class="breakdown-value">${stats.freeDeliveryOrders} orders</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Order Details (${filteredOrders.length} orders)</div>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Items</th>
                  <th>Delivery</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredOrders.slice(0, 100).map((order) => {
                  const orderDate = order.createdAt?.toDate() || new Date();
                  return `
                    <tr>
                      <td>${order.orderId || '-'}</td>
                      <td>${orderDate.toLocaleDateString("en-IN")}</td>
                      <td>${order.paymentMethod || '-'}</td>
                      <td>${order.items?.length || 0}</td>
                      <td>Rs.${(order.deliveryFee || 0).toFixed(2)}</td>
                      <td>Rs.${order.totalAmount.toFixed(2)}</td>
                      <td>${order.status || '-'}</td>
                    </tr>
                  `;
                }).join("")}
                ${filteredOrders.length > 100 ? `<tr><td colspan="7" style="text-align:center;color:#666;padding:15px;">... and ${filteredOrders.length - 100} more orders</td></tr>` : ""}
              </tbody>
            </table>
          </div>

          <div class="footer">
            Generated on ${new Date().toLocaleString("en-IN")} | Dhiva Deva Super Markets
          </div>
        </body>
        </html>
      `;

      // Generate PDF with proper options
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 612, // Letter width in points
        height: 792, // Letter height in points
      });

      // Use cacheDirectory for better sharing support on Android
      const directory = Platform.OS === "android" ? FileSystem.cacheDirectory : FileSystem.documentDirectory;
      const fileName = `SalesReport_${periodLabel.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.pdf`;
      const newPath = `${directory}${fileName}`;

      // Check if file exists and delete it first
      const fileInfo = await FileSystem.getInfoAsync(newPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(newPath, { idempotent: true });
      }

      // Move the generated PDF to our desired location
      await FileSystem.moveAsync({ from: uri, to: newPath });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(newPath, {
          mimeType: "application/pdf",
          dialogTitle: "Download Sales Report (PDF)",
          UTI: "com.adobe.pdf",
        });

        Toast.show({
          type: "success",
          text1: "Report Ready",
          text2: "PDF report has been generated",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Sharing Not Available",
          text2: "Cannot share files on this device",
        });
      }
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      Toast.show({
        type: "error",
        text1: "Download Failed",
        text2: error?.message || "Failed to generate PDF report",
      });
    } finally {
      setDownloading(false);
      setShowDownloadModal(false);
    }
  };

  const StatCard = ({
    icon: Icon,
    iconBg,
    iconColor,
    title,
    value,
    subtitle,
  }: {
    icon: any;
    iconBg: string;
    iconColor: string;
    title: string;
    value: string;
    subtitle?: string;
  }) => (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        minWidth: "47%",
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          backgroundColor: iconBg,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Icon size={22} color={iconColor} />
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
        {title}
      </Text>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>
        {value}
      </Text>
      {subtitle && (
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const PeriodButton = ({ label, value }: { label: string; value: Period }) => (
    <Pressable
      onPress={() => setPeriod(value)}
      style={{
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: period === value ? colors.primary : colors.card,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: period === value ? "#FFFFFF" : colors.text,
          fontWeight: "600",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
          Loading reports...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
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
          <Text
            style={{ fontSize: 20, fontWeight: "bold", color: colors.text, marginLeft: 12 }}
          >
            Sales Report
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => setShowDownloadModal(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: isDark ? "#14532D" : "#E8F5E9",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Download size={20} color="#66BB6A" />
          </Pressable>
          <Pressable
            onPress={handleRefresh}
            disabled={refreshing}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <RefreshCw size={20} color={colors.textSecondary} />
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 16) + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View
          style={{
            flexDirection: "row",
            gap: 6,
            marginBottom: 12,
            backgroundColor: colors.card,
            padding: 6,
            borderRadius: 14,
          }}
        >
          <PeriodButton label="Today" value="today" />
          <PeriodButton label="Week" value="week" />
          <PeriodButton label="Month" value="month" />
          <PeriodButton label="All" value="all" />
        </View>

        {/* Custom Range Button */}
        <Pressable
          onPress={() => setShowDateModal(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: period === "custom" ? colors.primary : colors.card,
            padding: 12,
            borderRadius: 12,
            marginBottom: 20,
            gap: 8,
          }}
        >
          <CalendarRange size={18} color={period === "custom" ? "#FFFFFF" : colors.text} />
          <Text
            style={{
              color: period === "custom" ? "#FFFFFF" : colors.text,
              fontWeight: "600",
              fontSize: 14,
            }}
          >
            {period === "custom" && appliedStartDate && appliedEndDate
              ? `${formatDateDisplay(appliedStartDate)} - ${formatDateDisplay(appliedEndDate)}`
              : "Custom Date Range"}
          </Text>
        </Pressable>

        {/* Main Stats */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <StatCard
            icon={DollarSign}
            iconBg={isDark ? "#14532D" : "#E8F5E9"}
            iconColor="#66BB6A"
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
          />
          <StatCard
            icon={ShoppingCart}
            iconBg={isDark ? "#1E3A8A" : "#DBEAFE"}
            iconColor="#3B82F6"
            title="Total Orders"
            value={stats.totalOrders.toString()}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <StatCard
            icon={TrendingUp}
            iconBg={isDark ? "#581C87" : "#F3E8FF"}
            iconColor="#9333EA"
            title="Avg Order Value"
            value={formatCurrency(stats.avgOrderValue)}
          />
          <StatCard
            icon={Package}
            iconBg={isDark ? "#7C2D12" : "#FFEDD5"}
            iconColor="#F97316"
            title="Items Sold"
            value={stats.totalItems.toString()}
          />
        </View>

        {/* Payment Breakdown */}
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
              marginBottom: 16,
            }}
          >
            Payment Breakdown
          </Text>

          {/* Cash */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                backgroundColor: isDark ? "#14532D" : "#E8F5E9",
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Banknote size={22} color="#66BB6A" />
            </View>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>
                Cash Payments
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                {stats.cashOrders} orders
              </Text>
            </View>
            <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 16 }}>
              {formatCurrency(stats.cashRevenue)}
            </Text>
          </View>

          {/* Online */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                backgroundColor: isDark ? "#1E3A8A" : "#DBEAFE",
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CreditCard size={22} color="#3B82F6" />
            </View>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>
                Online Payments
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                {stats.onlineOrders} orders
              </Text>
            </View>
            <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 16 }}>
              {formatCurrency(stats.onlineRevenue)}
            </Text>
          </View>
        </View>

        {/* Delivery Breakdown */}
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
              marginBottom: 16,
            }}
          >
            Delivery Breakdown
          </Text>

          {/* Delivery Revenue */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                backgroundColor: isDark ? "#7C2D12" : "#FFEDD5",
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Truck size={22} color="#F97316" />
            </View>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>
                Delivery Revenue
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                {stats.paidDeliveryOrders} paid deliveries
              </Text>
            </View>
            <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 16 }}>
              {formatCurrency(stats.deliveryRevenue)}
            </Text>
          </View>

          {/* Free Deliveries */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                backgroundColor: isDark ? "#14532D" : "#E8F5E9",
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Truck size={22} color="#66BB6A" />
            </View>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>
                Free Deliveries
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                {stats.freeDeliveryOrders} orders
              </Text>
            </View>
            <Text style={{ color: "#66BB6A", fontWeight: "bold", fontSize: 16 }}>
              Free
            </Text>
          </View>
        </View>

        {/* Revenue Distribution Bar */}
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
              marginBottom: 16,
            }}
          >
            Revenue Distribution
          </Text>

          <View
            style={{
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.border,
              flexDirection: "row",
              overflow: "hidden",
            }}
          >
            {stats.totalRevenue > 0 && (
              <>
                <View
                  style={{
                    width: `${(stats.cashRevenue / stats.totalRevenue) * 100}%`,
                    backgroundColor: "#66BB6A",
                    height: "100%",
                  }}
                />
                <View
                  style={{
                    width: `${(stats.onlineRevenue / stats.totalRevenue) * 100}%`,
                    backgroundColor: "#3B82F6",
                    height: "100%",
                  }}
                />
              </>
            )}
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  backgroundColor: "#66BB6A",
                  marginRight: 8,
                }}
              />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                Cash ({stats.totalRevenue > 0 ? Math.round((stats.cashRevenue / stats.totalRevenue) * 100) : 0}%)
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  backgroundColor: "#3B82F6",
                  marginRight: 8,
                }}
              />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                Online ({stats.totalRevenue > 0 ? Math.round((stats.onlineRevenue / stats.totalRevenue) * 100) : 0}%)
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Card */}
        <View
          style={{
            backgroundColor: isDark ? "#14532D" : "#F0FDF4",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Calendar size={20} color="#66BB6A" />
            <Text
              style={{
                color: isDark ? "#86EFAC" : "#15803D",
                fontWeight: "600",
                fontSize: 15,
                marginLeft: 8,
              }}
            >
              Period Summary
            </Text>
          </View>
          <Text style={{ color: isDark ? "#6EE7B7" : "#166534", fontSize: 14, lineHeight: 22 }}>
            {period === "today" && "Today's"}
            {period === "week" && "This week's"}
            {period === "month" && "This month's"}
            {period === "all" && "All time"}
            {period === "custom" && appliedStartDate && appliedEndDate && `${formatDateDisplay(appliedStartDate)} to ${formatDateDisplay(appliedEndDate)}`} total revenue is{" "}
            <Text style={{ fontWeight: "bold" }}>{formatCurrency(stats.totalRevenue)}</Text> from{" "}
            <Text style={{ fontWeight: "bold" }}>{stats.totalOrders}</Text> orders with an average
            order value of <Text style={{ fontWeight: "bold" }}>{formatCurrency(stats.avgOrderValue)}</Text>.
          </Text>
        </View>
      </ScrollView>

      {/* Custom Date Range Modal */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
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
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
                Custom Date Range
              </Text>
              <Pressable
                onPress={() => setShowDateModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Start Date */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 13,
                  fontWeight: "500",
                  marginBottom: 8,
                }}
              >
                Start Date
              </Text>
              <Pressable
                onPress={() => openDatePicker("start")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: customStartDate ? colors.primary : colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                }}
              >
                <Calendar size={20} color={customStartDate ? colors.primary : colors.textMuted} />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    color: customStartDate ? colors.text : colors.textMuted,
                    fontSize: 15,
                  }}
                >
                  {customStartDate || "Select start date"}
                </Text>
              </Pressable>
            </View>

            {/* End Date */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 13,
                  fontWeight: "500",
                  marginBottom: 8,
                }}
              >
                End Date
              </Text>
              <Pressable
                onPress={() => openDatePicker("end")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: customEndDate ? colors.primary : colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                }}
              >
                <Calendar size={20} color={customEndDate ? colors.primary : colors.textMuted} />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    color: customEndDate ? colors.text : colors.textMuted,
                    fontSize: 15,
                  }}
                >
                  {customEndDate || "Select end date"}
                </Text>
              </Pressable>
            </View>

            {/* Apply Button */}
            <Pressable
              onPress={applyCustomRange}
              disabled={!customStartDate || !customEndDate}
              style={{
                backgroundColor:
                  customStartDate && customEndDate ? colors.primary : colors.border,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: customStartDate && customEndDate ? "#FFFFFF" : colors.textMuted,
                  fontWeight: "700",
                  fontSize: 16,
                }}
              >
                Apply Range
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showStartPicker || showEndPicker}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowStartPicker(false);
          setShowEndPicker(false);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 20,
              paddingBottom: Math.max(insets.bottom, 20),
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                marginBottom: 20,
              }}
            >
              <Pressable
                onPress={() => {
                  setShowStartPicker(false);
                  setShowEndPicker(false);
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Cancel</Text>
              </Pressable>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: "600" }}>
                {currentPicker === "start" ? "Start Date" : "End Date"}
              </Text>
              <Pressable onPress={confirmDateSelection}>
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>Done</Text>
              </Pressable>
            </View>

            {/* Date Selectors */}
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: 16,
                gap: 8,
              }}
            >
              {/* Day Selector */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    fontWeight: "500",
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                >
                  Day
                </Text>
                <ScrollView
                  style={{
                    height: 180,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  {Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1).map(
                    (day) => (
                      <Pressable
                        key={day}
                        onPress={() => setSelectedDay(day)}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          backgroundColor: selectedDay === day ? colors.primary : "transparent",
                          borderRadius: 8,
                          marginHorizontal: 4,
                          marginVertical: 2,
                        }}
                      >
                        <Text
                          style={{
                            color: selectedDay === day ? "#FFFFFF" : colors.text,
                            fontSize: 16,
                            textAlign: "center",
                            fontWeight: selectedDay === day ? "600" : "400",
                          }}
                        >
                          {day}
                        </Text>
                      </Pressable>
                    )
                  )}
                </ScrollView>
              </View>

              {/* Month Selector */}
              <View style={{ flex: 1.2 }}>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    fontWeight: "500",
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                >
                  Month
                </Text>
                <ScrollView
                  style={{
                    height: 180,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  {months.map((month, index) => (
                    <Pressable
                      key={month}
                      onPress={() => {
                        setSelectedMonth(index + 1);
                        const maxDays = getDaysInMonth(index + 1, selectedYear);
                        if (selectedDay > maxDays) setSelectedDay(maxDays);
                      }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: selectedMonth === index + 1 ? colors.primary : "transparent",
                        borderRadius: 8,
                        marginHorizontal: 4,
                        marginVertical: 2,
                      }}
                    >
                      <Text
                        style={{
                          color: selectedMonth === index + 1 ? "#FFFFFF" : colors.text,
                          fontSize: 16,
                          textAlign: "center",
                          fontWeight: selectedMonth === index + 1 ? "600" : "400",
                        }}
                      >
                        {month}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Year Selector */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    fontWeight: "500",
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                >
                  Year
                </Text>
                <ScrollView
                  style={{
                    height: 180,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  {years.map((year) => (
                    <Pressable
                      key={year}
                      onPress={() => {
                        setSelectedYear(year);
                        const maxDays = getDaysInMonth(selectedMonth, year);
                        if (selectedDay > maxDays) setSelectedDay(maxDays);
                      }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: selectedYear === year ? colors.primary : "transparent",
                        borderRadius: 8,
                        marginHorizontal: 4,
                        marginVertical: 2,
                      }}
                    >
                      <Text
                        style={{
                          color: selectedYear === year ? "#FFFFFF" : colors.text,
                          fontSize: 16,
                          textAlign: "center",
                          fontWeight: selectedYear === year ? "600" : "400",
                        }}
                      >
                        {year}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Selected Date Preview */}
            <View
              style={{
                marginTop: 16,
                marginHorizontal: 20,
                padding: 14,
                backgroundColor: isDark ? "#14532D" : "#F0FDF4",
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: isDark ? "#86EFAC" : "#15803D", fontSize: 18, fontWeight: "600" }}>
                {selectedDay.toString().padStart(2, "0")}/{selectedMonth.toString().padStart(2, "0")}/{selectedYear}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Download Modal */}
      <Modal
        visible={showDownloadModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDownloadModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 20,
              width: "100%",
              maxWidth: 340,
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
                Download Report
              </Text>
              <Pressable
                onPress={() => setShowDownloadModal(false)}
                disabled={downloading}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Period Info */}
            <View
              style={{
                backgroundColor: isDark ? "#14532D" : "#F0FDF4",
                padding: 12,
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <Text style={{ color: isDark ? "#86EFAC" : "#15803D", fontSize: 13, textAlign: "center" }}>
                Period: <Text style={{ fontWeight: "bold" }}>{getPeriodLabel()}</Text>
              </Text>
              <Text style={{ color: isDark ? "#6EE7B7" : "#166534", fontSize: 12, textAlign: "center", marginTop: 4 }}>
                {stats.totalOrders} orders | {formatCurrency(stats.totalRevenue)}
              </Text>
            </View>

            {/* Download Options */}
            <View style={{ gap: 12 }}>
              {/* Excel Download */}
              <Pressable
                onPress={downloadExcel}
                disabled={downloading}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "#14532D" : "#E8F5E9",
                  padding: 16,
                  borderRadius: 14,
                  opacity: downloading ? 0.6 : 1,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: isDark ? "#166534" : "#BBF7D0",
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileSpreadsheet size={24} color="#66BB6A" />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ color: isDark ? "#86EFAC" : "#15803D", fontWeight: "bold", fontSize: 16 }}>
                    Download Excel
                  </Text>
                  <Text style={{ color: isDark ? "#6EE7B7" : "#66BB6A", fontSize: 12, marginTop: 2 }}>
                    CSV format - Compatible with Excel
                  </Text>
                </View>
                {downloading ? (
                  <ActivityIndicator size="small" color="#66BB6A" />
                ) : (
                  <Download size={20} color="#66BB6A" />
                )}
              </Pressable>

              {/* PDF Download */}
              <Pressable
                onPress={downloadPDF}
                disabled={downloading}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2",
                  padding: 16,
                  borderRadius: 14,
                  opacity: downloading ? 0.6 : 1,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: isDark ? "#991B1B" : "#FECACA",
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText size={24} color="#EF4444" />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ color: isDark ? "#FCA5A5" : "#B91C1C", fontWeight: "bold", fontSize: 16 }}>
                    Download PDF
                  </Text>
                  <Text style={{ color: isDark ? "#FCA5A5" : "#DC2626", fontSize: 12, marginTop: 2 }}>
                    Formatted report with charts
                  </Text>
                </View>
                {downloading ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Download size={20} color="#EF4444" />
                )}
              </Pressable>
            </View>

            {/* Cancel Button */}
            <Pressable
              onPress={() => setShowDownloadModal(false)}
              disabled={downloading}
              style={{
                marginTop: 16,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: "600", fontSize: 15 }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
