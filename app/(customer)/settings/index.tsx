import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  User,
  Bell,
  Moon,
  Globe,
  Lock,
  Trash2,
  ChevronRight,
  Mail,
  MessageSquare,
  Smartphone,
  Info,
  Star,
  Share2,
  LogOut,
} from "lucide-react-native";
import { router } from "expo-router";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../src/services/firebase/config";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import Toast from "react-native-toast-message";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!user?.uid) {
      setShowDeleteModal(false);
      return;
    }

    setIsDeleting(true);
    try {
      // Soft delete - mark account as deleted and deactivate
      await updateDoc(doc(db, "users", user.uid), {
        isActive: false,
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deletionReason: "User requested account deletion",
      });

      setShowDeleteModal(false);

      Toast.show({
        type: "success",
        text1: "Account Deleted",
        text2: "Your account has been successfully deleted",
      });

      // Log out the user after short delay
      setTimeout(async () => {
        await logout();
      }, 1000);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to delete account. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const SettingItem = ({
    icon: Icon,
    label,
    description,
    onPress,
    showArrow = true,
    iconColor = "#1D5C45",
    iconBgColor,
  }: any) => (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.card,
      }}
    >
      <View style={{
        width: 40,
        height: 40,
        backgroundColor: iconBgColor || (isDark ? '#14532D' : '#E8F5E9'),
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={{ color: colors.text, fontWeight: '600' }}>{label}</Text>
        {description && (
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{description}</Text>
        )}
      </View>
      {showArrow && <ChevronRight size={20} color={colors.textMuted} />}
    </Pressable>
  );

  const ToggleItem = ({
    icon: Icon,
    label,
    description,
    value,
    onValueChange,
    iconColor = "#1D5C45",
    iconBgColor,
  }: any) => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.card
    }}>
      <View style={{
        width: 40,
        height: 40,
        backgroundColor: iconBgColor || (isDark ? '#14532D' : '#E8F5E9'),
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={{ color: colors.text, fontWeight: '600' }}>{label}</Text>
        {description && (
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: "#1D5C45" }}
        thumbColor="#fff"
      />
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={{
      color: colors.textSecondary,
      fontWeight: '600',
      fontSize: 14,
      marginLeft: 16,
      marginTop: 16,
      marginBottom: 8
    }}>
      {title}
    </Text>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: colors.surfaceSecondary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
      }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            backgroundColor: colors.card,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12
          }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Settings</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Settings */}
        <SectionHeader title="Account" />
        <View style={{ marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' }}>
          <SettingItem
            icon={User}
            label="Edit Profile"
            description="Update your personal information"
            onPress={() => router.push("/(customer)/settings/profile")}
          />
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 }} />
          <SettingItem
            icon={Lock}
            label="Change Password"
            description="Update your password"
            onPress={() => router.push("/(customer)/settings/password")}
          />
        </View>

        {/* Notification Settings */}
        <SectionHeader title="Notifications" />
        <View style={{ marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' }}>
          <ToggleItem
            icon={Bell}
            label="Push Notifications"
            description="Receive push notifications"
            value={pushNotifications}
            onValueChange={setPushNotifications}
            iconColor="#EAB308"
            iconBgColor={isDark ? '#713F12' : '#FEF9C3'}
          />
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 }} />
          <ToggleItem
            icon={Mail}
            label="Email Notifications"
            description="Receive email updates"
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            iconColor="#3B82F6"
            iconBgColor={isDark ? '#1E3A8A' : '#DBEAFE'}
          />
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 }} />
          <ToggleItem
            icon={MessageSquare}
            label="SMS Notifications"
            description="Receive SMS alerts"
            value={smsNotifications}
            onValueChange={setSmsNotifications}
            iconColor="#10B981"
            iconBgColor={isDark ? '#064E3B' : '#D1FAE5'}
          />
        </View>

        {/* Preferences */}
        <SectionHeader title="Preferences" />
        <View style={{ marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' }}>
          <ToggleItem
            icon={Smartphone}
            label="Order Updates"
            description="Get notified about order status"
            value={orderUpdates}
            onValueChange={setOrderUpdates}
            iconColor="#6366F1"
            iconBgColor={isDark ? '#312E81' : '#E0E7FF'}
          />
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 }} />
          <ToggleItem
            icon={Star}
            label="Promotions & Offers"
            description="Receive special deals and discounts"
            value={promotions}
            onValueChange={setPromotions}
            iconColor="#F59E0B"
            iconBgColor={isDark ? '#78350F' : '#FEF3C7'}
          />
        </View>

        {/* App Settings */}
        <SectionHeader title="App" />
        <View style={{ marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' }}>
          <ToggleItem
            icon={Moon}
            label="Dark Mode"
            description="Enable dark theme"
            value={isDark}
            onValueChange={toggleTheme}
            iconColor="#9333EA"
            iconBgColor={isDark ? '#581C87' : '#F3E8FF'}
          />
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 }} />
          <SettingItem
            icon={Globe}
            label="Language"
            description="English"
            iconColor="#06B6D4"
            iconBgColor={isDark ? '#164E63' : '#CFFAFE'}
            onPress={() => {
              Toast.show({
                type: "info",
                text1: "Coming Soon",
                text2: "Language settings will be available soon",
              });
            }}
          />
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 }} />
          <SettingItem
            icon={Info}
            label="About"
            description="App version and info"
            iconColor="#8B5CF6"
            iconBgColor={isDark ? '#4C1D95' : '#EDE9FE'}
            onPress={() => router.push("/(customer)/settings/about")}
          />
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 }} />
          <SettingItem
            icon={LogOut}
            label="Logout"
            description="Sign out of your account"
            onPress={() => {
              // For customers, logout should navigate to login
              logout();
              router.replace("/(auth)/login");
            }}
            iconColor="#EF4444"
            iconBgColor={isDark ? '#7F1D1D' : '#FEE2E2'}
          />
        </View>

        {/* Danger Zone */}
        <SectionHeader title="Danger Zone" />
        <View style={{ marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
          <SettingItem
            icon={Trash2}
            label="Delete Account"
            description="Permanently delete your account"
            onPress={handleDeleteAccount}
            iconColor="#EF4444"
            iconBgColor={isDark ? '#7F1D1D' : '#FEE2E2'}
            showArrow={false}
          />
        </View>
      </ScrollView>

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Account"
        message="Are you sure you want to delete your account? Your account will be deactivated and you will be logged out. Contact support if you want to recover your account."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="delete"
        onConfirm={confirmDeleteAccount}
        onCancel={() => !isDeleting && setShowDeleteModal(false)}
        loading={isDeleting}
      />
    </SafeAreaView>
  );
}
