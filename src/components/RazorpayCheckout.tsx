import { AlertTriangle, RefreshCw, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Linking,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { WebView } from "react-native-webview";
import {
    getRazorpayErrorMessage,
    RAZORPAY_KEY_ID,
    RAZORPAY_TEST_MODE,
    RazorpayOptions,
    RazorpayResponse,
    validateRazorpayResponse,
} from "../services/razorpay/config";

const { width, height } = Dimensions.get("window");

interface RazorpayCheckoutProps {
  visible: boolean;
  options: RazorpayOptions;
  onSuccess: (response: RazorpayResponse) => void;
  onFailure: (error: string) => void;
  onClose: () => void;
}

export function RazorpayCheckout({
  visible,
  options,
  onSuccess,
  onFailure,
  onClose,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      console.log("[RazorpayCheckout] Modal opened, preparing payment gateway");
      setLoading(true);
      setError(null);
      setKey((prev) => prev + 1);
      setRetryCount(0);
    }
  }, [visible]);

  // Timeout detection for payment initialization
  useEffect(() => {
    if (!visible || !loading) return;

    const timeoutHandle = setTimeout(() => {
      console.warn("[RazorpayCheckout] Payment initialization timeout (30s)");
      setError(
        "Payment gateway is taking longer than expected. Please check your internet connection and try again."
      );
      setLoading(false);
    }, 30000); // 30 second timeout

    return () => clearTimeout(timeoutHandle);
  }, [visible, loading]);

  const handleRetry = () => {
    const newRetryCount = retryCount + 1;
    if (newRetryCount > 3) {
      setError(
        "Payment gateway initialization failed after multiple attempts. Please try again later or contact support."
      );
      console.error(
        "[RazorpayCheckout] Retry limit exceeded. Key:",
        RAZORPAY_KEY_ID.substring(0, 15) + "..."
      );
      return;
    }

    console.log(
      `[RazorpayCheckout] Retrying payment (attempt ${newRetryCount + 1}/4). Key: ${RAZORPAY_KEY_ID.substring(0, 15)}...`
    );
    setRetryCount(newRetryCount);
    setError(null);
    setLoading(true);
    setKey((prev) => prev + 1);
  };

  // Generate the Razorpay HTML
  const getHTML = () => {
    // Pass all config as JSON to avoid escaping issues
    const config = {
      key: options.key || RAZORPAY_KEY_ID,
      amount: Math.round(Number(options.amount) || 100),
      currency: "INR",
      name: options.name || "Order",
      description: options.description || "Payment",
      prefill: {
        name: options.prefill?.name || "",
        email: options.prefill?.email || "",
        contact: options.prefill?.contact || "",
      },
    };

    const configJson = JSON.stringify(config);

    console.log("[RazorpayCheckout] Generating HTML");
    console.log("[RazorpayCheckout] Config:", config);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>Razorpay Payment</title>
<style>
html,body{width:100%;height:100%;margin:0;padding:0;background:#f5f5f5}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
.container{background:white;border-radius:12px;padding:40px 20px;max-width:400px;width:100%;box-shadow:0 4px 12px rgba(0,0,0,0.15);text-align:center}
.loader{display:flex;flex-direction:column;align-items:center;gap:16px}
.spinner{width:50px;height:50px;border:4px solid rgba(46,125,50,0.1);border-top:4px solid #1D5C45;border-radius:50%;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.text{color:#333;font-size:16px;line-height:1.4;margin:0}
.sub{color:#999;font-size:14px}
.error{color:#DC2626;font-size:15px;font-weight:600;margin-bottom:8px}
.debug{font-size:12px;color:#666;background:#f9fafb;padding:8px 12px;border-radius:6px;margin-top:12px;font-family:monospace;word-break:break-all;text-align:left}
.button{display:inline-block;background:#1D5C45;color:white;border:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-top:16px;transition:background 0.2s;font-family:inherit}
.button:active{background:#16482F;opacity:0.9}
#error-box{display:none}
#loader{display:flex}
</style>
</head>
<body>
<div class="container">
  <div id="loader" class="loader">
    <div class="spinner"></div>
    <p class="text">Loading Payment</p>
    <p class="sub">Please wait...</p>
  </div>
  <div id="error-box">
    <p class="error">Payment Setup Failed</p>
    <p id="error-msg" class="text"></p>
    <button class="button" onclick="retryAction()">Try Again</button>
    <div id="debug-info" class="debug"></div>
  </div>
</div>

<script>
var CONFIG_JSON = '${configJson.replace(/'/g, "\\'")}';
var config = JSON.parse(CONFIG_JSON);
var attemptCount = 0;
var maxAttempts = 3;
var paymentProcessed = false;

function log(msg) {
  console.log('[RZP]', msg);
}

function postMsg(type, data) {
  try {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      var message = JSON.stringify({ type: type, data: data || {} });
      log('Posting message: ' + message);
      window.ReactNativeWebView.postMessage(message);
    } else {
      log('ReactNativeWebView not available');
    }
  } catch (e) {
    console.error('postMsg error:', e);
    log('postMsg error: ' + e.message);
  }
}

function showErr(msg, code) {
  log('Error: ' + msg + ' (' + code + ')');
  document.getElementById('loader').style.display = 'none';
  document.getElementById('error-box').style.display = 'block';
  document.getElementById('error-msg').textContent = msg;
  document.getElementById('debug-info').textContent = 'Code: ' + code;
  postMsg('error', { message: msg, code: code });
}

var razorpayLoadAttempts = 0;
var RAZORPAY_LOAD_MAX_ATTEMPTS = 50; // 50 * 200ms = 10 seconds

function retry() {
  attemptCount++;
  razorpayLoadAttempts = 0;
  paymentProcessed = false;
  if (attemptCount >= maxAttempts) {
    showErr('Too many attempts', 'MAX_RETRIES');
    return;
  }
  document.getElementById('loader').style.display = 'flex';
  document.getElementById('error-box').style.display = 'none';
  openPayment();
}

function openPayment() {
  log('Attempt ' + (attemptCount + 1) + '/' + maxAttempts + ', Razorpay load attempt ' + (razorpayLoadAttempts + 1) + '/' + RAZORPAY_LOAD_MAX_ATTEMPTS);
  
  if (typeof window.Razorpay === 'undefined') {
    razorpayLoadAttempts++;
    if (razorpayLoadAttempts >= RAZORPAY_LOAD_MAX_ATTEMPTS) {
      showErr('Unable to load Razorpay SDK. Check internet connection and try again.', 'RZP_LOAD_TIMEOUT');
      return;
    }
    log('Waiting for Razorpay...');
    setTimeout(openPayment, 200);
    return;
  }

  log('Razorpay ready');

  try {
    log('Creating payment with: key=' + config.key.substring(0, 10) + '... amount=' + config.amount);
    
    var rzp = new window.Razorpay({
      key: config.key,
      amount: config.amount,
      currency: config.currency,
      name: config.name,
      description: config.description,
      prefill: config.prefill,
      theme: { color: '#1D5C45' },
      handler: function(response) {
        if (paymentProcessed) {
          log('Payment already processed, ignoring duplicate handler call');
          return;
        }
        paymentProcessed = true;
        log('Payment success: ' + response.razorpay_payment_id);
        log('Full response: ' + JSON.stringify(response));
        postMsg('success', {
          razorpay_payment_id: response.razorpay_payment_id || '',
          razorpay_order_id: response.razorpay_order_id || '',
          razorpay_signature: response.razorpay_signature || ''
        });
      },
      modal: {
        escape: false,
        backdropclose: false,
        ondismiss: function() {
          if (paymentProcessed) return;
          log('Payment dismissed by user');
          postMsg('dismiss', {});
        }
      }
    });

    rzp.on('payment.failed', function(response) {
      if (paymentProcessed) {
        log('Payment already processed, ignoring duplicate failure handler');
        return;
      }
      paymentProcessed = true;
      var msg = response.error ? response.error.description : 'Payment failed';
      var code = response.error ? response.error.code : 'UNKNOWN';
      log('Payment failed: ' + msg + ' (' + code + ')');
      log('Full error response: ' + JSON.stringify(response));
      postMsg('failure', { message: msg, code: code, fullError: response.error });
    });

    log('Opening modal');
    document.getElementById('loader').style.display = 'none';
    rzp.open();

  } catch (e) {
    log('Exception: ' + e.message);
    log('Stack: ' + (e.stack || 'No stack trace'));
    showErr(e.message, 'EXCEPTION');
  }
}

window.retryAction = retry;

log('Init');
log('Config: ' + JSON.stringify({ key: config.key.substring(0, 15) + '...', amount: config.amount, currency: config.currency }));
postMsg('log', { message: 'Page initialized, waiting for Razorpay SDK' });
setTimeout(openPayment, 500);
</script>

<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</body>
</html>`;
  };

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      const { type, data } = message;

      console.log("[RazorpayCheckout] WebView message:", type, JSON.stringify(data));

      switch (type) {
        case "success":
          console.log("[RazorpayCheckout] ✅ Payment success:", data.razorpay_payment_id);
          const response = data as RazorpayResponse;
          const validation = validateRazorpayResponse(response);
          if (validation.isValid) {
            console.log("[RazorpayCheckout] Response validation passed, calling onSuccess");
            onSuccess(response);
          } else {
            console.error("[RazorpayCheckout] Invalid response:", validation.error);
            console.error("[RazorpayCheckout] Response data:", response);
            onFailure(validation.error || "Invalid payment response");
          }
          break;

        case "failure":
          const errorMsg =
            typeof data === "string" ? data : getRazorpayErrorMessage(data);
          const isCancelled = isRazorpayCancelledError(data) || isRazorpayCancelledError(errorMsg);

          if (isCancelled) {
            console.log("[RazorpayCheckout] ⏸️ Payment cancelled:", errorMsg);
            onClose();
          } else {
            console.error("[RazorpayCheckout] ❌ Payment failure:", data);
            console.error("[RazorpayCheckout] Error message:", errorMsg);
            onFailure(errorMsg);
          }
          break;

        case "dismiss":
          console.log("[RazorpayCheckout] User dismissed payment modal");
          onClose();
          break;

        case "error":
          console.error("[RazorpayCheckout] ⚠️ WebView Error:", data);
          const detailedError = data?.message 
            ? `${data.message}${data.code ? ` (${data.code})` : ''}`
            : "Something went wrong";
          setError(detailedError);
          setLoading(false);
          break;

        case "log":
          console.log("[RazorpayCheckout] WebView Log:", data?.message);
          break;

        default:
          console.warn("[RazorpayCheckout] Unknown message type:", type);
      }
    } catch (e) {
      console.error("[RazorpayCheckout] Error parsing message:", e);
      console.error("[RazorpayCheckout] Raw event data:", event.nativeEvent.data);
      onFailure("Failed to process payment response. Please try again.");
    }
  };

  const handleLoadEnd = () => {
    console.log("[RazorpayCheckout] WebView load completed");
    setLoading(false);
  };

  const handleWebViewError = (event: any) => {
    const { nativeEvent } = event;
    console.warn("[RazorpayCheckout] WebView error:", nativeEvent);

    // Only show errors for critical failures
    if (
      nativeEvent.description?.includes("net::ERR") ||
      nativeEvent.description?.includes("ERR_")
    ) {
      setError(
        "Network error. Please check your internet connection and try again."
      );
      setLoading(false);
    }
  };

  const handleHttpError = (event: any) => {
    const { nativeEvent } = event;
    console.warn("[RazorpayCheckout] HTTP error:", nativeEvent.statusCode);

    if (nativeEvent.statusCode >= 500) {
      setError("Server error. Please try again later.");
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Payment</Text>
            {RAZORPAY_TEST_MODE && (
              <View style={styles.testBadge}>
                <Text style={styles.testBadgeText}>TEST</Text>
              </View>
            )}
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Test Mode Banner */}
        {RAZORPAY_TEST_MODE && (
          <View style={styles.testBanner}>
            <AlertTriangle size={14} color="#92400E" />
            <Text style={styles.testBannerText}>
              Test Mode: Card 4111 1111 1111 1111 | Expiry: Any future | CVV: Any
            </Text>
          </View>
        )}

        {/* Error View */}
        {error ? (
          <View style={styles.errorContainer}>
            <AlertTriangle size={56} color="#EF4444" />
            <Text style={styles.errorTitle}>Payment Error</Text>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.errorButtons}>
              <Pressable onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleRetry} style={styles.retryBtn}>
                <RefreshCw size={18} color="#fff" />
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* WebView */
          <WebView
            key={key}
            source={{ html: getHTML(), baseUrl: "https://razorpay.com" }}
            style={styles.webview}
            onMessage={handleMessage}
            onLoadEnd={handleLoadEnd}
            onLoadStart={() => {
              console.log("[RazorpayCheckout] WebView load started");
            }}
            onError={handleWebViewError}
            onHttpError={handleHttpError}
            onShouldStartLoadWithRequest={(request) => {
              const { url } = request;

              // Allow the Razorpay plugin and our local generated page
              if (url.startsWith("data:") || url.startsWith("https://checkout.razorpay.com") || url.startsWith("https://razorpay.com")) {
                return true;
              }

              // External redirects should open in default browser
              if (url.startsWith("http://") || url.startsWith("https://")) {
                Linking.openURL(url).catch((err) => {
                  console.warn("[RazorpayCheckout] Failed to open external URL", err);
                });
                return false;
              }
              return true;
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={["*"]}
            mixedContentMode="always"
            startInLoadingState={false}
            cacheEnabled={false}
            thirdPartyCookiesEnabled={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            javaScriptCanOpenWindowsAutomatically={true}
            setSupportMultipleWindows={true}
            androidLayerType="hardware"
            scalesPageToFit={true}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            bounces={false}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36"
          />
        )}

        {/* Loading Overlay */}
        {loading && !error && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#1D5C45" />
            <Text style={styles.loadingText}>Preparing payment...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: "#1D5C45",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  testBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 10,
  },
  testBadgeText: {
    color: "#92400E",
    fontSize: 10,
    fontWeight: "600",
  },
  closeBtn: {
    width: 38,
    height: 38,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  testBanner: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  testBannerText: {
    color: "#92400E",
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 20,
  },
  errorText: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
  errorButtons: {
    flexDirection: "row",
    marginTop: 28,
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
  },
  cancelBtnText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 15,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: "#1D5C45",
    borderRadius: 12,
    gap: 8,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
