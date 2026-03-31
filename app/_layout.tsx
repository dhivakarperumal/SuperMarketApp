import { useEffect } from "react";
import { LogBox } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { toastConfig } from "../src/components/CustomToast";
import { AuthProvider } from "../src/context/AuthContext";
import { PermissionProvider } from "../src/context/PermissionContext";
import { SubscriptionProvider } from "../src/context/SubscriptionContext";
import { BranchProvider } from "../src/context/BranchContext";
import { CartProvider } from "../src/context/CartContext";
import { OfferProvider } from "../src/context/OfferContext";
import { PrinterProvider } from "../src/context/PrinterContext";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { OfflineProvider } from "../src/context/OfflineContext";
import { DeliveryConfigProvider } from "../src/context/DeliveryConfigContext";
import { WhatsAppProvider } from "../src/context/WhatsAppContext";
import "./global.css";

// Suppress known warnings from third-party libraries
LogBox.ignoreLogs([
  "SafeAreaView has been deprecated",
  "Unable to activate keep awake",
]);

function AppContent() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar
        style={colors?.statusBar || "dark"}
        backgroundColor={colors?.background || "#FFFFFF"}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="(admin)" />
      </Stack>
      <Toast config={toastConfig} position="top" topOffset={60} visibilityTime={3000} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <OfflineProvider>
            <AuthProvider>
              <PermissionProvider>
                <SubscriptionProvider>
                  <BranchProvider>
                    <DeliveryConfigProvider>
                      <CartProvider>
                        <OfferProvider>
                          <PrinterProvider>
                            <WhatsAppProvider>
                              <BottomSheetModalProvider>
                                <AppContent />
                              </BottomSheetModalProvider>
                            </WhatsAppProvider>
                          </PrinterProvider>
                        </OfferProvider>
                      </CartProvider>
                    </DeliveryConfigProvider>
                  </BranchProvider>
                </SubscriptionProvider>
              </PermissionProvider>
            </AuthProvider>
          </OfflineProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
