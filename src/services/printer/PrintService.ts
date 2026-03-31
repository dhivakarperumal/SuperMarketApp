/**
 * ============================================================================
 * Print Service - Thermal Printer Integration
 * ============================================================================
 *
 * Handles thermal printing for receipts, invoices, and barcodes
 * Supports Bluetooth printers via ESC/POS protocol
 *
 * PLATFORM SUPPORT:
 * ----------------
 * - Android: Bluetooth SPP via react-native-bluetooth-escpos-printer
 * - iOS: Limited (Bluetooth SPP not supported, would need BLE implementation)
 *
 * ============================================================================
 */

import { Platform } from "react-native";
import { ReceiptData, InvoiceData, BarcodeData, ReceiptSettings } from "../../types";
import receiptBuilder from "./ReceiptBuilder";

// Try to load the Bluetooth printer module
let BluetoothEscposPrinter: any = null;
let BluetoothManager: any = null;
let isBluetoothModuleAvailable = false;

// Only attempt to load on Android and only in development builds (not Expo Go)
const loadBluetoothModule = () => {
  if (Platform.OS !== "android") {
    console.log("[PrintService] Bluetooth printing only available on Android");
    return;
  }

  try {
    // Check if we're in a development build with native modules
    const btLib = require("react-native-bluetooth-escpos-printer");

    // Verify the module is properly loaded (not null)
    if (btLib && btLib.BluetoothEscposPrinter && btLib.BluetoothManager) {
      BluetoothEscposPrinter = btLib.BluetoothEscposPrinter;
      BluetoothManager = btLib.BluetoothManager;

      // Additional check - make sure ALIGN constant exists
      if (BluetoothEscposPrinter.ALIGN) {
        isBluetoothModuleAvailable = true;
        console.log("[PrintService] Bluetooth module loaded successfully");
      } else {
        console.log("[PrintService] Bluetooth module incomplete - running in Expo Go?");
      }
    } else {
      console.log("[PrintService] Bluetooth module not properly initialized");
    }
  } catch (e: any) {
    // This is expected in Expo Go - don't spam the logs
    if (e.message?.includes("DIRECTION") || e.message?.includes("null")) {
      console.log("[PrintService] Bluetooth not available (Expo Go detected)");
    } else {
      console.log("[PrintService] Bluetooth module not available:", e.message || e);
    }
  }
};

// Delay loading to avoid blocking app startup
setTimeout(loadBluetoothModule, 100);

// Print job status
export type PrintJobStatus = "pending" | "printing" | "completed" | "failed";

// Print result
export interface PrintResult {
  success: boolean;
  error?: string;
  errorCode?: "PRINTER_OFF" | "BLUETOOTH_OFF" | "NO_PRINTER" | "PRINT_FAILED";
  canRetry: boolean;
}

// Default print options for consistent formatting
const DEFAULT_PRINT_OPTIONS = {
  encoding: "GBK",
  codepage: 0,
  widthtimes: 0,
  heigthtimes: 0,
  fonttype: 0,
};

class PrintService {
  private isProcessing = false;
  private connectionTimeoutMs = 5000; // 5 seconds timeout

  /**
   * Check if Bluetooth printing is available
   */
  isAvailable(): boolean {
    return Platform.OS === "android" && isBluetoothModuleAvailable;
  }

  /**
   * Ensure Bluetooth is enabled before printing
   */
  private async ensureBluetoothEnabled(): Promise<boolean> {
    if (!BluetoothManager) {
      return false;
    }

    try {
      const isEnabled = await BluetoothManager.isBluetoothEnabled();
      if (isEnabled) {
        return true;
      }

      // Prompt user to enable Bluetooth
      console.log("[PrintService] Bluetooth disabled, prompting user...");
      await BluetoothManager.enableBluetooth();
      console.log("[PrintService] Bluetooth enabled by user");
      return true;
    } catch (error: any) {
      console.log("[PrintService] Bluetooth enable failed:", error?.message);
      return false;
    }
  }

  /**
   * Connect to Bluetooth printer with retry logic
   */
  private async connectToPrinter(
    address: string,
    retries: number = 2
  ): Promise<void> {
    if (!BluetoothManager) {
      throw new Error("Bluetooth not available");
    }

    // Ensure Bluetooth is enabled
    const isEnabled = await this.ensureBluetoothEnabled();
    if (!isEnabled) {
      throw new Error(
        "Please enable Bluetooth to print. Go to Settings > Bluetooth and turn it on."
      );
    }

    let lastError: any = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(
          `[PrintService] Connecting to printer: ${address} (attempt ${attempt + 1})`
        );

        // Wrap connection in timeout
        const connectionPromise = BluetoothManager.connect(address);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Connection timeout")),
            this.connectionTimeoutMs
          )
        );

        await Promise.race([connectionPromise, timeoutPromise]);
        console.log("[PrintService] Connected successfully");
        return;
      } catch (error: any) {
        lastError = error;
        console.log(
          `[PrintService] Connection attempt ${attempt + 1} failed:`,
          error?.message
        );

        // Wait before retry
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    // All attempts failed
    const errorMsg = lastError?.message || "Unknown error";
    if (errorMsg.includes("BT NOT ENABLED") || errorMsg.includes("not enabled")) {
      throw new Error(
        "Please enable Bluetooth to print. Go to Settings > Bluetooth and turn it on."
      );
    }
    if (errorMsg.includes("Unable to connect")) {
      throw new Error(
        "Printer is OFF or not reachable. Please turn ON your printer and try again."
      );
    }
    throw new Error(`Could not connect to printer: ${errorMsg}`);
  }

  /**
   * Send raw ESC/POS bytes to the printer
   */
  private async sendRawData(data: Uint8Array): Promise<void> {
    if (!BluetoothEscposPrinter) {
      throw new Error("Bluetooth printer not available");
    }

    try {
      // Convert Uint8Array to base64 for the native module
      const base64 = this.uint8ArrayToBase64(data);
      await BluetoothEscposPrinter.printRawData(base64);
    } catch (error: any) {
      console.log("[PrintService] Raw data print error:", error);
      throw new Error(`Print failed: ${error?.message || "Unknown error"}`);
    }
  }

  /**
   * Print a receipt with optional settings
   */
  async printReceipt(
    address: string,
    data: ReceiptData,
    settings?: ReceiptSettings | null
  ): Promise<PrintResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: "Bluetooth printing not available on this platform",
        errorCode: "NO_PRINTER",
        canRetry: false,
      };
    }

    if (this.isProcessing) {
      return {
        success: false,
        error: "Another print job is in progress",
        errorCode: "PRINT_FAILED",
        canRetry: true,
      };
    }

    this.isProcessing = true;

    try {
      // Connect to printer
      await this.connectToPrinter(address);

      // Set settings on receipt builder
      receiptBuilder.setSettings(settings || null);

      // Build ESC/POS commands
      const commands = receiptBuilder.buildReceipt(data);

      // Send to printer
      await this.sendRawData(commands);

      console.log("[PrintService] Receipt printed successfully");
      return { success: true, canRetry: false };
    } catch (error: any) {
      console.error("[PrintService] Receipt print failed:", error);

      const errorMsg = error.message || "Print failed";
      let errorCode: PrintResult["errorCode"] = "PRINT_FAILED";

      if (errorMsg.includes("Bluetooth") || errorMsg.includes("BT NOT ENABLED")) {
        errorCode = "BLUETOOTH_OFF";
      } else if (errorMsg.includes("connect") || errorMsg.includes("OFF")) {
        errorCode = "PRINTER_OFF";
      }

      return {
        success: false,
        error: errorMsg,
        errorCode,
        canRetry: true,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Print an invoice with optional settings
   */
  async printInvoice(
    address: string,
    data: InvoiceData,
    settings?: ReceiptSettings | null
  ): Promise<PrintResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: "Bluetooth printing not available on this platform",
        errorCode: "NO_PRINTER",
        canRetry: false,
      };
    }

    if (this.isProcessing) {
      return {
        success: false,
        error: "Another print job is in progress",
        errorCode: "PRINT_FAILED",
        canRetry: true,
      };
    }

    this.isProcessing = true;

    try {
      await this.connectToPrinter(address);

      // Set settings on receipt builder
      receiptBuilder.setSettings(settings || null);

      const commands = receiptBuilder.buildInvoice(data);
      await this.sendRawData(commands);

      console.log("[PrintService] Invoice printed successfully");
      return { success: true, canRetry: false };
    } catch (error: any) {
      console.error("[PrintService] Invoice print failed:", error);
      return {
        success: false,
        error: error.message || "Print failed",
        errorCode: "PRINT_FAILED",
        canRetry: true,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Print a barcode label
   */
  async printBarcode(
    address: string,
    data: BarcodeData
  ): Promise<PrintResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: "Bluetooth printing not available on this platform",
        errorCode: "NO_PRINTER",
        canRetry: false,
      };
    }

    if (this.isProcessing) {
      return {
        success: false,
        error: "Another print job is in progress",
        errorCode: "PRINT_FAILED",
        canRetry: true,
      };
    }

    this.isProcessing = true;

    try {
      await this.connectToPrinter(address);
      const commands = receiptBuilder.buildBarcode(data);
      await this.sendRawData(commands);

      console.log("[PrintService] Barcode printed successfully");
      return { success: true, canRetry: false };
    } catch (error: any) {
      console.error("[PrintService] Barcode print failed:", error);
      return {
        success: false,
        error: error.message || "Print failed",
        errorCode: "PRINT_FAILED",
        canRetry: true,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Test print - prints a simple test page
   */
  async testPrint(address: string, storeName?: string): Promise<PrintResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: "Bluetooth printing not available on this platform",
        errorCode: "NO_PRINTER",
        canRetry: false,
      };
    }

    this.isProcessing = true;

    try {
      await this.connectToPrinter(address);

      if (!BluetoothEscposPrinter) {
        throw new Error("Printer not available");
      }

      // Initialize and print test content
      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER
      );
      await BluetoothEscposPrinter.printText(
        "================================\n",
        DEFAULT_PRINT_OPTIONS
      );
      await BluetoothEscposPrinter.printText(
        `${storeName || "DHIVA DEVA SUPER MARKET"}\n`,
        { ...DEFAULT_PRINT_OPTIONS, widthtimes: 1, heigthtimes: 1, fonttype: 1 }
      );
      await BluetoothEscposPrinter.printText(
        "================================\n",
        DEFAULT_PRINT_OPTIONS
      );
      await BluetoothEscposPrinter.printText(
        "\n*** TEST PRINT ***\n\n",
        DEFAULT_PRINT_OPTIONS
      );
      await BluetoothEscposPrinter.printText(
        "Printer is working correctly!\n",
        DEFAULT_PRINT_OPTIONS
      );
      await BluetoothEscposPrinter.printText(
        `Date: ${new Date().toLocaleString("en-IN")}\n`,
        DEFAULT_PRINT_OPTIONS
      );
      await BluetoothEscposPrinter.printText(
        "================================\n\n\n\n",
        DEFAULT_PRINT_OPTIONS
      );

      console.log("[PrintService] Test print successful");
      return { success: true, canRetry: false };
    } catch (error: any) {
      console.error("[PrintService] Test print failed:", error);
      return {
        success: false,
        error: error.message || "Test print failed",
        errorCode: "PRINT_FAILED",
        canRetry: true,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Check if printer is connected by testing connection
   */
  async checkPrinterConnection(address: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.connectToPrinter(address, 0); // No retries for status check
      return true;
    } catch {
      return false;
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

    // Use global btoa if available
    if (typeof btoa !== "undefined") {
      return btoa(binary);
    }

    // Fallback base64 encoding for React Native
    const base64chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = "";
    let i = 0;
    while (i < binary.length) {
      const a = binary.charCodeAt(i++);
      const b = i < binary.length ? binary.charCodeAt(i++) : 0;
      const c = i < binary.length ? binary.charCodeAt(i++) : 0;

      const triplet = (a << 16) | (b << 8) | c;

      result += base64chars.charAt((triplet >> 18) & 0x3f);
      result += base64chars.charAt((triplet >> 12) & 0x3f);
      result +=
        i > binary.length + 1 ? "=" : base64chars.charAt((triplet >> 6) & 0x3f);
      result += i > binary.length ? "=" : base64chars.charAt(triplet & 0x3f);
    }
    return result;
  }
}

// Export singleton instance
export const printService = new PrintService();
export default printService;
