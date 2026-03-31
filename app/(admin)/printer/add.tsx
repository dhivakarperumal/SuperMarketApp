import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  Platform,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Bluetooth,
  Wifi,
  Usb,
  Smartphone,
  Search,
  Printer,
  Check,
  RefreshCw,
  AlertCircle,
  Settings,
  ChevronRight,
  X,
  HelpCircle,
  Power,
  Trash2,
  RotateCcw,
  Radio,
  ShieldCheck,
  Smartphone as PhoneIcon,
  RefreshCw as RestartIcon,
} from "lucide-react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as IntentLauncher from "expo-intent-launcher";
import { useTheme } from "../../../src/context/ThemeContext";
import {
  bluetoothService,
  BluetoothDevice,
} from "../../../src/services/BluetoothService";
import { printService } from "../../../src/services/printer/PrintService";
import { BluetoothDeviceSelectorSheet } from "../../../src/components/settings/BluetoothDeviceSelectorSheet";

interface PrinterConfig {
  id: string;
  name: string;
  connectionType: "bluetooth" | "wifi" | "usb" | "internal";
  address?: string;
  ipAddress?: string;
  port?: string;
  paperWidth: "58mm" | "80mm";
  charsPerLine: 42 | 46 | 48;
  isDefault: boolean;
  enabled: boolean;
  autoCutter: boolean;
}

const PRINTERS_KEY = "savedPrinters";

export default function AddPrinterScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [printerName, setPrinterName] = useState("");
  const [connectionType, setConnectionType] = useState<
    "bluetooth" | "wifi" | "usb" | "internal"
  >("bluetooth");
  const [ipAddress, setIpAddress] = useState("192.168.1.100:9100");
  const [bluetoothAddress, setBluetoothAddress] = useState("");
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">("80mm");
  const [charsPerLine, setCharsPerLine] = useState<42 | 46 | 48>(48);
  const [isDefault, setIsDefault] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [autoCutter, setAutoCutter] = useState(false);

  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(
    null
  );
  const [isScanning, setIsScanning] = useState(false);
  const [isSearchingNetwork, setIsSearchingNetwork] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEnablingBluetooth, setIsEnablingBluetooth] = useState(false);

  const [bluetoothAvailable, setBluetoothAvailable] = useState(false);
  const [pairedDevices, setPairedDevices] = useState<BluetoothDevice[]>([]);
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>(
    []
  );
  const [existingPrinters, setExistingPrinters] = useState<PrinterConfig[]>([]);

  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [bluetoothError, setBluetoothError] = useState<string | null>(null);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  useEffect(() => {
    loadExistingPrinters();
    checkBluetoothAvailability();
  }, []);

  const loadExistingPrinters = async () => {
    try {
      const saved = await AsyncStorage.getItem(PRINTERS_KEY);
      if (saved) {
        const printers = JSON.parse(saved);
        setExistingPrinters(printers);
      }
    } catch (error) {
      console.error("Failed to load printers:", error);
    }
  };

  const checkBluetoothAvailability = () => {
    const available = bluetoothService.isAvailable();
    setBluetoothAvailable(available);
  };

  const openBottomSheet = () => {
    console.log("[AddPrinter] Opening bottom sheet...");
    setShowBottomSheet(true);
  };

  const closeBottomSheet = () => {
    setShowBottomSheet(false);
  };

  const handleDeviceSelected = (device: BluetoothDevice) => {
    setSelectedDevice(device);
    setBluetoothAddress(device.address);
    if (!printerName) {
      setPrinterName(device.name || "Bluetooth Printer");
    }
  };

  const initializeBluetooth = async () => {
    console.log("[AddPrinter] Initializing Bluetooth...");
    console.log("[AddPrinter] Bluetooth available:", bluetoothService.isAvailable());

    setBluetoothError(null);

    if (!bluetoothService.isAvailable()) {
      console.log("[AddPrinter] Bluetooth not available - running in Expo Go?");
      setBluetoothError("Bluetooth not available. Development build required.");
      return;
    }

    setIsEnablingBluetooth(true);
    setPairedDevices([]);
    setAvailableDevices([]);

    try {
      // Request permissions first
      const hasPermissions = await bluetoothService.requestPermissions();
      console.log("[AddPrinter] Permissions granted:", hasPermissions);

      if (!hasPermissions) {
        setBluetoothError("Bluetooth permissions not granted. Please enable in Settings.");
        setIsEnablingBluetooth(false);
        return;
      }

      // Check if Bluetooth is enabled
      const isEnabled = await bluetoothService.isBluetoothEnabled();
      console.log("[AddPrinter] Bluetooth enabled:", isEnabled);

      // Enable Bluetooth and get paired devices
      const devices = await bluetoothService.enableBluetooth();
      console.log("[AddPrinter] Paired devices from enableBluetooth:", devices);

      if (devices && devices.length > 0) {
        setPairedDevices(devices);
        console.log("[AddPrinter] Set", devices.length, "paired devices");
      }

      setBluetoothError(null);

      // Start scanning for more devices
      setIsEnablingBluetooth(false);
      startDiscovery();
    } catch (error: any) {
      console.log("[AddPrinter] Initialize error:", error);
      setBluetoothError(error.message || "Could not enable Bluetooth. Please enable it manually in Settings.");
    } finally {
      setIsEnablingBluetooth(false);
    }
  };

  const startDiscovery = () => {
    console.log("[AddPrinter] Starting discovery...");
    setIsScanning(true);
    setAvailableDevices([]);

    bluetoothService.startDiscovery({
      onPairedDevices: (devices) => {
        console.log("[AddPrinter] Received paired devices:", devices?.length);
        if (devices && devices.length > 0) {
          setPairedDevices((prev) => {
            // Merge with existing, avoiding duplicates
            const merged = [...prev];
            devices.forEach((device) => {
              if (!merged.find((d) => d.address === device.address)) {
                merged.push(device);
              }
            });
            return merged;
          });
        }
      },
      onDeviceFound: (device) => {
        console.log("[AddPrinter] Device found:", device?.name);
        if (device) {
          setAvailableDevices((prev) => {
            if (prev.find((d) => d.address === device.address)) {
              return prev;
            }
            return [...prev, device];
          });
        }
      },
      onDiscoveryComplete: (allDevices) => {
        console.log("[AddPrinter] Discovery complete, total devices:", allDevices?.length);
        setIsScanning(false);

        // Update states from the complete result
        if (allDevices && allDevices.length > 0) {
          const paired = allDevices.filter((d) => d.isPaired);
          const available = allDevices.filter((d) => !d.isPaired);

          if (paired.length > 0) {
            setPairedDevices(paired);
          }
          if (available.length > 0) {
            setAvailableDevices(available);
          }
        }
      },
      onError: (error) => {
        console.log("[AddPrinter] Discovery error:", error);
        setIsScanning(false);
      },
    });
  };

  const handleRescan = async () => {
    console.log("[AddPrinter] Rescanning...");
    bluetoothService.stopDiscovery();
    setAvailableDevices([]);
    setBluetoothError(null);

    // Re-fetch paired devices and start discovery
    if (bluetoothService.isAvailable()) {
      try {
        const devices = await bluetoothService.enableBluetooth();
        if (devices && devices.length > 0) {
          setPairedDevices(devices);
        }
        setBluetoothError(null);
        startDiscovery();
      } catch (e: any) {
        console.log("[AddPrinter] Error fetching paired on rescan:", e);
        setBluetoothError(e.message || "Could not enable Bluetooth");
      }
    } else {
      setBluetoothError("Bluetooth not available. Development build required.");
    }
  };

  const openBluetoothSettings = async () => {
    if (Platform.OS === "android") {
      try {
        await Linking.sendIntent("android.settings.BLUETOOTH_SETTINGS");
        return;
      } catch (e1) {
        try {
          await IntentLauncher.startActivityAsync(
            IntentLauncher.ActivityAction.BLUETOOTH_SETTINGS
          );
          return;
        } catch (e2) {
          try {
            await Linking.openSettings();
            return;
          } catch (e3) {
            Toast.show({
              type: "info",
              text1: "Open Settings",
              text2: "Please open Bluetooth settings manually",
            });
          }
        }
      }
    } else {
      try {
        await Linking.openURL("App-Prefs:Bluetooth");
      } catch (error) {
        try {
          await Linking.openSettings();
        } catch (e) {
          Toast.show({
            type: "info",
            text1: "Open Settings",
            text2: "Please open Bluetooth settings manually",
          });
        }
      }
    }
  };

  const handleSelectDevice = (device: BluetoothDevice) => {
    setSelectedDevice(device);
    setBluetoothAddress(""); // Clear manual address when device is selected
    if (!printerName.trim()) {
      setPrinterName(device.name);
    }
    closeBottomSheet();
    Toast.show({
      type: "success",
      text1: "Device Selected",
      text2: device.name,
    });
  };

  const handleBluetoothAddressChange = (text: string) => {
    setBluetoothAddress(text);
    // Clear selected device when user types manual address
    if (text.trim() && selectedDevice) {
      setSelectedDevice(null);
    }
  };

  const handlePairDevice = async (device: BluetoothDevice) => {
    if (!bluetoothService.isAvailable()) {
      Toast.show({
        type: "info",
        text1: "Manual Pairing",
        text2: "Please pair via Bluetooth settings",
      });
      openBluetoothSettings();
      return;
    }

    Toast.show({
      type: "info",
      text1: "Pairing",
      text2: `Connecting to ${device.name}...`,
    });

    try {
      await bluetoothService.connectToDevice(device.address);

      Toast.show({
        type: "success",
        text1: "Connected",
        text2: `Successfully connected to ${device.name}`,
      });

      setPairedDevices((prev) => [...prev, { ...device, isPaired: true }]);
      setAvailableDevices((prev) =>
        prev.filter((d) => d.address !== device.address)
      );
      handleSelectDevice({ ...device, isPaired: true });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Connection Failed",
        text2: error.message || "Could not connect to device",
      });
    }
  };

  const handleSearchNetwork = async () => {
    setIsSearchingNetwork(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    Toast.show({
      type: "info",
      text1: "Network Search",
      text2: "Enter the printer IP address manually",
    });
    setIsSearchingNetwork(false);
  };

  const handleTestPrint = async () => {
    const btAddress = selectedDevice?.address || bluetoothAddress.trim();

    if (connectionType === "bluetooth" && !btAddress) {
      Toast.show({
        type: "info",
        text1: "No Printer Selected",
        text2: "Select a device or enter Bluetooth address to test",
      });
      return;
    }

    if (connectionType === "wifi" && !ipAddress.trim()) {
      Toast.show({
        type: "info",
        text1: "No IP Address",
        text2: "Enter printer IP address to test",
      });
      return;
    }

    Toast.show({
      type: "info",
      text1: "Test Print",
      text2: "Sending test page...",
    });

    try {
      if (connectionType === "bluetooth" && printService.isAvailable()) {
        // Use actual print service for Bluetooth
        const result = await printService.testPrint(btAddress, printerName || "DHIVA DEVA SUPER MARKET");

        if (result.success) {
          Toast.show({
            type: "success",
            text1: "Test Print Success",
            text2: "Printer is working correctly!",
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Test Print Failed",
            text2: result.error || "Could not print test page",
          });
        }
      } else {
        // Simulation for WiFi/USB/Internal or when Bluetooth is not available
        setTimeout(() => {
          Toast.show({
            type: "success",
            text1: "Test Print",
            text2: "Test print simulated successfully",
          });
        }, 1000);
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Test Print Failed",
        text2: error.message || "Could not connect to printer",
      });
    }
  };

  const handleAddPrinter = async () => {
    if (!printerName.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter a printer name",
      });
      return;
    }

    const btAddress = selectedDevice?.address || bluetoothAddress.trim();

    if (connectionType === "bluetooth" && !btAddress) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select a device or enter Bluetooth address",
      });
      return;
    }

    if (connectionType === "wifi" && !ipAddress.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter IP address and port",
      });
      return;
    }

    setSaving(true);

    try {
      const newPrinter: PrinterConfig = {
        id: `printer_${Date.now()}`,
        name: printerName,
        connectionType,
        address: connectionType === "bluetooth" ? btAddress : undefined,
        ipAddress:
          connectionType === "wifi" ? ipAddress.split(":")[0] : undefined,
        port:
          connectionType === "wifi" ? ipAddress.split(":")[1] || "9100" : undefined,
        paperWidth,
        charsPerLine,
        isDefault,
        enabled,
        autoCutter,
      };

      let updatedPrinters = existingPrinters.map((p) => ({
        ...p,
        isDefault: isDefault ? false : p.isDefault,
      }));

      updatedPrinters.push(newPrinter);

      await AsyncStorage.setItem(PRINTERS_KEY, JSON.stringify(updatedPrinters));

      Toast.show({
        type: "success",
        text1: "Printer Added",
        text2: `${printerName} has been added successfully`,
      });

      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save printer",
      });
    } finally {
      setSaving(false);
    }
  };

  const ConnectionTypeButton = ({
    type,
    icon: Icon,
    label,
  }: {
    type: "bluetooth" | "wifi" | "usb" | "internal";
    icon: any;
    label: string;
  }) => (
    <Pressable
      onPress={() => setConnectionType(type)}
      style={{
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRadius: 12,
        backgroundColor: connectionType === type ? "#2E7D32" : colors.card,
        borderWidth: 1,
        borderColor: connectionType === type ? "#2E7D32" : colors.border,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 3,
      }}
    >
      <Icon
        size={18}
        color={connectionType === type ? "#FFFFFF" : colors.text}
      />
      <Text
        style={{
          marginTop: 4,
          fontSize: 9,
          fontWeight: "700",
          color: connectionType === type ? "#FFFFFF" : colors.text,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );

  const SelectButton = ({
    selected,
    label,
    onPress,
  }: {
    selected: boolean;
    label: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: selected ? "#2E7D32" : colors.card,
        borderWidth: 1,
        borderColor: selected ? "#2E7D32" : colors.border,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 4,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: selected ? "#FFFFFF" : colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

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
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}>
          Add Printer
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={{ padding: 16 }}>
          {/* Printer Name */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}
            >
              Printer Name
            </Text>
            <TextInput
              value={printerName}
              onChangeText={setPrinterName}
              placeholder="e.g., Kitchen Printer"
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>

          {/* Connection Type */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}
            >
              Connection Type
            </Text>
            <View style={{ flexDirection: "row", marginHorizontal: -4 }}>
              <ConnectionTypeButton
                type="bluetooth"
                icon={Bluetooth}
                label="BLUETOOTH"
              />
              <ConnectionTypeButton type="wifi" icon={Wifi} label="WIFI" />
              <ConnectionTypeButton type="usb" icon={Usb} label="USB" />
              <ConnectionTypeButton
                type="internal"
                icon={Smartphone}
                label="INTERNAL"
              />
            </View>
          </View>

          {/* Bluetooth Device Selection */}
          {connectionType === "bluetooth" && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: colors.text,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                Select Device
              </Text>
              {selectedDevice ? (
                <Pressable
                  onPress={openBottomSheet}
                  style={{
                    backgroundColor: isDark ? "#064E3B" : "#F0FDF4",
                    padding: 16,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#66BB6A40",
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      backgroundColor: isDark ? "#166534" : "#E8F5E9",
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={22} color="#66BB6A" />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      style={{ color: "#66BB6A", fontWeight: "700", fontSize: 15 }}
                    >
                      {selectedDevice.name}
                    </Text>
                    <Text
                      style={{
                        color: isDark ? "#6EE7B7" : "#15803D",
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {selectedDevice.address}
                    </Text>
                  </View>
                  <Text style={{ color: "#2E7D32", fontWeight: "600" }}>
                    Change
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={openBottomSheet}
                  style={{
                    backgroundColor: colors.card,
                    padding: 16,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
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
                    <Bluetooth size={22} color="#2E7D32" />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      style={{ color: "#2E7D32", fontWeight: "600", fontSize: 15 }}
                    >
                      Select Bluetooth Device
                    </Text>
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      Tap to view paired & available devices
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textMuted} />
                </Pressable>
              )}

              {/* Manual Bluetooth Address Entry */}
              {!selectedDevice && (
                <View style={{ marginTop: 12 }}>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 12,
                      marginBottom: 8,
                      textAlign: "center",
                    }}
                  >
                    Or enter Bluetooth address manually
                  </Text>
                  <TextInput
                    value={bluetoothAddress}
                    onChangeText={handleBluetoothAddressChange}
                    placeholder="e.g., 00:11:22:33:44:55"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 15,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: bluetoothAddress.trim()
                        ? "#2E7D32"
                        : colors.border,
                      textAlign: "center",
                      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                    }}
                  />
                </View>
              )}

              {/* Troubleshoot Button */}
              <Pressable
                onPress={() => setShowTroubleshoot(true)}
                style={{
                  marginTop: 16,
                  backgroundColor: isDark ? "#78350F" : "#FEF3C7",
                  padding: 14,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <HelpCircle size={20} color="#D97706" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text
                    style={{ color: "#D97706", fontWeight: "600", fontSize: 14 }}
                  >
                    Printer Not Working?
                  </Text>
                  <Text
                    style={{
                      color: isDark ? "#FCD34D" : "#B45309",
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    Tap here for troubleshooting steps
                  </Text>
                </View>
                <ChevronRight size={18} color="#D97706" />
              </Pressable>
            </View>
          )}

          {/* WiFi Settings */}
          {connectionType === "wifi" && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: colors.text,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                IP Address:Port
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TextInput
                  value={ipAddress}
                  onChangeText={setIpAddress}
                  placeholder="192.168.1.100:9100"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="default"
                  style={{
                    flex: 1,
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 15,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
                <Pressable
                  onPress={handleSearchNetwork}
                  disabled={isSearchingNetwork}
                  style={{
                    marginLeft: 12,
                    width: 50,
                    height: 50,
                    backgroundColor: "#2E7D32",
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSearchingNetwork ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Search size={20} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* Paper Width */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}
            >
              Paper Width
            </Text>
            <View style={{ flexDirection: "row", marginHorizontal: -4 }}>
              <SelectButton
                selected={paperWidth === "58mm"}
                label="58mm"
                onPress={() => setPaperWidth("58mm")}
              />
              <SelectButton
                selected={paperWidth === "80mm"}
                label="80mm"
                onPress={() => setPaperWidth("80mm")}
              />
            </View>
          </View>

          {/* Characters Per Line */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}
            >
              Characters Per Line
            </Text>
            <View style={{ flexDirection: "row", marginHorizontal: -4 }}>
              <SelectButton
                selected={charsPerLine === 42}
                label="42"
                onPress={() => setCharsPerLine(42)}
              />
              <SelectButton
                selected={charsPerLine === 46}
                label="46"
                onPress={() => setCharsPerLine(46)}
              />
              <SelectButton
                selected={charsPerLine === 48}
                label="48"
                onPress={() => setCharsPerLine(48)}
              />
            </View>
            <Text
              style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}
            >
              Adjust if text wraps or has too much space
            </Text>
          </View>

          {/* Toggles */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}
              >
                Set as Default
              </Text>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{ false: colors.border, true: "#2E7D32" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}
              >
                Enabled
              </Text>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: colors.border, true: "#2E7D32" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
              }}
            >
              <View>
                <Text
                  style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}
                >
                  Auto Cutter
                </Text>
                <Text
                  style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}
                >
                  Enable if printer has paper cutter
                </Text>
              </View>
              <Switch
                value={autoCutter}
                onValueChange={setAutoCutter}
                trackColor={{ false: colors.border, true: "#2E7D32" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Test Button */}
          <View style={{ marginBottom: 20 }}>
            <Pressable
              onPress={handleTestPrint}
              style={{
                backgroundColor: isDark ? "#14532D" : "#E8F5E9",
                paddingVertical: 14,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#2E7D3250",
              }}
            >
              <Printer size={18} color="#2E7D32" />
              <Text
                style={{ marginLeft: 8, color: "#2E7D32", fontWeight: "600" }}
              >
                Test Print
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Add Printer Button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Pressable
          onPress={handleAddPrinter}
          disabled={saving}
          style={{
            backgroundColor: "#2E7D32",
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#2E7D32",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }}
            >
              Add Printer
            </Text>
          )}
        </Pressable>
      </View>

      {/* Bluetooth Devices Selector Sheet */}
      <BluetoothDeviceSelectorSheet
        visible={showBottomSheet}
        onClose={closeBottomSheet}
        onSelectDevice={handleDeviceSelected}
        selectedDevice={selectedDevice}
      />

      {/* Troubleshooting Modal */}
      <Modal
        visible={showTroubleshoot}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTroubleshoot(false)}
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
              maxHeight: "90%",
            }}
          >
            {/* Handle */}
            <View
              style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: colors.border,
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
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View>
                <Text
                  style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}
                >
                  Troubleshooting Guide
                </Text>
                <Text
                  style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}
                >
                  Fix printer connection issues
                </Text>
              </View>
              <Pressable
                onPress={() => setShowTroubleshoot(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 600 }}
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Problem Description */}
              <View
                style={{
                  backgroundColor: isDark ? "#450A0A" : "#FEF2F2",
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 20,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <AlertCircle size={24} color="#EF4444" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text
                    style={{ color: "#EF4444", fontWeight: "700", fontSize: 14 }}
                  >
                    Printer Paired But Not Working?
                  </Text>
                  <Text
                    style={{
                      color: isDark ? "#FCA5A5" : "#B91C1C",
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    Follow these steps to fix the connection
                  </Text>
                </View>
              </View>

              {/* Step 1 */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  flexDirection: "row",
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isDark ? "#1E3A8A" : "#DBEAFE",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Power size={18} color="#3B82F6" />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
                    Step 1: Toggle Bluetooth
                  </Text>
                  <Text
                    style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}
                  >
                    Turn Bluetooth OFF and then ON again on your device. This refreshes the Bluetooth connection.
                  </Text>
                </View>
              </View>

              {/* Step 2 */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  flexDirection: "row",
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trash2 size={18} color="#EF4444" />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
                    Step 2: Unpair/Forget Printer
                  </Text>
                  <Text
                    style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}
                  >
                    Go to Bluetooth settings, find the printer, and tap "Forget" or "Unpair" to remove it completely.
                  </Text>
                  <Pressable
                    onPress={openBluetoothSettings}
                    style={{
                      backgroundColor: isDark ? "#1E3A8A" : "#DBEAFE",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      alignSelf: "flex-start",
                      marginTop: 10,
                    }}
                  >
                    <Text style={{ color: "#3B82F6", fontWeight: "600", fontSize: 13 }}>
                      Open Bluetooth Settings
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Step 3 */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  flexDirection: "row",
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isDark ? "#14532D" : "#E8F5E9",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <RotateCcw size={18} color="#66BB6A" />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
                    Step 3: Restart Devices
                  </Text>
                  <Text
                    style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}
                  >
                    Turn OFF the printer, close this app completely, then turn the printer back ON and reopen the app.
                  </Text>
                </View>
              </View>

              {/* Step 4 */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  flexDirection: "row",
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isDark ? "#78350F" : "#FEF3C7",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Radio size={18} color="#D97706" />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
                    Step 4: Pairing Mode
                  </Text>
                  <Text
                    style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}
                  >
                    Put the printer into pairing mode (usually by holding the power button until it blinks). Then pair it again from Bluetooth settings.
                  </Text>
                </View>
              </View>

              {/* Step 5 */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  flexDirection: "row",
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isDark ? "#581C87" : "#F3E8FF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShieldCheck size={18} color="#9333EA" />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
                    Step 5: Check Permissions
                  </Text>
                  <Text
                    style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}
                  >
                    Make sure Location and Bluetooth permissions are enabled for this app in your device settings.
                  </Text>
                  <Pressable
                    onPress={() => Linking.openSettings()}
                    style={{
                      backgroundColor: isDark ? "#581C87" : "#F3E8FF",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      alignSelf: "flex-start",
                      marginTop: 10,
                    }}
                  >
                    <Text style={{ color: "#9333EA", fontWeight: "600", fontSize: 13 }}>
                      Open App Settings
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Step 6 */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  flexDirection: "row",
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isDark ? "#164E63" : "#CFFAFE",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PhoneIcon size={18} color="#0891B2" />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
                    Step 6: Check Other Devices
                  </Text>
                  <Text
                    style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}
                  >
                    Make sure no other phone or tablet is already connected to the printer. Disconnect from other devices first.
                  </Text>
                </View>
              </View>

              {/* Step 7 */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 20,
                  flexDirection: "row",
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isDark ? "#374151" : "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <RestartIcon size={18} color={colors.textSecondary} />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
                    Step 7: Clear Cache / Reinstall
                  </Text>
                  <Text
                    style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}
                  >
                    If nothing works, clear the app cache from device settings or reinstall the app, then try pairing again.
                  </Text>
                </View>
              </View>

              {/* Tip Box */}
              <View
                style={{
                  backgroundColor: isDark ? "#14532D" : "#F0FDF4",
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: "#66BB6A40",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Check size={18} color="#66BB6A" />
                  <Text
                    style={{ color: "#66BB6A", fontWeight: "700", fontSize: 14, marginLeft: 8 }}
                  >
                    Pro Tips
                  </Text>
                </View>
                <Text style={{ color: isDark ? "#86EFAC" : "#166534", fontSize: 13, lineHeight: 20 }}>
                  • Keep printer and phone within 3 meters{"\n"}
                  • Ensure printer has enough battery/power{"\n"}
                  • Try restarting your phone if issues persist{"\n"}
                  • Some printers need PIN "0000" or "1234" to pair
                </Text>
              </View>

              {/* Close Button */}
              <Pressable
                onPress={() => setShowTroubleshoot(false)}
                style={{
                  backgroundColor: "#2E7D32",
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
                  Got It
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
