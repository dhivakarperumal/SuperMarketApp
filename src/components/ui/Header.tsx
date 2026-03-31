import { View, Text, Pressable } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { router, usePathname } from "expo-router";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export function Header({ title, showBack = true, rightElement }: HeaderProps) {
  const pathname = usePathname();

  // Don't show back on main tab screens
  const isMainTab = [
    "/index", "/shop", "/cart", "/favorites", "/account",
    "/dashboard", "/orders", "/products", "/billing", "/settings"
  ].some(tab => pathname.endsWith(tab));

  const canGoBack = showBack && !isMainTab && router.canGoBack();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "#F3F4F6",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        {canGoBack && (
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
        )}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: "#1F2937",
          }}
        >
          {title}
        </Text>
      </View>
      {rightElement && <View>{rightElement}</View>}
    </View>
  );
}
