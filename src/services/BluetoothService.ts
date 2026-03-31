/**
 * Bluetooth Service for Android device discovery
 * Uses react-native-bluetooth-escpos-printer
 */

import { Platform, NativeEventEmitter, PermissionsAndroid } from "react-native";

export interface BluetoothDevice {
  name: string;
  address: string;
  isPaired: boolean;
}

export interface DiscoveryCallbacks {
  onPairedDevices?: (devices: BluetoothDevice[]) => void;
  onDeviceFound?: (device: BluetoothDevice) => void;
  onDiscoveryComplete?: (allDevices: BluetoothDevice[]) => void;
  onError?: (error: string) => void;
}

// Global variables to hold the native module
let BluetoothManager: any = null;
let BluetoothEscposPrinter: any = null;
let isModuleAvailable = false;
let initAttempted = false;

// Event constants from the library
const EVENT_DEVICE_ALREADY_PAIRED = "EVENT_DEVICE_ALREADY_PAIRED";
const EVENT_DEVICE_FOUND = "EVENT_DEVICE_FOUND";
const EVENT_DEVICE_DISCOVER_DONE = "EVENT_DEVICE_DISCOVER_DONE";
const EVENT_CONNECTION_LOST = "EVENT_CONNECTION_LOST";
const EVENT_BLUETOOTH_NOT_SUPPORT = "EVENT_BLUETOOTH_NOT_SUPPORT";

// Try to load the native module
const tryLoadBluetoothModule = () => {
  if (initAttempted) return isModuleAvailable;
  initAttempted = true;

  if (Platform.OS !== "android") {
    return false;
  }

  try {
    const bluetoothModule = require("react-native-bluetooth-escpos-printer");

    // Verify the module is properly loaded (not null)
    if (bluetoothModule && bluetoothModule.BluetoothManager) {
      // Additional check to ensure native module is actually available
      // (not just the JS wrapper)
      const manager = bluetoothModule.BluetoothManager;
      const printer = bluetoothModule.BluetoothEscposPrinter;

      // Check if a key property exists to verify native module is loaded
      if (printer && printer.ALIGN !== undefined) {
        BluetoothManager = manager;
        BluetoothEscposPrinter = printer;
        isModuleAvailable = true;
        console.log("[BluetoothService] Native module loaded successfully");
        return true;
      } else {
        console.log("[BluetoothService] Native module incomplete - development build required");
        return false;
      }
    }
  } catch (error: any) {
    // Suppress common errors from Expo Go
    if (error.message?.includes("DIRECTION") || error.message?.includes("null")) {
      console.log("[BluetoothService] Bluetooth not available in Expo Go");
    } else {
      console.log("[BluetoothService] Native module not available:", error.message || error);
    }
    isModuleAvailable = false;
  }

  return false;
};

class BluetoothService {
  private eventEmitter: NativeEventEmitter | null = null;
  private eventSubscriptions: any[] = [];
  private pairedDevices: BluetoothDevice[] = [];
  private discoveredDevices: BluetoothDevice[] = [];
  private callbacks: DiscoveryCallbacks = {};

  constructor() {
    // Try to load the module
    if (tryLoadBluetoothModule() && BluetoothManager) {
      // Pass BluetoothManager to NativeEventEmitter so it can receive native events
      this.eventEmitter = new NativeEventEmitter(BluetoothManager);
      console.log("[BluetoothService] Event emitter initialized with BluetoothManager");
    }
  }

  isAvailable(): boolean {
    // Try loading if not attempted yet
    if (!initAttempted) {
      tryLoadBluetoothModule();
    }
    return Platform.OS === "android" && isModuleAvailable && BluetoothManager !== null;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== "android") {
      return false;
    }

    try {
      const apiLevel = Platform.Version;

      if (typeof apiLevel === "number" && apiLevel >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        return Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    } catch (error) {
      console.log("[BluetoothService] Permission error:", error);
      return false;
    }
  }

  async isBluetoothEnabled(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      return await BluetoothManager.isBluetoothEnabled();
    } catch (error) {
      return false;
    }
  }

  async enableBluetooth(): Promise<BluetoothDevice[]> {
    if (!this.isAvailable()) {
      throw new Error("Bluetooth not available. Development build required.");
    }

    try {
      console.log("[BluetoothService] Enabling Bluetooth...");
      const result = await BluetoothManager.enableBluetooth();
      console.log("[BluetoothService] Enable result:", result);

      // Parse the result - enableBluetooth returns paired devices
      let paired: BluetoothDevice[] = [];

      if (result) {
        // Result might be JSON string array or array of objects
        if (typeof result === "string") {
          try {
            const parsed = JSON.parse(result);
            paired = this.parseDeviceArray(Array.isArray(parsed) ? parsed : [parsed], true);
          } catch (e) {
            console.log("[BluetoothService] Could not parse enable result as JSON");
          }
        } else if (Array.isArray(result)) {
          paired = this.parseDeviceArray(result, true);
        }
      }

      this.pairedDevices = paired;
      console.log("[BluetoothService] Found", paired.length, "paired devices:", paired);
      return paired;
    } catch (error: any) {
      console.log("[BluetoothService] Enable error:", error);

      // Check if it's a permission error
      if (error.message?.includes("Permission") || error.message?.includes("BLUETOOTH_CONNECT")) {
        throw new Error("Bluetooth permission denied. Please enable in Settings.");
      }

      throw new Error("Failed to enable Bluetooth. Please enable it manually in Settings.");
    }
  }

  async fetchPairedDevices(): Promise<BluetoothDevice[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      // First ensure Bluetooth is enabled, which also returns paired devices
      const devices = await this.enableBluetooth();
      return devices;
    } catch (error) {
      console.log("[BluetoothService] Error fetching paired devices:", error);
      return [];
    }
  }

  async scanDevicesAsync(): Promise<{ paired: BluetoothDevice[]; found: BluetoothDevice[] }> {
    if (!this.isAvailable()) {
      throw new Error("Bluetooth not available");
    }

    try {
      console.log("[BluetoothService] Scanning devices async...");
      const result = await BluetoothManager.scanDevices();
      console.log("[BluetoothService] Scan result:", result);

      let paired: BluetoothDevice[] = [];
      let found: BluetoothDevice[] = [];

      if (result) {
        // Parse the result - it may come as JSON string or object
        let parsedResult = result;
        if (typeof result === "string") {
          try {
            parsedResult = JSON.parse(result);
          } catch (e) {
            console.log("[BluetoothService] Failed to parse scan result");
          }
        }

        // Handle paired devices
        if (parsedResult.paired) {
          paired = this.parseDeviceArray(parsedResult.paired, true);
        }

        // Handle found/available devices
        if (parsedResult.found) {
          found = this.parseDeviceArray(parsedResult.found, false);
        }
      }

      this.pairedDevices = paired;
      this.discoveredDevices = found;

      return { paired, found };
    } catch (error: any) {
      console.log("[BluetoothService] Scan async error:", error);
      throw error;
    }
  }

  private parseDeviceArray(data: any, isPaired: boolean): BluetoothDevice[] {
    const devices: BluetoothDevice[] = [];

    if (!data) return devices;

    try {
      let deviceArray: any[] = [];

      if (typeof data === "string") {
        deviceArray = JSON.parse(data);
      } else if (Array.isArray(data)) {
        deviceArray = data;
      }

      for (const item of deviceArray) {
        let parsed = item;
        if (typeof item === "string") {
          try {
            parsed = JSON.parse(item);
          } catch {
            continue;
          }
        }

        if (parsed && parsed.address) {
          devices.push({
            name: parsed.name || "Unknown Device",
            address: parsed.address,
            isPaired: isPaired,
          });
        }
      }
    } catch (e) {
      console.log("[BluetoothService] Error parsing device array:", e);
    }

    return devices;
  }

  async startDiscovery(callbacks: DiscoveryCallbacks): Promise<void> {
    if (!this.isAvailable()) {
      callbacks.onError?.("Development build required for Bluetooth scanning");
      return;
    }

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      callbacks.onError?.("Bluetooth permissions not granted");
      return;
    }

    this.callbacks = callbacks;
    this.discoveredDevices = [];

    // Setup event listeners BEFORE starting scan
    this.setupEventListeners();

    try {
      console.log("[BluetoothService] Starting device scan...");

      // Use scanDevices which triggers async discovery
      // The native module will emit events as devices are found
      const result = await BluetoothManager.scanDevices();
      console.log("[BluetoothService] Scan initiated, result type:", typeof result);

      // Parse result if it's returned directly (some versions of the library do this)
      if (result) {
        let parsedResult = result;
        if (typeof result === "string") {
          try {
            parsedResult = JSON.parse(result);
            console.log("[BluetoothService] Parsed scan result:", JSON.stringify(parsedResult).substring(0, 200));
          } catch (e) {
            console.log("[BluetoothService] Result is not JSON, relying on events");
          }
        }

        // If we got paired devices in the result
        if (parsedResult && parsedResult.paired) {
          const paired = this.parseDeviceArray(parsedResult.paired, true);
          console.log("[BluetoothService] Parsed paired from result:", paired.length);
          if (paired.length > 0) {
            this.pairedDevices = paired;
            callbacks.onPairedDevices?.(paired);
          }
        }

        // If we got found devices in the result
        if (parsedResult && parsedResult.found) {
          const found = this.parseDeviceArray(parsedResult.found, false);
          console.log("[BluetoothService] Parsed found from result:", found.length);
          found.forEach(device => {
            if (!this.discoveredDevices.find(d => d.address === device.address)) {
              this.discoveredDevices.push(device);
              callbacks.onDeviceFound?.(device);
            }
          });
        }

        // If we got results directly, signal completion
        if (parsedResult && (parsedResult.paired || parsedResult.found)) {
          console.log("[BluetoothService] Discovery complete from direct result");
          callbacks.onDiscoveryComplete?.([...this.pairedDevices, ...this.discoveredDevices]);
          this.removeEventListeners();
        } else {
          // No direct results - wait for events with timeout
          console.log("[BluetoothService] Waiting for discovery events...");
          setTimeout(() => {
            console.log("[BluetoothService] Discovery timeout - completing");
            callbacks.onDiscoveryComplete?.([...this.pairedDevices, ...this.discoveredDevices]);
            this.removeEventListeners();
          }, 12000); // 12 second timeout for discovery
        }
      } else {
        // No result returned - rely on events with timeout
        console.log("[BluetoothService] No direct result, waiting for events...");
        setTimeout(() => {
          console.log("[BluetoothService] Discovery timeout - completing");
          callbacks.onDiscoveryComplete?.([...this.pairedDevices, ...this.discoveredDevices]);
          this.removeEventListeners();
        }, 12000);
      }
    } catch (error: any) {
      console.log("[BluetoothService] Scan error:", error);
      callbacks.onError?.(error.message || "Discovery failed");
      this.removeEventListeners();
    }
  }

  stopDiscovery(): void {
    this.removeEventListeners();
  }

  getPairedDevices(): BluetoothDevice[] {
    return [...this.pairedDevices];
  }

  getDiscoveredDevices(): BluetoothDevice[] {
    return [...this.discoveredDevices];
  }

  async connectToDevice(address: string): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error("Bluetooth not available");
    }

    try {
      console.log("[BluetoothService] Connecting to:", address);
      await BluetoothManager.connect(address);
      console.log("[BluetoothService] Connected successfully");
      return true;
    } catch (error: any) {
      console.log("[BluetoothService] Connection error:", error);
      throw new Error(`Connection failed: ${error.message || "Unknown error"}`);
    }
  }

  /**
   * Write raw data to the connected printer
   * @param address - The device address (not used in current implementation as library handles connection)
   * @param data - The raw ESC/POS data to send
   */
  async writeData(address: string, data: Uint8Array): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error("Bluetooth not available");
    }

    if (!BluetoothEscposPrinter) {
      throw new Error("Printer module not available");
    }

    try {
      console.log("[BluetoothService] Writing data to printer, length:", data.length);

      // Convert Uint8Array to base64 string for transmission
      const base64Data = this.uint8ArrayToBase64(data);

      // Use the printer's raw data printing capability
      await BluetoothEscposPrinter.printRawData(base64Data);

      console.log("[BluetoothService] Data sent successfully");
    } catch (error: any) {
      console.log("[BluetoothService] Write error:", error);
      throw new Error(`Failed to send data: ${error.message || "Unknown error"}`);
    }
  }

  /**
   * Convert Uint8Array to base64 string
   */
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // Use global btoa if available, otherwise handle it manually
    if (typeof btoa !== "undefined") {
      return btoa(binary);
    }
    // For React Native, we can use a simple base64 encoding
    const base64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = "";
    let i = 0;
    while (i < binary.length) {
      const a = binary.charCodeAt(i++);
      const b = i < binary.length ? binary.charCodeAt(i++) : 0;
      const c = i < binary.length ? binary.charCodeAt(i++) : 0;

      const triplet = (a << 16) | (b << 8) | c;

      result += base64chars.charAt((triplet >> 18) & 0x3F);
      result += base64chars.charAt((triplet >> 12) & 0x3F);
      result += i > binary.length + 1 ? "=" : base64chars.charAt((triplet >> 6) & 0x3F);
      result += i > binary.length ? "=" : base64chars.charAt(triplet & 0x3F);
    }
    return result;
  }

  private setupEventListeners(): void {
    if (!this.eventEmitter) {
      console.log("[BluetoothService] No event emitter available");
      return;
    }

    this.removeEventListeners();

    console.log("[BluetoothService] Setting up event listeners...");

    // Listen for paired devices event
    const pairedSub = this.eventEmitter.addListener(
      "EVENT_DEVICE_ALREADY_PAIRED",
      (data: any) => {
        try {
          console.log("[BluetoothService] EVENT_DEVICE_ALREADY_PAIRED received:", JSON.stringify(data).substring(0, 200));
          const devices = this.parseEventDevices(data?.devices || data, true);
          console.log("[BluetoothService] Parsed paired devices:", devices.length);
          if (devices.length > 0) {
            this.pairedDevices = devices;
            this.callbacks.onPairedDevices?.(devices);
          }
        } catch (e) {
          console.log("[BluetoothService] Error parsing paired devices:", e);
        }
      }
    );

    // Listen for individual device found events
    const foundSub = this.eventEmitter.addListener(
      "EVENT_DEVICE_FOUND",
      (data: any) => {
        try {
          console.log("[BluetoothService] EVENT_DEVICE_FOUND received:", JSON.stringify(data).substring(0, 200));
          const device = this.parseFoundDevice(data?.device || data);
          if (device) {
            console.log("[BluetoothService] Device found:", device.name, device.address);
            const alreadyDiscovered = this.discoveredDevices.some(
              (d) => d.address === device.address
            );
            const alreadyPaired = this.pairedDevices.some(
              (p) => p.address === device.address
            );

            if (!alreadyDiscovered && !alreadyPaired) {
              this.discoveredDevices.push(device);
              this.callbacks.onDeviceFound?.(device);
              console.log("[BluetoothService] Total discovered devices:", this.discoveredDevices.length);
            }
          }
        } catch (e) {
          console.log("[BluetoothService] Error parsing found device:", e);
        }
      }
    );

    // Listen for discovery complete event
    const doneSub = this.eventEmitter.addListener(
      "EVENT_DEVICE_DISCOVER_DONE",
      () => {
        console.log("[BluetoothService] EVENT_DEVICE_DISCOVER_DONE received");
        console.log("[BluetoothService] Final count - Paired:", this.pairedDevices.length, "Discovered:", this.discoveredDevices.length);
        const allDevices = [...this.pairedDevices, ...this.discoveredDevices];
        this.callbacks.onDiscoveryComplete?.(allDevices);
        this.removeEventListeners();
      }
    );

    this.eventSubscriptions = [pairedSub, foundSub, doneSub];
    console.log("[BluetoothService] Event listeners setup complete");
  }

  private removeEventListeners(): void {
    this.eventSubscriptions.forEach((sub) => {
      try {
        sub.remove();
      } catch (e) {}
    });
    this.eventSubscriptions = [];
  }

  private parseDevices(data: any, isPaired: boolean): BluetoothDevice[] {
    const devices: BluetoothDevice[] = [];

    if (!data) return devices;

    try {
      let deviceArray: any[] = [];

      if (typeof data === "string") {
        deviceArray = JSON.parse(data);
      } else if (Array.isArray(data)) {
        deviceArray = data.map((item) => {
          if (typeof item === "string") {
            try {
              return JSON.parse(item);
            } catch {
              return item;
            }
          }
          return item;
        });
      }

      for (const item of deviceArray) {
        if (item && item.address) {
          devices.push({
            name: item.name || "Unknown Device",
            address: item.address,
            isPaired: isPaired,
          });
        }
      }
    } catch (e) {
      console.log("[BluetoothService] Error parsing devices:", e);
    }

    return devices;
  }

  private parseEventDevices(data: any, isPaired: boolean): BluetoothDevice[] {
    const devices: BluetoothDevice[] = [];

    if (!data) return devices;

    try {
      let deviceArray: any[] = [];

      if (typeof data === "string") {
        deviceArray = JSON.parse(data);
      } else if (Array.isArray(data)) {
        deviceArray = data;
      }

      for (const item of deviceArray) {
        const parsed = typeof item === "string" ? JSON.parse(item) : item;
        if (parsed && parsed.address) {
          devices.push({
            name: parsed.name || "Unknown Device",
            address: parsed.address,
            isPaired: isPaired,
          });
        }
      }
    } catch (e) {
      console.log("[BluetoothService] Error parsing event devices:", e);
    }

    return devices;
  }

  private parseFoundDevice(data: any): BluetoothDevice | null {
    if (!data) return null;

    try {
      let device: any = data;

      if (typeof data === "string") {
        try {
          device = JSON.parse(data);
        } catch {
          return null;
        }
      }

      if (device.device) {
        device = device.device;
      }

      const address = device.address || device.id || device.macAddress || device.mac;
      const name = device.name || device.deviceName || "Unknown Device";

      if (address) {
        return {
          name: name,
          address: address,
          isPaired: false,
        };
      }
    } catch (e) {
      console.log("[BluetoothService] Error parsing found device:", e);
    }

    return null;
  }

  destroy(): void {
    this.removeEventListeners();
    this.callbacks = {};
    this.pairedDevices = [];
    this.discoveredDevices = [];
  }
}

export const bluetoothService = new BluetoothService();
export default bluetoothService;
