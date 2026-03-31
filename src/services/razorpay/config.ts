// Razorpay Configuration
// Environment variable support with fallback to test key
// Set EXPO_PUBLIC_RAZORPAY_KEY_ID in your .env file for production

import Constants from "expo-constants";

// Get key from environment or use test key as fallback
const getKeyId = (): string => {
  // Try multiple ways to get the environment variable
  // Method 1: Direct process.env (works in some Expo setups)
  const envKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
  if (envKey && envKey.trim() && !envKey.includes("YOUR")) {
    console.log("[Razorpay] Using env key from process.env");
    return envKey.trim();
  }

  // Method 2: Expo Constants extra (from app.json/app.config.js)
  const extraKey = Constants.expoConfig?.extra?.razorpayKeyId;
  if (extraKey && extraKey.trim() && !extraKey.includes("YOUR")) {
    console.log("[Razorpay] Using key from Constants.extra");
    return extraKey.trim();
  }

  // Fallback to test key for development
  console.log("[Razorpay] Using fallback test key");
  return "rzp_test_SRp3XeJnSLwVEe";
};

export const RAZORPAY_KEY_ID = getKeyId();
export const RAZORPAY_TEST_MODE = RAZORPAY_KEY_ID.startsWith("rzp_test_");

// Minimum amount in INR (Razorpay requires minimum 1 INR)
export const MIN_AMOUNT_INR = 1;

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status?: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number; // Amount in paise (100 paise = 1 INR)
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes?: Record<string, string>;
  theme: {
    color: string;
  };
  retry?: {
    enabled: boolean;
    max_count: number;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata?: {
    order_id?: string;
    payment_id?: string;
  };
}

// Helper to escape strings for JavaScript embedding
const escapeForJS = (str: string): string => {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
};

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indian format)
const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[^0-9]/g, "");
  return cleaned.length === 10;
};

// Convert INR to paise with validation
export const convertToPaise = (amountInINR: number): number => {
  const amount = Number(amountInINR) || 0;
  if (amount < MIN_AMOUNT_INR) {
    console.warn(`Amount ${amount} is less than minimum ${MIN_AMOUNT_INR} INR`);
    return MIN_AMOUNT_INR * 100;
  }
  // Round to avoid floating point issues (e.g., 10.50 * 100 = 1050)
  return Math.round(amount * 100);
};

// Convert paise to INR
export const convertToINR = (amountInPaise: number): number => {
  return Math.round(amountInPaise) / 100;
};

export const createRazorpayOptions = (
  amount: number,
  orderId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string
): RazorpayOptions => {
  // Validate and sanitize inputs
  const safeAmount = convertToPaise(amount);
  const safeName = escapeForJS(customerName?.trim() || "Customer");

  // Validate and sanitize email
  let safeEmail = customerEmail?.trim() || "";
  if (!safeEmail || !isValidEmail(safeEmail)) {
    safeEmail = "customer@example.com";
  }
  safeEmail = escapeForJS(safeEmail);

  // Validate and sanitize phone (must be 10 digits for Indian numbers)
  let safePhone = (customerPhone || "").replace(/[^0-9]/g, "");
  if (!isValidPhone(safePhone)) {
    // Use a placeholder if invalid
    safePhone = "9999999999";
  }

  const safeOrderId = escapeForJS(orderId?.trim() || `ORD_${Date.now()}`);

  // Validate amount is reasonable (not more than 10 lakhs for safety)
  if (safeAmount > 1000000 * 100) {
    console.warn("Amount exceeds 10 lakhs, this might be an error");
  }

  return {
    key: RAZORPAY_KEY_ID,
    amount: safeAmount,
    currency: "INR",
    name: "Dhiva Deva Super Markets",
    description: `Order #${safeOrderId.slice(0, 20)}`,
    prefill: {
      name: safeName,
      email: safeEmail,
      contact: safePhone,
    },
    notes: {
      order_id: safeOrderId,
      source: "mobile_app",
      test_mode: RAZORPAY_TEST_MODE ? "true" : "false",
    },
    theme: {
      color: "#1D5A34",
    },
    retry: {
      enabled: true,
      max_count: 3,
    },
  };
};

// Validate Razorpay response (basic client-side validation)
// Note: For production, signature verification should happen on the server
export const validateRazorpayResponse = (response: RazorpayResponse): { isValid: boolean; error?: string } => {
  if (!response) {
    return { isValid: false, error: "No response received from payment gateway" };
  }

  if (!response.razorpay_payment_id) {
    return { isValid: false, error: "Payment ID not received" };
  }

  // Payment ID format check (basic validation)
  if (!response.razorpay_payment_id.startsWith("pay_")) {
    return { isValid: false, error: "Invalid payment ID format" };
  }

  // If order_id and signature are present, they should be valid format
  if (response.razorpay_order_id && !response.razorpay_order_id.startsWith("order_")) {
    return { isValid: false, error: "Invalid order ID format" };
  }

  return { isValid: true };
};

// Get user-friendly error message from Razorpay error
export const getRazorpayErrorMessage = (error: any): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error?.error?.description) {
    return error.error.description;
  }

  if (error?.error?.reason) {
    return error.error.reason;
  }

  if (error?.description) {
    return error.description;
  }

  if (error?.message) {
    return error.message;
  }

  // Common error codes
  const errorCodes: Record<string, string> = {
    BAD_REQUEST_ERROR: "Invalid payment details. Please check and try again.",
    GATEWAY_ERROR: "Payment gateway error. Please try again later.",
    SERVER_ERROR: "Server error. Please try again.",
    NETWORK_ERROR: "Network error. Please check your internet connection.",
    PAYMENT_CANCELLED: "Payment was cancelled.",
    PAYMENT_FAILED: "Payment failed. Please try again.",
  };

  if (error?.code && errorCodes[error.code]) {
    return errorCodes[error.code];
  }

  return "Payment failed. Please try again.";
};
