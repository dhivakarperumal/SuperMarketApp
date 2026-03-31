/**
 * BluetoothDeviceSelectorSheet
 * A clean bottom sheet UI for selecting Bluetooth printers
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
  Dimensions,
} from "react-native";
import {
  Bluetooth,
  X,
  Wifi,
  Info,
  RefreshCw,
  Settings,
} from "lucide-react-native";
import * as IntentLauncher from "expo-intent-launcher";
import { useTheme } from "../../context/ThemeContext";
import {
  bluetoothService,
  BluetoothDevice,
} from "../../services/BluetoothService";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BluetoothDeviceSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectDevice: (device: BluetoothDevice) => void;
  selectedDevice?: BluetoothDevice | null;
}

export function BluetoothDeviceSelectorSheet({
  visible,
  onClose,
  onSelectDevice,
  selectedDevice,
}: BluetoothDeviceSelectorSheetProps) {
  const { colors, isDark } = useTheme();

  const [isScanning, setIsScanning] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [pairedDevices, setPairedDevices] = useState<BluetoothDevice[]>([]);
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isBluetoothAvailable = bluetoothService.isAvailable();

  // Initialize when sheet opens
  useEffect(() => {
    if (visible) {
      console.log("[BluetoothSheet] Sheet opened, initializing...");
      initializeBluetooth();
    } else {
      bluetoothService.stopDiscovery();
      setIsScanning(false);
    }
  }, [visible]);

  const initializeBluetooth = async () => {
    console.log("[BluetoothSheet] Initializing Bluetooth...");
    setError(null);
    setPairedDevices([]);
    setAvailableDevices([]);

    if (!isBluetoothAvailable) {
      console.log("[BluetoothSheet] Bluetooth not available - need development build");
      setError("Development build required for Bluetooth scanning");
      return;
    }

    setIsEnabling(true);

    try {
      // Request permissions first
      console.log("[BluetoothSheet] Requesting permissions...");
      const hasPermissions = await bluetoothService.requestPermissions();
      if (!hasPermissions) {
        console.log("[BluetoothSheet] Permissions denied");
        setError("Bluetooth permissions not granted. Please enable in Settings.");
        setIsEnabling(false);
        return;
      }
      console.log("[BluetoothSheet] Permissions granted");

      // Enable Bluetooth and get paired devices
      console.log("[BluetoothSheet] Enabling Bluetooth...");
      const devices = await bluetoothService.enableBluetooth();
      console.log("[BluetoothSheet] Bluetooth enabled, paired devices:", devices.length);

      setPairedDevices(devices);
      setError(null);
      setIsEnabling(false);

      // Start scanning for available devices
      console.log("[BluetoothSheet] Starting device discovery...");
      startScanning();
    } catch (err: any) {
      console.log("[BluetoothSheet] Initialization error:", err.message);
      setError(err.message || "Failed to enable Bluetooth");
      setIsEnabling(false);

      // Still try to scan if Bluetooth might be on
      if (err.message?.includes("already enabled") || err.message?.includes("enabled")) {
        console.log("[BluetoothSheet] Bluetooth might be enabled, trying to scan anyway...");
        startScanning();
      }
    }
  };

  const startScanning = () => {
    if (!isBluetoothAvailable) {
      console.log("[BluetoothSheet] Bluetooth not available for scanning");
      return;
    }

    console.log("[BluetoothSheet] Starting scan...");
    setIsScanning(true);
    setAvailableDevices([]);
    setError(null);

    bluetoothService.startDiscovery({
      onPairedDevices: (devices) => {
        console.log("[BluetoothSheet] Received paired devices:", devices.length);
        setPairedDevices(devices);
      },
      onDeviceFound: (device) => {
        console.log("[BluetoothSheet] Device found:", device.name, device.address);
        setAvailableDevices((prev) => {
          if (prev.find((d) => d.address === device.address)) return prev;
          return [...prev, device];
        });
      },
      onDiscoveryComplete: (allDevices) => {
        console.log("[BluetoothSheet] Discovery complete, total devices:", allDevices.length);
        setIsScanning(false);
      },
      onError: (errorMsg) => {
        console.log("[BluetoothSheet] Discovery error:", errorMsg);
        setIsScanning(false);
        setError(errorMsg);
      },
    });
  };

  const handleSelectDevice = (device: BluetoothDevice) => {
    console.log("[BluetoothSheet] Device selected:", device.name);
    onSelectDevice(device);
    onClose();
  };

  const openBluetoothSettings = async () => {
    if (Platform.OS === "android") {
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.BLUETOOTH_SETTINGS
        );
      } catch {
        await Linking.openSettings();
      }
    } else {
      await Linking.openSettings();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: SCREEN_HEIGHT * 0.85,
            minHeight: 400,
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: "center", paddingTop: 12 }}>
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: isDark ? "#4B5563" : "#D1D5DB",
                borderRadius: 2,
              }}
            />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? "#374151" : "#E5E7EB",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Bluetooth size={24} color="#EF4444" />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: isDark ? "#F9FAFB" : "#1F2937",
                  marginLeft: 10,
                }}
              >
                Bluetooth Devices
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={{
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 18,
                backgroundColor: isDark ? "#374151" : "#F3F4F6",
              }}
            >
              <X size={22} color={isDark ? "#D1D5DB" : "#6B7280"} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Info Banner */}
            <View
              style={{
                backgroundColor: isDark ? "#1E3A5F" : "#E0F2FE",
                borderRadius: 12,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Info size={20} color="#0EA5E9" />
              <Text
                style={{
                  color: isDark ? "#7DD3FC" : "#0369A1",
                  fontSize: 14,
                  marginLeft: 10,
                  flex: 1,
                }}
              >
                Select a paired device or tap an available device to pair
              </Text>
            </View>

            {/* Loading State */}
            {isEnabling && (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <ActivityIndicator size="large" color="#EF4444" />
                <Text
                  style={{
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    marginTop: 12,
                    fontSize: 15,
                  }}
                >
                  Enabling Bluetooth...
                </Text>
              </View>
            )}

            {/* Error Banner - Small and non-blocking */}
            {error && !isEnabling && (
              <Pressable
                onPress={openBluetoothSettings}
                style={{
                  backgroundColor: isDark ? "#450A0A" : "#FEF2F2",
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Settings size={20} color="#EF4444" />
                <Text
                  style={{
                    color: "#EF4444",
                    fontWeight: "500",
                    fontSize: 14,
                    marginLeft: 10,
                    flex: 1,
                  }}
                >
                  {error}
                </Text>
                <Text style={{ color: "#EF4444", fontWeight: "600", fontSize: 13 }}>
                  Settings
                </Text>
              </Pressable>
            )}

            {/* Paired Devices Section */}
            {!isEnabling && (
              <View style={{ marginBottom: 20 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Bluetooth size={18} color={isDark ? "#9CA3AF" : "#6B7280"} />
                  <Text
                    style={{
                      color: isDark ? "#E5E7EB" : "#374151",
                      fontWeight: "600",
                      fontSize: 14,
                      marginLeft: 8,
                    }}
                  >
                    Paired Devices
                  </Text>
                  <Text
                    style={{
                      color: isDark ? "#6B7280" : "#9CA3AF",
                      fontSize: 14,
                      marginLeft: 6,
                    }}
                  >
                    ({pairedDevices.length})
                  </Text>
                </View>

                {pairedDevices.length > 0 ? (
                  pairedDevices.map((device) => (
                    <Pressable
                      key={device.address}
                      onPress={() => handleSelectDevice(device)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: isDark ? "#374151" : "#FFFFFF",
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 10,
                        borderWidth: selectedDevice?.address === device.address ? 2 : 1,
                        borderColor:
                          selectedDevice?.address === device.address
                            ? "#EF4444"
                            : isDark
                            ? "#4B5563"
                            : "#E5E7EB",
                      }}
                    >
                      {/* Radio Button */}
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor:
                            selectedDevice?.address === device.address
                              ? "#EF4444"
                              : isDark
                              ? "#6B7280"
                              : "#D1D5DB",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {selectedDevice?.address === device.address && (
                          <View
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: "#EF4444",
                            }}
                          />
                        )}
                      </View>
                      {/* Device Info */}
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text
                          style={{
                            fontWeight: "600",
                            fontSize: 16,
                            color: isDark ? "#F9FAFB" : "#1F2937",
                          }}
                        >
                          {device.name || "Unknown Device"}
                        </Text>
                        <Text
                          style={{
                            color: isDark ? "#9CA3AF" : "#6B7280",
                            fontSize: 13,
                            marginTop: 2,
                            fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                          }}
                        >
                          {device.address}
                        </Text>
                      </View>
                      {/* Unpair Button */}
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          openBluetoothSettings();
                        }}
                        style={{
                          backgroundColor: "#EF4444",
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 13 }}>
                          Unpair
                        </Text>
                      </Pressable>
                    </Pressable>
                  ))
                ) : (
                  <View
                    style={{
                      backgroundColor: isDark ? "#374151" : "#FFFFFF",
                      borderRadius: 12,
                      padding: 24,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: isDark ? "#4B5563" : "#E5E7EB",
                    }}
                  >
                    <Text style={{ color: isDark ? "#6B7280" : "#9CA3AF", fontSize: 14 }}>
                      No paired devices found
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Separator Line */}
            {!isEnabling && pairedDevices.length > 0 && (
              <View
                style={{
                  height: 1,
                  backgroundColor: isDark ? "#374151" : "#E5E7EB",
                  marginBottom: 20,
                }}
              />
            )}

            {/* Available Devices Section */}
            {!isEnabling && (
              <View style={{ marginBottom: 20 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Wifi size={18} color={isDark ? "#9CA3AF" : "#6B7280"} />
                  <Text
                    style={{
                      color: isDark ? "#E5E7EB" : "#374151",
                      fontWeight: "600",
                      fontSize: 14,
                      marginLeft: 8,
                    }}
                  >
                    Available Devices
                  </Text>
                  <Text
                    style={{
                      color: isDark ? "#6B7280" : "#9CA3AF",
                      fontSize: 14,
                      marginLeft: 6,
                    }}
                  >
                    ({availableDevices.length})
                  </Text>
                  {isScanning && (
                    <ActivityIndicator
                      size="small"
                      color="#EF4444"
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </View>

                {availableDevices.length > 0
                  ? availableDevices.map((device) => (
                      <Pressable
                        key={device.address}
                        onPress={() => handleSelectDevice(device)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: isDark ? "#374151" : "#FFFFFF",
                          borderRadius: 12,
                          padding: 14,
                          marginBottom: 10,
                          borderWidth: 1,
                          borderColor: isDark ? "#4B5563" : "#E5E7EB",
                        }}
                      >
                        {/* Bluetooth Icon */}
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            backgroundColor: isDark ? "#4B5563" : "#F3F4F6",
                            borderRadius: 10,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Bluetooth size={22} color={isDark ? "#9CA3AF" : "#6B7280"} />
                        </View>
                        {/* Device Info */}
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text
                            style={{
                              fontWeight: "600",
                              fontSize: 16,
                              color: isDark ? "#F9FAFB" : "#1F2937",
                            }}
                          >
                            {device.name || "Unknown Device"}
                          </Text>
                          <Text
                            style={{
                              color: isDark ? "#9CA3AF" : "#6B7280",
                              fontSize: 13,
                              marginTop: 2,
                              fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                            }}
                          >
                            {device.address}
                          </Text>
                        </View>
                        {/* Pair Button */}
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            handleSelectDevice(device);
                          }}
                          style={{
                            backgroundColor: "#EF4444",
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 8,
                          }}
                        >
                          <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 13 }}>
                            Pair
                          </Text>
                        </Pressable>
                      </Pressable>
                    ))
                  : !isScanning && (
                      <View
                        style={{
                          backgroundColor: isDark ? "#374151" : "#FFFFFF",
                          borderRadius: 12,
                          padding: 24,
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: isDark ? "#4B5563" : "#E5E7EB",
                        }}
                      >
                        <Text style={{ color: isDark ? "#6B7280" : "#9CA3AF", fontSize: 14 }}>
                          No available devices found
                        </Text>
                      </View>
                    )}

                {/* Scanning Indicator */}
                {isScanning && (
                  <View
                    style={{
                      backgroundColor: isDark ? "#374151" : "#FFFFFF",
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: isDark ? "#4B5563" : "#E5E7EB",
                    }}
                  >
                    <RefreshCw size={18} color={isDark ? "#9CA3AF" : "#6B7280"} />
                    <Text
                      style={{
                        color: isDark ? "#9CA3AF" : "#6B7280",
                        fontSize: 14,
                        marginLeft: 8,
                      }}
                    >
                      Scanning...
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Rescan Button */}
            {!isEnabling && !error && !isScanning && (
              <Pressable
                onPress={startScanning}
                style={{
                  backgroundColor: isDark ? "#374151" : "#FFFFFF",
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: isDark ? "#4B5563" : "#E5E7EB",
                }}
              >
                <RefreshCw size={18} color="#EF4444" />
                <Text
                  style={{
                    color: "#EF4444",
                    fontWeight: "600",
                    fontSize: 14,
                    marginLeft: 8,
                  }}
                >
                  Scan Again
                </Text>
              </Pressable>
            )}

            {/* Open Settings Button - Only show when no devices found */}
            {!isEnabling && pairedDevices.length === 0 && availableDevices.length === 0 && !isScanning && (
              <Pressable
                onPress={openBluetoothSettings}
                style={{
                  backgroundColor: isDark ? "#1E3A5F" : "#DBEAFE",
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 12,
                }}
              >
                <Settings size={18} color="#3B82F6" />
                <Text
                  style={{
                    color: "#3B82F6",
                    fontWeight: "600",
                    fontSize: 14,
                    marginLeft: 8,
                  }}
                >
                  Open Bluetooth Settings
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default BluetoothDeviceSelectorSheet;
