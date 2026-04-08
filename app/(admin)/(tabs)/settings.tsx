import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Printer,
  ChevronRight,
  Bell,
  Moon,
  LogOut,
  Store,
  Phone,
  Mail,
  Shield,
  HelpCircle,
  FileText,
  BarChart3,
  Users,
  Building2,
  Crown,
  Truck,
  ClipboardList,
  Package,
  MessageCircle,
  Tag,
  Play,
  Clapperboard,
  Receipt,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { usePermissions } from "../../../src/context/PermissionContext";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";

const Logo = require("../../../assets/images/logo.png");

export default function SettingsScreen() {
  const { user, userProfile, logout } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const { isAdmin, hasPermission } = usePermissions();

  const [notifications, setNotifications] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Get user display info
  const displayName = userProfile?.displayName || user?.displayName || "Admin";
  const email = userProfile?.email || user?.email || "";
  const phone = userProfile?.phone || "";
  const initials = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace("/(auth)/login");
  };

  const SettingItem = ({
    icon: Icon,
    iconBg,
    iconColor,
    title,
    subtitle,
    onPress,
    rightElement,
    showBorder = false
  }: {
    icon: any;
    iconBg: string;
    iconColor: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showBorder?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-4"
      style={{
        borderBottomWidth: showBorder ? 1 : 0,
        borderBottomColor: colors.border,
      }}
    >
      <View
        className="w-11 h-11 rounded-xl items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={22} color={iconColor} />
      </View>
      <View className="ml-4 flex-1">
        <Text className="font-semibold text-base" style={{ color: colors.text }}>
          {title}
        </Text>
        {subtitle && (
          <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (onPress && <ChevronRight size={20} color={colors.textMuted} />)}
    </Pressable>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text
      style={{
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 13,
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5,
      }}
    >
      {title}
    </Text>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.surface }} edges={["top","bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="bg-transparent"
      >
        {/* Header */}
        <View
          className="px-5 pt-4 pb-8"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' }}>Settings</Text>
            <Image
              source={Logo}
              style={{ width: 45, height: 45 }}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Profile Card */}
        <View className="px-4 mt-[-20px]">
          <Pressable
            className="rounded-2xl p-5"
            style={{
              backgroundColor: colors.card,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' }}>
                  {initials}
                </Text>
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: colors.text, fontSize: 18 }}>
                  {displayName}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Mail size={14} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 14, marginLeft: 6 }}>
                    {email}
                  </Text>
                </View>
                {phone && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Phone size={14} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 14, marginLeft: 6 }}>
                      {phone}
                    </Text>
                  </View>
                )}
              </View>
              <View
                style={{
                  backgroundColor: isDark ? '#14532D' : '#E8F5E9',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: '#1D5A34', fontWeight: '600', fontSize: 12, textTransform: 'capitalize' }}>
                  {userProfile?.role || 'Admin'}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Store Settings Section */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <SectionHeader title="STORE MANAGEMENT" />
          <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' }}>
            <SettingItem
              icon={Store}
              iconBg={isDark ? '#1E3A8A' : '#DBEAFE'}
              iconColor="#3B82F6"
              title="Store Information"
              subtitle="Name, address, and contact details"
              onPress={() => router.push("/(admin)/settings/store-info")}
            />
            {isAdmin && hasPermission("users.view") && (
              <SettingItem
                icon={Users}
                iconBg={isDark ? '#7C2D12' : '#FEF3C7'}
                iconColor="#D97706"
                title="User Management"
                subtitle="Manage staff, roles and permissions"
                onPress={() => router.push("/(admin)/users")}
              />
            )}
            {isAdmin && hasPermission("branches.view") && (
              <SettingItem
                icon={Building2}
                iconBg={isDark ? '#581C87' : '#F3E8FF'}
                iconColor="#9333EA"
                title="Branch Management"
                subtitle="Add and manage store branches"
                onPress={() => router.push("/(admin)/branches")}
              />
            )}
            <SettingItem
              icon={Truck}
              iconBg={isDark ? '#14532D' : '#E8F5E9'}
              iconColor="#66BB6A"
              title="Delivery Charges"
              subtitle="Configure delivery fees & rules"
              onPress={() => router.push("/(admin)/settings/delivery-charges")}
            />
            <SettingItem
              icon={MessageCircle}
              iconBg={isDark ? '#064E3B' : '#D1FAE5'}
              iconColor="#25D366"
              title="WhatsApp Orders"
              subtitle="Configure WhatsApp ordering"
              onPress={() => router.push("/(admin)/settings/whatsapp")}
            />
            <SettingItem
              icon={Tag}
              iconBg={isDark ? '#7C2D12' : '#FEF3C7'}
              iconColor="#F59E0B"
              title="Offers & Promotions"
              subtitle="Manage discounts, coupons & deals"
              onPress={() => router.push("/(admin)/offers")}
            />
            <SettingItem
              icon={Clapperboard}
              iconBg={isDark ? '#7F1D1D' : '#FEE2E2'}
              iconColor="#EF4444"
              title="Reels"
              subtitle="Manage video content"
              onPress={() => router.push("/(admin)/reels")}
            />
          </View>
        </View>

        {/* Inventory & Supply Section */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <SectionHeader title="INVENTORY & SUPPLY" />
          <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' }}>
            <SettingItem
              icon={Package}
              iconBg={isDark ? '#14532D' : '#E8F5E9'}
              iconColor="#66BB6A"
              title="Inventory"
              subtitle="Track stock levels and alerts"
              onPress={() => router.push("/(admin)/inventory")}
            />
            <SettingItem
              icon={Truck}
              iconBg={isDark ? '#1E3A8A' : '#DBEAFE'}
              iconColor="#3B82F6"
              title="Suppliers"
              subtitle="Manage your suppliers"
              onPress={() => router.push("/(admin)/suppliers")}
            />
            <SettingItem
              icon={ClipboardList}
              iconBg={isDark ? '#7C2D12' : '#FEF3C7'}
              iconColor="#D97706"
              title="Purchase Orders"
              subtitle="Create and track orders"
              onPress={() => router.push("/(admin)/purchase-orders")}
            />
          </View>
        </View>

        {/* Subscription Section */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <SectionHeader title="SUBSCRIPTION" />
          <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' }}>
            <SettingItem
              icon={Crown}
              iconBg={isDark ? '#713F12' : '#FEF9C3'}
              iconColor="#EAB308"
              title="Subscription Plans"
              subtitle="Manage your subscription"
              onPress={() => router.push("/(admin)/subscription")}
            />
          </View>
        </View>

        {/* Reports Section */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <SectionHeader title="REPORTS" />
          <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' }}>
            <SettingItem
              icon={BarChart3}
              iconBg={isDark ? '#14532D' : '#E8F5E9'}
              iconColor="#66BB6A"
              title="Sales Report"
              subtitle="View sales, revenue and analytics"
              onPress={() => router.push("/(admin)/settings/report")}
            />
          </View>
        </View>

        {/* Printer Section */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <SectionHeader title="PRINTER" />
          <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' }}>
            <SettingItem
              icon={Printer}
              iconBg={isDark ? '#14532D' : '#E8F5E9'}
              iconColor="#1D5A34"
              title="Add Printer"
              subtitle="Configure thermal printer"
              onPress={() => router.push("/(admin)/printer/add")}
            />
            <SettingItem
              icon={Receipt}
              iconBg={isDark ? '#581C87' : '#F3E8FF'}
              iconColor="#9333EA"
              title="Receipt Settings"
              subtitle="Configure receipt content & UPI"
              onPress={() => router.push("/(admin)/settings/receipt-settings")}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <SectionHeader title="PREFERENCES" />
          <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' }}>
            <SettingItem
              icon={Bell}
              iconBg={isDark ? '#713F12' : '#FEF9C3'}
              iconColor="#EAB308"
              title="Notifications"
              subtitle="Receive order alerts"
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.border, true: "#1D5A34" }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <SettingItem
              icon={Moon}
              iconBg={isDark ? '#581C87' : '#F3E8FF'}
              iconColor="#9333EA"
              title="Dark Mode"
              subtitle={isDark ? "Enabled" : "Disabled"}
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: "#1D5A34" }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <SectionHeader title="SUPPORT" />
          <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' }}>
            <SettingItem
              icon={HelpCircle}
              iconBg={isDark ? '#164E63' : '#CFFAFE'}
              iconColor="#06B6D4"
              title="Help & Support"
              subtitle="FAQs and contact support"
              onPress={() => router.push("/(admin)/settings/help-support")}
            />
            <SettingItem
              icon={FileText}
              iconBg={isDark ? '#374151' : '#F3F4F6'}
              iconColor={colors.textSecondary}
              title="Terms of Service"
              subtitle="Read our terms and conditions"
              onPress={() => router.push("/(admin)/settings/terms")}
            />
            <SettingItem
              icon={Shield}
              iconBg={isDark ? '#14532D' : '#E8F5E9'}
              iconColor="#66BB6A"
              title="Privacy Policy"
              subtitle="How we handle your data"
              onPress={() => router.push("/(admin)/settings/privacy")}
            />
          </View>
        </View>

        {/* Logout Button */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Pressable
            onPress={handleLogout}
            style={{
              backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2',
              padding: 16,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogOut size={22} color="#EF4444" />
            <Text style={{ marginLeft: 10, color: '#EF4444', fontWeight: '700', fontSize: 16 }}>
              Log Out
            </Text>
          </Pressable>
        </View>

        {/* App Info */}
        <View style={{ alignItems: 'center', marginTop: 32, paddingBottom: 20 }}>
          <Image
            source={Logo}
            style={{ width: 50, height: 50, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>
            Dhiva Deva Super Markets
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
            Version 1.0.0
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>
            Made with love in India
          </Text>
        </View>
      </ScrollView>

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
    </SafeAreaView>
  );
}
