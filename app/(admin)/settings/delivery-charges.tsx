import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import {
  ChevronLeft,
  Truck,
  Plus,
  Trash2,
  Edit2,
  MapPin,
  IndianRupee,
  Tag,
  Clock,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Calculator,
  Settings,
  Percent,
  Gift,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useTheme } from "../../../src/context/ThemeContext";
import { useDeliveryCharges } from "../../../src/hooks/useDeliveryCharges";
import { useDeliveryConfig } from "../../../src/context/DeliveryConfigContext";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";
import {
  DeliveryZone,
  OrderValueRule,
  DeliveryTimeSlot,
  DiscountType,
} from "../../../src/types/delivery";
import { formatCurrency } from "../../../src/utils/formatters";

type Section = "global" | "zones" | "rules" | "timeslots" | "preview";

export default function DeliveryChargesScreen() {
  const { colors, isDark } = useTheme();
  const {
    config,
    isLoading,
    isEnabled,
    isSaving,
    toggleEnabled,
    updateGlobalSettings,
    addZone,
    updateZone,
    deleteZone,
    addOrderValueRule,
    updateOrderValueRule,
    deleteOrderValueRule,
    updateTimeSlot,
    initializeConfig,
  } = useDeliveryCharges();

  const { calculateCharge } = useDeliveryConfig();

  // UI State
  const [expandedSection, setExpandedSection] = useState<Section>("global");
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [editingRule, setEditingRule] = useState<OrderValueRule | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    visible: boolean;
    type: "zone" | "rule";
    id: string;
    name: string;
  }>({ visible: false, type: "zone", id: "", name: "" });

  // Form State - Global Settings
  const [defaultCharge, setDefaultCharge] = useState("");
  const [freeDeliveryMessage, setFreeDeliveryMessage] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(true);

  // Form State - Zone
  const [zoneForm, setZoneForm] = useState({
    name: "",
    pincodes: "",
    baseCharge: "",
    minOrderAmount: "",
    freeDeliveryThreshold: "",
    priority: "1",
  });

  // Form State - Rule
  const [ruleForm, setRuleForm] = useState({
    name: "",
    minOrderValue: "",
    maxOrderValue: "",
    discountType: "free" as DiscountType,
    discountValue: "",
  });

  // Preview Calculator State
  const [previewPincode, setPreviewPincode] = useState("");
  const [previewOrderValue, setPreviewOrderValue] = useState("");

  // Initialize config if not exists
  useEffect(() => {
    if (!isLoading && !config) {
      initializeConfig();
    }
  }, [isLoading, config, initializeConfig]);

  // Load existing values when config loads
  useEffect(() => {
    if (config) {
      setDefaultCharge(config.defaultCharge?.toString() || "40");
      setFreeDeliveryMessage(
        config.freeDeliveryMessage || "Free delivery on orders above Rs. 500"
      );
      setShowBreakdown(config.showBreakdown ?? true);
    }
  }, [config]);

  const resetZoneForm = () => {
    setZoneForm({
      name: "",
      pincodes: "",
      baseCharge: "",
      minOrderAmount: "",
      freeDeliveryThreshold: "",
      priority: "1",
    });
    setEditingZone(null);
    setShowZoneForm(false);
  };

  const resetRuleForm = () => {
    setRuleForm({
      name: "",
      minOrderValue: "",
      maxOrderValue: "",
      discountType: "free",
      discountValue: "",
    });
    setEditingRule(null);
    setShowRuleForm(false);
  };

  const handleToggleEnabled = async () => {
    try {
      await toggleEnabled(!isEnabled);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: `Delivery charges ${!isEnabled ? "enabled" : "disabled"}`,
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update setting",
      });
    }
  };

  const handleSaveGlobalSettings = async () => {
    try {
      await updateGlobalSettings({
        defaultCharge: parseFloat(defaultCharge) || 40,
        freeDeliveryMessage,
        showBreakdown,
      });
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Settings saved successfully",
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save settings",
      });
    }
  };

  const handleSaveZone = async () => {
    if (!zoneForm.name || !zoneForm.pincodes) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Zone name and pincodes are required",
      });
      return;
    }

    const pincodeArray = zoneForm.pincodes
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p);

    if (pincodeArray.length === 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "At least one valid pincode is required",
      });
      return;
    }

    try {
      const zoneData = {
        name: zoneForm.name,
        pincodes: pincodeArray,
        baseCharge: parseFloat(zoneForm.baseCharge) || 0,
        minOrderAmount: parseFloat(zoneForm.minOrderAmount) || 0,
        freeDeliveryThreshold: zoneForm.freeDeliveryThreshold
          ? parseFloat(zoneForm.freeDeliveryThreshold)
          : undefined,
        priority: parseInt(zoneForm.priority) || 1,
        isActive: true,
      };

      if (editingZone) {
        await updateZone(editingZone.id, zoneData);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Zone updated successfully",
        });
      } else {
        await addZone(zoneData);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Zone added successfully",
        });
      }
      resetZoneForm();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err instanceof Error ? err.message : "Failed to save zone",
      });
    }
  };

  const handleSaveRule = async () => {
    if (!ruleForm.name || !ruleForm.minOrderValue) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Rule name and minimum order value are required",
      });
      return;
    }

    try {
      const ruleData = {
        name: ruleForm.name,
        minOrderValue: parseFloat(ruleForm.minOrderValue) || 0,
        maxOrderValue: ruleForm.maxOrderValue
          ? parseFloat(ruleForm.maxOrderValue)
          : undefined,
        discountType: ruleForm.discountType,
        discountValue:
          ruleForm.discountType === "free"
            ? 0
            : parseFloat(ruleForm.discountValue) || 0,
        isActive: true,
      };

      if (editingRule) {
        await updateOrderValueRule(editingRule.id, ruleData);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Rule updated successfully",
        });
      } else {
        await addOrderValueRule(ruleData);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Rule added successfully",
        });
      }
      resetRuleForm();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err instanceof Error ? err.message : "Failed to save rule",
      });
    }
  };

  const handleEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name,
      pincodes: zone.pincodes.join(", "),
      baseCharge: zone.baseCharge.toString(),
      minOrderAmount: zone.minOrderAmount?.toString() || "",
      freeDeliveryThreshold: zone.freeDeliveryThreshold?.toString() || "",
      priority: zone.priority?.toString() || "1",
    });
    setShowZoneForm(true);
    setExpandedSection("zones");
  };

  const handleEditRule = (rule: OrderValueRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      minOrderValue: rule.minOrderValue.toString(),
      maxOrderValue: rule.maxOrderValue?.toString() || "",
      discountType: rule.discountType,
      discountValue: rule.discountValue?.toString() || "",
    });
    setShowRuleForm(true);
    setExpandedSection("rules");
  };

  const confirmDelete = async () => {
    try {
      if (deleteModal.type === "zone") {
        await deleteZone(deleteModal.id);
      } else {
        await deleteOrderValueRule(deleteModal.id);
      }
      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: `${deleteModal.type === "zone" ? "Zone" : "Rule"} removed`,
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete",
      });
    }
    setDeleteModal({ visible: false, type: "zone", id: "", name: "" });
  };

  const handleToggleZoneActive = async (zone: DeliveryZone) => {
    try {
      await updateZone(zone.id, { isActive: !zone.isActive });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update zone",
      });
    }
  };

  const handleToggleRuleActive = async (rule: OrderValueRule) => {
    try {
      await updateOrderValueRule(rule.id, { isActive: !rule.isActive });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update rule",
      });
    }
  };

  const handleToggleTimeSlotActive = async (slot: DeliveryTimeSlot) => {
    try {
      await updateTimeSlot(slot.id, { isActive: !slot.isActive });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update time slot",
      });
    }
  };

  // Calculate preview
  const previewResult = previewPincode || previewOrderValue
    ? calculateCharge({
        pincode: previewPincode,
        orderValue: parseFloat(previewOrderValue) || 0,
      })
    : null;

  const renderSectionHeader = (
    section: Section,
    title: string,
    icon: React.ReactNode,
    subtitle?: string
  ) => (
    <Pressable
      onPress={() =>
        setExpandedSection(expandedSection === section ? "global" : section)
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: expandedSection === section ? 0 : 12,
        borderBottomLeftRadius: expandedSection === section ? 0 : 12,
        borderBottomRightRadius: expandedSection === section ? 0 : 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: isDark ? "#374151" : "#F3F4F6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text
            style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {expandedSection === section ? (
        <ChevronUp size={20} color={colors.textSecondary} />
      ) : (
        <ChevronDown size={20} color={colors.textSecondary} />
      )}
    </Pressable>
  );

  if (isLoading) {
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.surface }}
      edges={["top","bottom"]}
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
              Delivery Charges
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              Configure delivery fees & rules
            </Text>
          </View>
        </View>
        {isSaving && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === "ios" ? 120 : 80}
        keyboardShouldPersistTaps="handled"
      >
        {/* Master Toggle */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: isEnabled
                  ? isDark
                    ? "#14532D"
                    : "#E8F5E9"
                  : isDark
                  ? "#374151"
                  : "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Truck size={24} color={isEnabled ? "#66BB6A" : colors.textMuted} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}
              >
                Delivery Charges
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {isEnabled ? "Charges are active" : "All deliveries are free"}
              </Text>
            </View>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={handleToggleEnabled}
            trackColor={{ false: "#767577", true: "#66BB6A" }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Global Settings Section */}
        {renderSectionHeader(
          "global",
          "Global Settings",
          <Settings size={20} color={colors.primary} />,
          "Default charge & messages"
        )}
        {expandedSection === "global" && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                Default Delivery Charge (Rs.)
              </Text>
              <TextInput
                value={defaultCharge}
                onChangeText={setDefaultCharge}
                placeholder="40"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                Applied when no zone matches
              </Text>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                Free Delivery Message
              </Text>
              <TextInput
                value={freeDeliveryMessage}
                onChangeText={setFreeDeliveryMessage}
                placeholder="Free delivery on orders above Rs. 500"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "500" }}>
                Show Breakdown on Receipts
              </Text>
              <Switch
                value={showBreakdown}
                onValueChange={setShowBreakdown}
                trackColor={{ false: "#767577", true: "#66BB6A" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Pressable
              onPress={handleSaveGlobalSettings}
              disabled={isSaving}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Save Settings
              </Text>
            </Pressable>
          </View>
        )}

        {/* Delivery Zones Section */}
        {renderSectionHeader(
          "zones",
          "Delivery Zones",
          <MapPin size={20} color="#3B82F6" />,
          `${config?.zones?.length || 0} zones configured`
        )}
        {expandedSection === "zones" && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              padding: 16,
              marginBottom: 12,
            }}
          >
            {/* Add Zone Button */}
            {!showZoneForm && (
              <Pressable
                onPress={() => {
                  resetZoneForm();
                  setShowZoneForm(true);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDark ? "#1E3A8A" : "#DBEAFE",
                  paddingVertical: 12,
                  borderRadius: 10,
                  marginBottom: config?.zones?.length ? 16 : 0,
                }}
              >
                <Plus size={18} color="#3B82F6" />
                <Text
                  style={{
                    color: "#3B82F6",
                    fontWeight: "600",
                    marginLeft: 6,
                  }}
                >
                  Add Zone
                </Text>
              </Pressable>
            )}

            {/* Zone Form */}
            {showZoneForm && (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 2,
                  borderColor: colors.primary,
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
                  {editingZone ? "Edit Zone" : "Add New Zone"}
                </Text>

                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    Zone Name *
                  </Text>
                  <TextInput
                    value={zoneForm.name}
                    onChangeText={(v) => setZoneForm({ ...zoneForm, name: v })}
                    placeholder="e.g., Downtown Area"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    Pincodes * (comma separated)
                  </Text>
                  <TextInput
                    value={zoneForm.pincodes}
                    onChangeText={(v) =>
                      setZoneForm({ ...zoneForm, pincodes: v })
                    }
                    placeholder="e.g., 600001, 600002, 600003"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      Base Charge (Rs.)
                    </Text>
                    <TextInput
                      value={zoneForm.baseCharge}
                      onChangeText={(v) =>
                        setZoneForm({ ...zoneForm, baseCharge: v })
                      }
                      placeholder="40"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      Min Order (Rs.)
                    </Text>
                    <TextInput
                      value={zoneForm.minOrderAmount}
                      onChangeText={(v) =>
                        setZoneForm({ ...zoneForm, minOrderAmount: v })
                      }
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    />
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      Free Above (Rs.)
                    </Text>
                    <TextInput
                      value={zoneForm.freeDeliveryThreshold}
                      onChangeText={(v) =>
                        setZoneForm({ ...zoneForm, freeDeliveryThreshold: v })
                      }
                      placeholder="500"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      Priority
                    </Text>
                    <TextInput
                      value={zoneForm.priority}
                      onChangeText={(v) =>
                        setZoneForm({ ...zoneForm, priority: v })
                      }
                      placeholder="1"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={resetZoneForm}
                    style={{
                      flex: 1,
                      backgroundColor: colors.card,
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: "600" }}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveZone}
                    disabled={isSaving}
                    style={{
                      flex: 1,
                      backgroundColor: colors.primary,
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                      {editingZone ? "Update" : "Add Zone"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Zones List */}
            {(config?.zones || []).length === 0 && !showZoneForm ? (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <MapPin size={32} color={colors.textMuted} />
                <Text
                  style={{
                    color: colors.textSecondary,
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  No delivery zones configured.{"\n"}Add zones for location-based
                  pricing.
                </Text>
              </View>
            ) : (
              (config?.zones || []).map((zone) => (
                <View
                  key={zone.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    opacity: zone.isActive ? 1 : 0.6,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text
                          style={{
                            color: colors.text,
                            fontWeight: "700",
                            fontSize: 15,
                          }}
                        >
                          {zone.name}
                        </Text>
                        {!zone.isActive && (
                          <View
                            style={{
                              backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2",
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              marginLeft: 8,
                            }}
                          >
                            <Text
                              style={{
                                color: "#EF4444",
                                fontSize: 10,
                                fontWeight: "600",
                              }}
                            >
                              Inactive
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                        numberOfLines={1}
                      >
                        Pincodes: {zone.pincodes.join(", ")}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          marginTop: 8,
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: isDark ? "#14532D" : "#E8F5E9",
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: "#66BB6A",
                              fontWeight: "600",
                              fontSize: 11,
                            }}
                          >
                            Rs. {zone.baseCharge}
                          </Text>
                        </View>
                        {zone.minOrderAmount > 0 && (
                          <View
                            style={{
                              backgroundColor: isDark ? "#1E3A8A" : "#DBEAFE",
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: "#3B82F6",
                                fontWeight: "600",
                                fontSize: 11,
                              }}
                            >
                              Min: Rs. {zone.minOrderAmount}
                            </Text>
                          </View>
                        )}
                        {zone.freeDeliveryThreshold && (
                          <View
                            style={{
                              backgroundColor: isDark ? "#713F12" : "#FEF3C7",
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: "#D97706",
                                fontWeight: "600",
                                fontSize: 11,
                              }}
                            >
                              Free &gt; Rs. {zone.freeDeliveryThreshold}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <Pressable
                        onPress={() => handleToggleZoneActive(zone)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: zone.isActive
                            ? isDark
                              ? "#14532D"
                              : "#E8F5E9"
                            : isDark
                            ? "#374151"
                            : "#F3F4F6",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {zone.isActive ? (
                          <Check size={16} color="#66BB6A" />
                        ) : (
                          <X size={16} color={colors.textMuted} />
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => handleEditZone(zone)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: isDark ? "#1E3A8A" : "#DBEAFE",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Edit2 size={14} color="#3B82F6" />
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          setDeleteModal({
                            visible: true,
                            type: "zone",
                            id: zone.id,
                            name: zone.name,
                          })
                        }
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Order Value Rules Section */}
        {renderSectionHeader(
          "rules",
          "Order Value Rules",
          <Tag size={20} color="#F59E0B" />,
          `${config?.orderValueRules?.length || 0} rules configured`
        )}
        {expandedSection === "rules" && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              padding: 16,
              marginBottom: 12,
            }}
          >
            {/* Add Rule Button */}
            {!showRuleForm && (
              <Pressable
                onPress={() => {
                  resetRuleForm();
                  setShowRuleForm(true);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDark ? "#713F12" : "#FEF3C7",
                  paddingVertical: 12,
                  borderRadius: 10,
                  marginBottom: config?.orderValueRules?.length ? 16 : 0,
                }}
              >
                <Plus size={18} color="#D97706" />
                <Text
                  style={{
                    color: "#D97706",
                    fontWeight: "600",
                    marginLeft: 6,
                  }}
                >
                  Add Rule
                </Text>
              </Pressable>
            )}

            {/* Rule Form */}
            {showRuleForm && (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 2,
                  borderColor: "#F59E0B",
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
                  {editingRule ? "Edit Rule" : "Add New Rule"}
                </Text>

                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    Rule Name *
                  </Text>
                  <TextInput
                    value={ruleForm.name}
                    onChangeText={(v) => setRuleForm({ ...ruleForm, name: v })}
                    placeholder="e.g., Free Delivery Above Rs. 500"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      Min Order Value (Rs.) *
                    </Text>
                    <TextInput
                      value={ruleForm.minOrderValue}
                      onChangeText={(v) =>
                        setRuleForm({ ...ruleForm, minOrderValue: v })
                      }
                      placeholder="500"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      Max Order Value (Rs.)
                    </Text>
                    <TextInput
                      value={ruleForm.maxOrderValue}
                      onChangeText={(v) =>
                        setRuleForm({ ...ruleForm, maxOrderValue: v })
                      }
                      placeholder="Optional"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    Discount Type
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {(
                      [
                        { type: "free", label: "Free", icon: Gift },
                        { type: "flat", label: "Flat", icon: IndianRupee },
                        { type: "percentage", label: "%", icon: Percent },
                      ] as const
                    ).map(({ type, label, icon: Icon }) => (
                      <Pressable
                        key={type}
                        onPress={() =>
                          setRuleForm({ ...ruleForm, discountType: type })
                        }
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor:
                            ruleForm.discountType === type
                              ? isDark
                                ? "#14532D"
                                : "#E8F5E9"
                              : colors.card,
                          paddingVertical: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor:
                            ruleForm.discountType === type
                              ? "#66BB6A"
                              : colors.border,
                        }}
                      >
                        <Icon
                          size={14}
                          color={
                            ruleForm.discountType === type
                              ? "#66BB6A"
                              : colors.textSecondary
                          }
                        />
                        <Text
                          style={{
                            color:
                              ruleForm.discountType === type
                                ? "#66BB6A"
                                : colors.text,
                            fontWeight: "600",
                            marginLeft: 4,
                            fontSize: 13,
                          }}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {ruleForm.discountType !== "free" && (
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      Discount Value{" "}
                      {ruleForm.discountType === "percentage" ? "(%)" : "(Rs.)"}
                    </Text>
                    <TextInput
                      value={ruleForm.discountValue}
                      onChangeText={(v) =>
                        setRuleForm({ ...ruleForm, discountValue: v })
                      }
                      placeholder={
                        ruleForm.discountType === "percentage" ? "10" : "20"
                      }
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    />
                  </View>
                )}

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={resetRuleForm}
                    style={{
                      flex: 1,
                      backgroundColor: colors.card,
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: "600" }}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveRule}
                    disabled={isSaving}
                    style={{
                      flex: 1,
                      backgroundColor: "#F59E0B",
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                      {editingRule ? "Update" : "Add Rule"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Rules List */}
            {(config?.orderValueRules || []).length === 0 && !showRuleForm ? (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <Tag size={32} color={colors.textMuted} />
                <Text
                  style={{
                    color: colors.textSecondary,
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  No rules configured.{"\n"}Add rules for order value-based
                  discounts.
                </Text>
              </View>
            ) : (
              (config?.orderValueRules || []).map((rule) => (
                <View
                  key={rule.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    opacity: rule.isActive ? 1 : 0.6,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text
                          style={{
                            color: colors.text,
                            fontWeight: "700",
                            fontSize: 15,
                          }}
                        >
                          {rule.name}
                        </Text>
                        {!rule.isActive && (
                          <View
                            style={{
                              backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2",
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              marginLeft: 8,
                            }}
                          >
                            <Text
                              style={{
                                color: "#EF4444",
                                fontSize: 10,
                                fontWeight: "600",
                              }}
                            >
                              Inactive
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        Orders {formatCurrency(rule.minOrderValue)}
                        {rule.maxOrderValue
                          ? ` - ${formatCurrency(rule.maxOrderValue)}`
                          : "+"}{" "}
                        →{" "}
                        {rule.discountType === "free"
                          ? "Free Delivery"
                          : rule.discountType === "percentage"
                          ? `${rule.discountValue}% off`
                          : `Rs. ${rule.discountValue} off`}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <Pressable
                        onPress={() => handleToggleRuleActive(rule)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: rule.isActive
                            ? isDark
                              ? "#14532D"
                              : "#E8F5E9"
                            : isDark
                            ? "#374151"
                            : "#F3F4F6",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {rule.isActive ? (
                          <Check size={16} color="#66BB6A" />
                        ) : (
                          <X size={16} color={colors.textMuted} />
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => handleEditRule(rule)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: isDark ? "#713F12" : "#FEF3C7",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Edit2 size={14} color="#D97706" />
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          setDeleteModal({
                            visible: true,
                            type: "rule",
                            id: rule.id,
                            name: rule.name,
                          })
                        }
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Time Slots Section */}
        {renderSectionHeader(
          "timeslots",
          "Time Slots",
          <Clock size={20} color="#8B5CF6" />,
          `${config?.timeSlots?.filter((s) => s.isActive).length || 0} active`
        )}
        {expandedSection === "timeslots" && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              padding: 16,
              marginBottom: 12,
            }}
          >
            {(config?.timeSlots || []).length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <Clock size={32} color={colors.textMuted} />
                <Text
                  style={{
                    color: colors.textSecondary,
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  No time slots configured.
                </Text>
              </View>
            ) : (
              (config?.timeSlots || []).map((slot) => (
                <View
                  key={slot.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: slot.isActive ? 1 : 0.6,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: "700",
                        fontSize: 15,
                      }}
                    >
                      {slot.name}
                    </Text>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {slot.additionalCharge > 0
                        ? `+Rs. ${slot.additionalCharge}`
                        : "No extra charge"}{" "}
                      • {slot.estimatedDeliveryHours}h delivery
                    </Text>
                  </View>
                  <Switch
                    value={slot.isActive}
                    onValueChange={() => handleToggleTimeSlotActive(slot)}
                    trackColor={{ false: "#767577", true: "#8B5CF6" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              ))
            )}
          </View>
        )}

        {/* Preview Calculator Section */}
        {renderSectionHeader(
          "preview",
          "Preview Calculator",
          <Calculator size={20} color="#EC4899" />,
          "Test delivery charge calculation"
        )}
        {expandedSection === "preview" && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  Pincode
                </Text>
                <TextInput
                  value={previewPincode}
                  onChangeText={setPreviewPincode}
                  placeholder="600001"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={6}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  Order Value (Rs.)
                </Text>
                <TextInput
                  value={previewOrderValue}
                  onChangeText={setPreviewOrderValue}
                  placeholder="250"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>
            </View>

            {/* Result */}
            {previewResult && (
              <View
                style={{
                  backgroundColor: previewResult.isFree
                    ? isDark
                      ? "#14532D"
                      : "#E8F5E9"
                    : colors.surface,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      color: previewResult.isFree ? "#66BB6A" : colors.text,
                      fontWeight: "700",
                      fontSize: 18,
                    }}
                  >
                    {previewResult.isFree
                      ? "Free Delivery"
                      : `Rs. ${previewResult.finalCharge}`}
                  </Text>
                  {previewResult.zone && (
                    <View
                      style={{
                        backgroundColor: isDark ? "#1E3A8A" : "#DBEAFE",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: "#3B82F6",
                          fontWeight: "600",
                          fontSize: 12,
                        }}
                      >
                        {previewResult.zone.name}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Breakdown */}
                {previewResult.appliedRules.length > 0 && (
                  <View>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        marginBottom: 6,
                      }}
                    >
                      Calculation Breakdown:
                    </Text>
                    {previewResult.appliedRules.map((rule, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          paddingVertical: 4,
                        }}
                      >
                        <Text
                          style={{ color: colors.textSecondary, fontSize: 13 }}
                        >
                          {rule.reason}
                        </Text>
                        <Text
                          style={{
                            color:
                              rule.impact < 0
                                ? "#66BB6A"
                                : rule.impact > 0
                                ? colors.text
                                : colors.textSecondary,
                            fontWeight: "600",
                            fontSize: 13,
                          }}
                        >
                          {rule.impact > 0 ? "+" : ""}
                          Rs. {rule.impact}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {!previewResult.minOrderMet && (
                  <View
                    style={{
                      backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2",
                      borderRadius: 8,
                      padding: 10,
                      marginTop: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#EF4444",
                        fontSize: 13,
                        fontWeight: "500",
                      }}
                    >
                      Min order Rs. {previewResult.minOrderRequired} required
                    </Text>
                  </View>
                )}
              </View>
            )}

            {!previewResult && (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <Calculator size={32} color={colors.textMuted} />
                <Text
                  style={{
                    color: colors.textSecondary,
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  Enter pincode and order value to see{"\n"}the calculated
                  delivery charge.
                </Text>
              </View>
            )}
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModal.visible}
        title={`Delete ${deleteModal.type === "zone" ? "Zone" : "Rule"}`}
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteModal({ visible: false, type: "zone", id: "", name: "" })
        }
      />
    </SafeAreaView>
  );
}
