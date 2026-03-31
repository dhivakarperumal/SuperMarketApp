import { Stack } from "expo-router";

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="product/[id]" />
      <Stack.Screen name="orders/index" />
      <Stack.Screen name="orders/[id]" />
      <Stack.Screen name="orders/review" />
      <Stack.Screen name="addresses/index" />
      <Stack.Screen name="addresses/add" />
      <Stack.Screen name="addresses/edit" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/profile" />
      <Stack.Screen name="settings/password" />
      <Stack.Screen name="settings/about" />
      <Stack.Screen name="support/index" />
      <Stack.Screen name="support/contact" />
      <Stack.Screen name="policies/privacy" />
      <Stack.Screen name="policies/terms" />
      <Stack.Screen name="policies/refund" />
      <Stack.Screen name="policies/shipping" />
    </Stack>
  );
}
