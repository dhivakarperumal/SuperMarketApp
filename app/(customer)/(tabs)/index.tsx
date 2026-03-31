import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Search,
  Bell,
  Heart,
  ShoppingCart,
  ChevronRight,
  X,
  ShoppingBag,
  Truck,
  Clock,
  Shield,
  Gift,
} from "lucide-react-native";
import { router } from "expo-router";
import { useProducts } from "../../../src/hooks/useProducts";
import { useCategories } from "../../../src/hooks/useCategories";
import { useCart } from "../../../src/context/CartContext";
import { useFavorites } from "../../../src/hooks/useFavorites";
import { useAuth } from "../../../src/context/AuthContext";
import { useOffline } from "../../../src/context/OfflineContext";
import { ProductCard } from "../../../src/components/cards/ProductCard";
import { OfflineBanner } from "../../../src/components/OfflineBanner";
import { formatCurrency } from "../../../src/utils/formatters";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_WIDTH = SCREEN_WIDTH - 32;

// Banners with emojis
const banners = [
  {
    id: 1,
    title: "Fresh Grocery",
    subtitle: "20% OFF on first order",
    emoji: "🛒",
    bgColors: ["#1D5A34", "#164829"],
  },
  {
    id: 2,
    title: "Weekend Sale",
    subtitle: "Up to 50% off on fruits",
    emoji: "🍎",
    bgColors: ["#FF6B6B", "#EE5A24"],
  },
  {
    id: 3,
    title: "Free Delivery",
    subtitle: "Orders above ₹500",
    emoji: "🚚",
    bgColors: ["#6C5CE7", "#A29BFE"],
  },
];

// Quick categories with colors
const quickCategories = [
  { id: "fruits", name: "Fruits", emoji: "🍎", color: "#FF6B6B", bgColor: "#FFE8E8" },
  { id: "vegetables", name: "Vegetables", emoji: "🥬", color: "#1D5A34", bgColor: "#E8F5E9" },
  { id: "dairy", name: "Dairy", emoji: "🥛", color: "#3B82F6", bgColor: "#E8F0FF" },
  { id: "bakery", name: "Bakery", emoji: "🍞", color: "#F59E0B", bgColor: "#FFF3E0" },
  { id: "meat", name: "Meat", emoji: "🍖", color: "#EF4444", bgColor: "#FEE2E2" },
  { id: "snacks", name: "Snacks", emoji: "🍿", color: "#8B5CF6", bgColor: "#F3E8FF" },
];

// Features
const features = [
  { icon: Truck, title: "Free Delivery", color: "#1D5A34" },
  { icon: Clock, title: "Fast Service", color: "#3B82F6" },
  { icon: Shield, title: "Secure Pay", color: "#8B5CF6" },
  { icon: Gift, title: "Daily Offers", color: "#F59E0B" },
];

export default function HomeScreen() {
  const { products, loading: productsLoading, refresh: refreshProducts, isOffline } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { cartCount } = useCart();
  const { favorites } = useFavorites();
  const { user, userProfile } = useAuth();
  const { isOnline, pendingCount } = useOffline();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);

  const favCount = favorites.length;
  const userName = user?.displayName || userProfile?.displayName || "Guest";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % banners.length;
        bannerScrollRef.current?.scrollTo({
          x: next * (BANNER_WIDTH + 12),
          animated: true,
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (BANNER_WIDTH + 12));
    setActiveBanner(index);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  };

  const searchResults = searchQuery.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
<SafeAreaView
  className="flex-1 bg-[#1D5A34]"
  edges={["top"]}
>
  <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />


      {/* Header */}
      <LinearGradient
        colors={["#1D5A34", "#164829"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
        {/* Top Row */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Image
              source={require("../../../assets/images/logo.png")}
              style={{ width: 44, height: 44 }}
              resizeMode="contain"
            />
            <View className="ml-3">
              <Text className="text-white/80 text-xs">{getGreeting()}</Text>
              <Text className="text-white font-bold text-lg" numberOfLines={1}>
                {userName.split(" ")[0]}
              </Text>
            </View>
          </View>

          {/* Icons */}
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.push("/(customer)/notifications")}
              className="relative p-2.5 bg-white/20 rounded-full mr-2"
            >
              <Bell size={20} color="#fff" />
            </Pressable>

            <Pressable
              onPress={() => router.push("/(customer)/(tabs)/favorites")}
              className="relative p-2.5 bg-white/20 rounded-full mr-2"
            >
              <Heart size={20} color="#fff" />
              {favCount > 0 && (
                <View
                  className="absolute -top-1 -right-1 bg-red-500 rounded-full items-center justify-center"
                  style={{ minWidth: 18, height: 18, paddingHorizontal: 4, borderWidth: 2, borderColor: "#fff" }}
                >
                  <Text className="text-white text-xs font-bold">{favCount > 99 ? "99+" : favCount}</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.push("/(customer)/(tabs)/cart")}
              className="relative p-2.5 bg-white/20 rounded-full"
            >
              <ShoppingCart size={20} color="#fff" />
              {cartCount > 0 && (
                <View
                  className="absolute -top-1 -right-1 bg-red-500 rounded-full items-center justify-center"
                  style={{ minWidth: 18, height: 18, paddingHorizontal: 4, borderWidth: 2, borderColor: "#fff" }}
                >
                  <Text className="text-white text-xs font-bold">{cartCount > 99 ? "99+" : cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-2xl px-4" style={{ height: 50 }}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for products..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-gray-800"
            style={{ fontSize: 15 }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <X size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </LinearGradient>

      {/* Offline Banner */}
      <OfflineBanner compact />

      <ScrollView
        className="bg-gray-50"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1D5A34"]} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {searchQuery.trim() ? (
          /* Search Results */
          <View className="px-4 pt-4">
            <Text className="text-gray-600 mb-3 font-medium">
              {searchResults.length} {searchResults.length === 1 ? "result" : "results"} found
            </Text>
            {searchResults.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {searchResults.map((product, index) => (
                  <View
                    key={product.id}
                    style={{
                      width: "50%",
                      paddingLeft: index % 2 === 0 ? 0 : 6,
                      paddingRight: index % 2 === 0 ? 6 : 0,
                      marginBottom: 12,
                      height: 260,
                    }}
                  >
                    <ProductCard
                      product={product}
                      onPress={() => router.push(`/(customer)/product/${product.id}`)}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center py-16">
                <View className="bg-gray-100 p-6 rounded-full mb-4">
                  <Search size={40} color="#9CA3AF" />
                </View>
                <Text className="text-gray-800 text-lg font-semibold">No products found</Text>
                <Text className="text-gray-500 text-sm mt-1">Try different keywords</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Banner Carousel */}
            <View className="pt-4 pb-2">
              <ScrollView
                ref={bannerScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleBannerScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToInterval={BANNER_WIDTH + 12}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                {banners.map((banner, index) => (
                  <Pressable
                    key={banner.id}
                    onPress={() => router.push("/(customer)/(tabs)/shop")}
                    style={{ width: BANNER_WIDTH, marginRight: index < banners.length - 1 ? 12 : 0 }}
                  >
                    <LinearGradient
                      colors={banner.bgColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        height: 150,
                        borderRadius: 20,
                        padding: 20,
                        flexDirection: "row",
                        alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      <View className="flex-1">
                        <Text className="text-white/90 text-sm font-medium">Limited Time</Text>
                        <Text className="text-white text-2xl font-bold mt-1">{banner.title}</Text>
                        <Text className="text-white/90 text-sm mt-1">{banner.subtitle}</Text>
                        <View className="bg-white px-4 py-2 rounded-full self-start mt-3">
                          <Text className="font-bold text-sm" style={{ color: banner.bgColors[0] }}>
                            Shop Now
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 70 }}>{banner.emoji}</Text>
                    </LinearGradient>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Dots */}
              <View className="flex-row justify-center mt-3">
                {banners.map((_, index) => (
                  <View
                    key={index}
                    className="mx-1 rounded-full"
                    style={{
                      width: activeBanner === index ? 24 : 8,
                      height: 8,
                      backgroundColor: activeBanner === index ? "#1D5A34" : "#D1D5DB",
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Features Strip */}
            <View className="flex-row justify-between px-4 py-4">
              {features.map((feature, index) => {
                const IconComp = feature.icon;
                return (
                  <View key={index} className="items-center">
                    <View
                      className="p-3 rounded-full mb-2"
                      style={{ backgroundColor: `${feature.color}15` }}
                    >
                      <IconComp size={20} color={feature.color} />
                    </View>
                    <Text className="text-gray-700 text-xs font-medium">{feature.title}</Text>
                  </View>
                );
              })}
            </View>

            {/* Quick Categories */}
            <View className="py-2">
              <View className="flex-row items-center justify-between px-4 mb-8">
                <Text className="text-lg font-bold text-gray-800">Categories</Text>
                <Pressable
                  onPress={() => router.push("/(customer)/(tabs)/shop")}
                  className="flex-row items-center"
                >
                  <Text className="text-primary font-semibold text-sm">See All</Text>
                  <ChevronRight size={16} color="#1D5A34" />
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                {(categories.length > 0 ? categories : quickCategories).map((cat: any, index) => (
                  <Pressable
                    key={cat.id || index}
                    onPress={() => router.push(`/(customer)/(tabs)/shop?category=${cat.id}`)}
                    className="items-center mr-4"
                    style={{ width: 70 }}
                  >
                    <View
                      className="w-14 h-14 rounded-2xl items-center justify-center mb-2 overflow-hidden"
                      style={{
                        backgroundColor: quickCategories[index % quickCategories.length]?.bgColor || "#F3F4F6",
                      }}
                    >
                      {cat.images?.[0] || cat.image ? (
                        <Image
                          source={{ uri: cat.images?.[0] || cat.image }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{ fontSize: 28 }}>
                          {quickCategories[index % quickCategories.length]?.emoji || "🛒"}
                        </Text>
                      )}
                    </View>
                    <Text
                      className="text-gray-700 text-xs font-medium text-center"
                      numberOfLines={1}
                    >
                      {cat.cname || cat.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Offer Banners */}
            <View className="px-4 pt-6 pb-3">
              {/* Offer 1 */}
              <Pressable onPress={() => router.push("/(customer)/(tabs)/shop")} className="mb-3">
                <LinearGradient
                  colors={["#FF9F43", "#FF6B6B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View className="flex-1">
                    <Text className="text-white text-xs font-semibold opacity-90">TODAY ONLY</Text>
                    <Text className="text-white text-lg font-bold">Get 30% Off</Text>
                    <Text className="text-white/80 text-xs">On all fresh vegetables</Text>
                  </View>
                  <Text style={{ fontSize: 40 }}>🥬</Text>
                </LinearGradient>
              </Pressable>

              {/* Offer 2 */}
              <Pressable onPress={() => router.push("/(customer)/(tabs)/shop")} className="mb-3">
                <LinearGradient
                  colors={["#6C5CE7", "#A29BFE"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View className="flex-1">
                    <Text className="text-white text-xs font-semibold opacity-90">WEEKEND SPECIAL</Text>
                    <Text className="text-white text-lg font-bold">Buy 1 Get 1 Free</Text>
                    <Text className="text-white/80 text-xs">On selected dairy products</Text>
                  </View>
                  <Text style={{ fontSize: 40 }}>🥛</Text>
                </LinearGradient>
              </Pressable>

              {/* Offer 3 */}
              <Pressable onPress={() => router.push("/(customer)/(tabs)/shop")}>
                <LinearGradient
                  colors={["#00B894", "#00CEC9"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View className="flex-1">
                    <Text className="text-white text-xs font-semibold opacity-90">FREE DELIVERY</Text>
                    <Text className="text-white text-lg font-bold">Orders Above ₹500</Text>
                    <Text className="text-white/80 text-xs">No minimum order for members</Text>
                  </View>
                  <Text style={{ fontSize: 40 }}>🚚</Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Popular Products */}
            <View className="py-3">
              <View className="flex-row items-center justify-between px-4 mb-8">
                <Text className="text-lg font-bold text-gray-800">Popular Products</Text>
                <Pressable
                  onPress={() => router.push("/(customer)/(tabs)/shop")}
                  className="flex-row items-center"
                >
                  <Text className="text-primary font-semibold text-sm">View All</Text>
                  <ChevronRight size={16} color="#1D5A34" />
                </Pressable>
              </View>

              {productsLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#1D5A34" />
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  {products.slice(0, 8).map((product) => {
                    const priceValues = product.prices ? Object.values(product.prices) : [];
                    const price = priceValues.length > 0 ? Number(priceValues[0]) || 0 : Number(product.price) || 0;
                    const image = product.images?.[0] || "";

                    return (
                      <Pressable
                        key={product.id}
                        onPress={() => router.push(`/(customer)/product/${product.id}`)}
                        className="bg-white rounded-2xl mr-3 overflow-hidden border border-gray-100"
                        style={{ width: 150 }}
                      >
                        <View className="h-28 bg-gray-100 items-center justify-center">
                          {image ? (
                            <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
                          ) : (
                            <ShoppingBag size={32} color="#D1D5DB" />
                          )}
                        </View>
                        <View className="p-3">
                          <Text className="text-gray-800 font-semibold text-sm" numberOfLines={1}>
                            {product.name}
                          </Text>
                          <View className="flex-row items-center justify-between mt-2">
                            <Text className="text-primary font-bold">{formatCurrency(price)}</Text>
                            <View className="bg-primary/10 p-1.5 rounded-lg">
                              <ShoppingCart size={14} color="#1D5A34" />
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* All Products Grid */}
            <View className="pt-3 pb-8">
              <View className="flex-row items-center justify-between px-4 mb-8">
                <Text className="text-lg font-bold text-gray-800">All Products</Text>
                <Pressable
                  onPress={() => router.push("/(customer)/(tabs)/shop")}
                  className="flex-row items-center"
                >
                  <Text className="text-primary font-semibold text-sm">View All</Text>
                  <ChevronRight size={16} color="#1D5A34" />
                </Pressable>
              </View>

              <View style={{ paddingHorizontal: 16 }}>
                {productsLoading ? (
                  <View className="items-center py-8">
                    <ActivityIndicator size="large" color="#1D5A34" />
                  </View>
                ) : products.length > 0 ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {products.slice(0, 6).map((product, index) => (
                      <View
                        key={product.id}
                        style={{
                          width: "50%",
                          paddingLeft: index % 2 === 0 ? 0 : 6,
                          paddingRight: index % 2 === 0 ? 6 : 0,
                          marginBottom: 12,
                          height: 260,
                        }}
                      >
                        <ProductCard
                          product={product}
                          onPress={() => router.push(`/(customer)/product/${product.id}`)}
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="items-center py-8">
                    <Text className="text-gray-400">No products available</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
