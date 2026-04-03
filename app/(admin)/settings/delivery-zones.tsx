import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import {
  ChevronLeft,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  IndianRupee,
  Check,
  X,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../src/context/ThemeContext";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";

const DELIVERY_ZONES_KEY = "@dhiva_deva_delivery_zones";

interface DeliveryZone {
  id: string;
  name: string;
  pincode: string;
  deliveryCharge: number;
  minOrderAmount: number;
  isActive: boolean;
}

export default function DeliveryZonesScreen() {
  const { colors, isDark } = useTheme();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; zoneId: string }>({
    visible: false,
    zoneId: "",
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    pincode: "",
    deliveryCharge: "",
    minOrderAmount: "",
  });

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const saved = await AsyncStorage.getItem(DELIVERY_ZONES_KEY);
      if (saved) {
        setZones(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading delivery zones:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveZones = async (newZones: DeliveryZone[]) => {
    try {
      await AsyncStorage.setItem(DELIVERY_ZONES_KEY, JSON.stringify(newZones));
      setZones(newZones);
    } catch (error) {
      console.error("Error saving delivery zones:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      pincode: "",
      deliveryCharge: "",
      minOrderAmount: "",
    });
    setEditingZone(null);
    setShowAddForm(false);
  };

  const handleAddZone = () => {
    if (!formData.name || !formData.pincode) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill in all required fields",
      });
      return;
    }

    const newZone: DeliveryZone = {
      id: Date.now().toString(),
      name: formData.name,
      pincode: formData.pincode,
      deliveryCharge: parseFloat(formData.deliveryCharge) || 0,
      minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
      isActive: true,
    };

    saveZones([...zones, newZone]);
    resetForm();
    Toast.show({
      type: "success",
      text1: "Success",
      text2: "Delivery zone added successfully",
    });
  };

  const handleUpdateZone = () => {
    if (!editingZone || !formData.name || !formData.pincode) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill in all required fields",
      });
      return;
    }

    const updatedZones = zones.map((zone) =>
      zone.id === editingZone.id
        ? {
            ...zone,
            name: formData.name,
            pincode: formData.pincode,
            deliveryCharge: parseFloat(formData.deliveryCharge) || 0,
            minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
          }
        : zone
    );

    saveZones(updatedZones);
    resetForm();
    Toast.show({
      type: "success",
      text1: "Success",
      text2: "Delivery zone updated successfully",
    });
  };

  const handleDeleteZone = (zoneId: string) => {
    setDeleteModal({ visible: true, zoneId });
  };

  const confirmDeleteZone = () => {
    const updatedZones = zones.filter((zone) => zone.id !== deleteModal.zoneId);
    saveZones(updatedZones);
    Toast.show({
      type: "success",
      text1: "Deleted",
      text2: "Delivery zone removed",
    });
    setDeleteModal({ visible: false, zoneId: "" });
  };

  const handleToggleActive = (zoneId: string) => {
    const updatedZones = zones.map((zone) =>
      zone.id === zoneId ? { ...zone, isActive: !zone.isActive } : zone
    );
    saveZones(updatedZones);
  };

  const startEditing = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      pincode: zone.pincode,
      deliveryCharge: zone.deliveryCharge.toString(),
      minOrderAmount: zone.minOrderAmount.toString(),
    });
    setShowAddForm(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top","bottom"]}>
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
          <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text, marginLeft: 12 }}>
            Delivery Zones
          </Text>
        </View>
        <Pressable
          onPress={() => {
            resetForm();
            setShowAddForm(true);
          }}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "600", marginLeft: 4 }}>Add</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === "ios" ? 120 : 80}
        keyboardShouldPersistTaps="handled"
      >
        {/* Add/Edit Form */}
        {showAddForm && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, marginBottom: 16 }}>
              {editingZone ? "Edit Zone" : "Add New Zone"}
            </Text>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }}>
                Zone Name *
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={(v) => setFormData({ ...formData, name: v })}
                placeholder="e.g., Downtown Area"
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

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }}>
                Pincode *
              </Text>
              <TextInput
                value={formData.pincode}
                onChangeText={(v) => setFormData({ ...formData, pincode: v })}
                placeholder="e.g., 600001"
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

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }}>
                  Delivery Charge (₹)
                </Text>
                <TextInput
                  value={formData.deliveryCharge}
                  onChangeText={(v) => setFormData({ ...formData, deliveryCharge: v })}
                  placeholder="0"
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
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }}>
                  Min Order (₹)
                </Text>
                <TextInput
                  value={formData.minOrderAmount}
                  onChangeText={(v) => setFormData({ ...formData, minOrderAmount: v })}
                  placeholder="0"
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

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={resetForm}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={editingZone ? handleUpdateZone : handleAddZone}
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
        {zones.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 40,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                backgroundColor: isDark ? "#374151" : "#F3F4F6",
                borderRadius: 40,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <MapPin size={36} color={colors.textMuted} />
            </View>
            <Text style={{ color: colors.text, fontWeight: "600", fontSize: 18, marginBottom: 8 }}>
              No Delivery Zones
            </Text>
            <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
              Add delivery zones to manage where you deliver and set delivery charges
            </Text>
          </View>
        ) : (
          zones.map((zone) => (
            <View
              key={zone.id}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                opacity: zone.isActive ? 1 : 0.6,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>
                      {zone.name}
                    </Text>
                    {!zone.isActive && (
                      <View
                        style={{
                          backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2",
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                          marginLeft: 8,
                        }}
                      >
                        <Text style={{ color: "#EF4444", fontSize: 11, fontWeight: "600" }}>
                          Inactive
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                    <MapPin size={14} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, marginLeft: 4 }}>
                      Pincode: {zone.pincode}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", marginTop: 10, gap: 16 }}>
                    <View
                      style={{
                        backgroundColor: isDark ? "#14532D" : "#E8F5E9",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: "#66BB6A", fontWeight: "600", fontSize: 13 }}>
                        Delivery: ₹{zone.deliveryCharge}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: isDark ? "#1E3A8A" : "#DBEAFE",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: "#3B82F6", fontWeight: "600", fontSize: 13 }}>
                        Min: ₹{zone.minOrderAmount}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={() => handleToggleActive(zone.id)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: zone.isActive
                        ? isDark ? "#14532D" : "#E8F5E9"
                        : isDark ? "#374151" : "#F3F4F6",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {zone.isActive ? (
                      <Check size={18} color="#66BB6A" />
                    ) : (
                      <X size={18} color={colors.textMuted} />
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => startEditing(zone)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: isDark ? "#1E3A8A" : "#DBEAFE",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Edit2 size={16} color="#3B82F6" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteZone(zone.id)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </KeyboardAwareScrollView>

      {/* Delete Zone Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModal.visible}
        title="Delete Zone"
        message="Are you sure you want to delete this delivery zone? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
        onConfirm={confirmDeleteZone}
        onCancel={() => setDeleteModal({ visible: false, zoneId: "" })}
      />
    </SafeAreaView>
  );
}
