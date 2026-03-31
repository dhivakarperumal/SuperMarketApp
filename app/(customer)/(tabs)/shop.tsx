import { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
  Switch,
  ScrollView,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FlashList } from "@shopify/flash-list";
import {
  Search,
  SlidersHorizontal,
  X,
  Grid3X3,
  List,
  ShoppingCart,
  Plus,
  Minus,
  Heart,
  ChevronLeft,
  ArrowUpDown,
  Check,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useProducts } from "../../../src/hooks/useProducts";
import { useCategories } from "../../../src/hooks/useCategories";
import { ProductCard } from "../../../src/components/cards/ProductCard";
import { useCart } from "../../../src/context/CartContext";
import { useFavorites } from "../../../src/hooks/useFavorites";
import { formatCurrency } from "../../../src/utils/formatters";
import Toast from "react-native-toast-message";

// Helper to get first valid product image (filter out barcodes)
const getFirstValidImage = (images: string[] | undefined): string => {
  if (!images || images.length === 0) return "";
  const validImage = images.find((img) => {
    if (img.startsWith("data:image/svg")) return false;
    if (img.length < 50) return false;
    return img.startsWith("http") || img.startsWith("data:image/jpeg") || img.startsWith("data:image/png");
  });
  return validImage || "";
};

type SortOption = "default" | "price_low" | "price_high" | "name_asc" | "name_desc";

const sortOptions = [
  { id: "default", label: "Default" },
  { id: "price_low", label: "Price: Low to High" },
  { id: "price_high", label: "Price: High to Low" },
  { id: "name_asc", label: "Name: A to Z" },
  { id: "name_desc", label: "Name: Z to A" },
];

export default function ShopScreen() {
  const { category: categoryParam, search: searchParam } = useLocalSearchParams<{ category?: string; search?: string }>();
  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const { addToCart, getItemQuantity, getCartItemId, updateQuantity } = useCart();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const [searchQuery, setSearchQuery] = useState(searchParam || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam || null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filter states
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Update search when param changes
  useEffect(() => {
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParam]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sortBy !== "default") count++;
    if (inStockOnly) count++;
    if (minPrice || maxPrice) count++;
    if (selectedCategory) count++;
    return count;
  }, [sortBy, inStockOnly, minPrice, maxPrice, selectedCategory]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.categoryId === selectedCategory || product.category === selectedCategory
      );
    }

    // Stock filter
    if (inStockOnly) {
      filtered = filtered.filter((product) => (product.stock || 0) > 0);
    }

    // Price filter
    if (minPrice || maxPrice) {
      filtered = filtered.filter((product) => {
        const priceValues = product.prices ? Object.values(product.prices) : [];
        const price = priceValues.length > 0 ? Number(priceValues[0]) || 0 : Number(product.price) || 0;
        const min = minPrice ? parseFloat(minPrice) : 0;
        const max = maxPrice ? parseFloat(maxPrice) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Sort
    if (sortBy !== "default") {
      filtered = [...filtered].sort((a, b) => {
        const priceA = a.prices ? Number(Object.values(a.prices)[0]) || 0 : Number(a.price) || 0;
        const priceB = b.prices ? Number(Object.values(b.prices)[0]) || 0 : Number(b.price) || 0;

        switch (sortBy) {
          case "price_low":
            return priceA - priceB;
          case "price_high":
            return priceB - priceA;
          case "name_asc":
            return a.name.localeCompare(b.name);
          case "name_desc":
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy, inStockOnly, minPrice, maxPrice]);

  const clearAllFilters = () => {
    setSortBy("default");
    setInStockOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setSelectedCategory(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#1D5A34]" edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />
      {/* Header */}
      <LinearGradient
        colors={["#1D5A34", "#164829"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </Pressable>
            <Text className="text-2xl font-bold text-white">Shop</Text>
          </View>
          <View className="flex-row items-center">
            {/* View Mode Toggle */}
            <Pressable
              onPress={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-2"
            >
              {viewMode === "grid" ? (
                <List size={20} color="#FFFFFF" />
              ) : (
                <Grid3X3 size={20} color="#FFFFFF" />
              )}
            </Pressable>
            {/* Filter Button */}
            <Pressable
              onPress={() => setShowFilters(true)}
              className="relative w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <SlidersHorizontal size={20} color="#FFFFFF" />
              {activeFilterCount > 0 && (
                <View
                  className="absolute -top-1 -right-1 bg-red-500 rounded-full items-center justify-center"
                  style={{ minWidth: 18, height: 18, paddingHorizontal: 4, borderWidth: 2, borderColor: "#FFFFFF" }}
                >
                  <Text className="text-white text-xs font-bold">{activeFilterCount}</Text>
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
            placeholder="Search products..."
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

      {/* Active Filters & Results Count */}
      {(searchQuery || activeFilterCount > 0) && (
        <View className="bg-white px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-600 text-sm">
              {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} found
            </Text>
            {activeFilterCount > 0 && (
              <Pressable onPress={clearAllFilters}>
                <Text className="text-primary text-sm font-medium">Clear filters</Text>
              </Pressable>
            )}
          </View>
          {/* Active Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {searchQuery && (
              <View className="flex-row items-center bg-blue-100 rounded-full px-3 py-1.5 mr-2">
                <Text className="text-blue-700 text-sm mr-1">"{searchQuery}"</Text>
                <Pressable onPress={() => setSearchQuery("")}>
                  <X size={14} color="#1D4ED8" />
                </Pressable>
              </View>
            )}
            {selectedCategory && (
              <View className="flex-row items-center bg-green-100 rounded-full px-3 py-1.5 mr-2">
                <Text className="text-green-700 text-sm mr-1">
                  {categories.find((c) => c.id === selectedCategory)?.cname || "Category"}
                </Text>
                <Pressable onPress={() => setSelectedCategory(null)}>
                  <X size={14} color="#15803D" />
                </Pressable>
              </View>
            )}
            {sortBy !== "default" && (
              <View className="flex-row items-center bg-purple-100 rounded-full px-3 py-1.5 mr-2">
                <Text className="text-purple-700 text-sm mr-1">
                  {sortOptions.find((s) => s.id === sortBy)?.label}
                </Text>
                <Pressable onPress={() => setSortBy("default")}>
                  <X size={14} color="#7E22CE" />
                </Pressable>
              </View>
            )}
            {(minPrice || maxPrice) && (
              <View className="flex-row items-center bg-orange-100 rounded-full px-3 py-1.5 mr-2">
                <Text className="text-orange-700 text-sm mr-1">
                  ₹{minPrice || "0"} - ₹{maxPrice || "∞"}
                </Text>
                <Pressable onPress={() => { setMinPrice(""); setMaxPrice(""); }}>
                  <X size={14} color="#C2410C" />
                </Pressable>
              </View>
            )}
            {inStockOnly && (
              <View className="flex-row items-center bg-teal-100 rounded-full px-3 py-1.5 mr-2">
                <Text className="text-teal-700 text-sm mr-1">In Stock</Text>
                <Pressable onPress={() => setInStockOnly(false)}>
                  <X size={14} color="#0F766E" />
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Categories Filter */}
      {showCategoryFilter && (
        <View className="bg-white py-3 border-b border-gray-100">
          <FlashList
            data={[{ id: null, name: "All" }, ...categories]}
            horizontal
            showsHorizontalScrollIndicator={false}
            estimatedItemSize={80}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedCategory(item.id)}
                className={`px-4 py-2 mr-2 rounded-full ${
                  selectedCategory === item.id
                    ? "bg-primary"
                    : "bg-gray-100"
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedCategory === item.id ? "text-white" : "text-gray-600"
                  }`}
                >
                  {item.cname || item.name}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* Products */}
      {loading ? (
        <View className="flex-1 items-center justify-center bg-gray-50">
          <ActivityIndicator size="large" color="#1D5A34" />
        </View>
      ) : viewMode === "grid" ? (
        <FlashList
          data={filteredProducts}
          numColumns={2}
          estimatedItemSize={280}
          className="bg-gray-50"
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item, index }) => (
            <View
              style={{
                flex: 1,
                marginLeft: index % 2 === 0 ? 0 : 6,
                marginRight: index % 2 === 0 ? 6 : 0,
                height: 260,
              }}
            >
              <ProductCard
                product={item}
                onPress={() => router.push(`/(customer)/product/${item.id}`)}
              />
            </View>
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-500 text-lg">No products found</Text>
            </View>
          }
        />
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingVertical: 8 }}>
          {filteredProducts.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-500 text-lg">No products found</Text>
            </View>
          ) : (
            filteredProducts.map((item, index) => {
              const quantity = getItemQuantity(item.id);
              const cartItemId = getCartItemId(item.id);
              const defaultWeight = item.weights?.[0] || "";
              const priceValues = item.prices ? Object.values(item.prices) : [];
              const price = priceValues.length > 0
                ? Number(priceValues[0]) || 0
                : Number(item.price) || 0;
              const image = getFirstValidImage(item.images);
              const favorite = isFavorite(item.id);

              const handleFavorite = async () => {
                if (favorite) {
                  await removeFromFavorites(item.id);
                  Toast.show({ type: "info", text1: "Removed from Favorites" });
                } else {
                  await addToFavorites({
                    productId: item.id,
                    name: item.name,
                    price: price,
                    image: image,
                    selectedWeight: defaultWeight !== "default" ? defaultWeight : undefined,
                  });
                  Toast.show({ type: "success", text1: "Added to Favorites" });
                }
              };

              return (
                <Pressable
                  key={`${item.id}-${index}`}
                  onPress={() => router.push(`/(customer)/product/${item.id}`)}
                  className="flex-row items-center bg-white mx-3 mb-2 p-3 rounded-xl border border-gray-100"
                >
                  {/* Product Image */}
                  <View className="relative">
                    <Image
                      source={{ uri: image }}
                      className="w-16 h-16 rounded-lg bg-gray-100"
                      resizeMode="cover"
                    />
                  </View>

                  {/* Product Info */}
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-800 font-semibold" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-gray-500 text-sm" numberOfLines={1}>
                      {defaultWeight !== "default" ? defaultWeight : item.stockUnit}
                    </Text>
                    <Text className="text-primary font-bold mt-1">
                      {formatCurrency(price)}
                    </Text>
                  </View>

                  {/* Favorite Button */}
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleFavorite();
                    }}
                    className="p-2 mr-2"
                  >
                    <Heart
                      size={20}
                      color={favorite ? "#EF4444" : "#9CA3AF"}
                      fill={favorite ? "#EF4444" : "transparent"}
                    />
                  </Pressable>

                  {/* Cart Controls */}
                  <View className="items-center">
                    {quantity > 0 && cartItemId ? (
                      <View className="flex-row items-center bg-gray-100 rounded-lg">
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            updateQuantity(cartItemId, quantity - 1);
                          }}
                          className="p-2"
                        >
                          <Minus size={16} color="#1D5A34" />
                        </Pressable>
                        <Text className="px-3 font-semibold text-gray-800">{quantity}</Text>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            updateQuantity(cartItemId, quantity + 1);
                          }}
                          className="p-2"
                        >
                          <Plus size={16} color="#1D5A34" />
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          addToCart({
                            productId: item.id,
                            name: item.name,
                            price: price,
                            quantity: 1,
                            selectedWeight: defaultWeight || undefined,
                            image: image,
                            weights: item.weights || [],
                            prices: item.prices || {},
                          });
                        }}
                        className="bg-primary p-2 rounded-lg"
                      >
                        <ShoppingCart size={20} color="#fff" />
                      </Pressable>
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Filter Bottom Sheet */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setShowFilters(false)}
        >
          <Pressable
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
            style={{ maxHeight: "85%" }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View className="items-center py-3">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-800">Filters & Sort</Text>
              <View className="flex-row items-center">
                {activeFilterCount > 0 && (
                  <Pressable onPress={clearAllFilters} className="mr-4">
                    <Text className="text-primary font-semibold">Clear All</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setShowFilters(false)}>
                  <X size={24} color="#6B7280" />
                </Pressable>
              </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {/* Sort By */}
              <View className="p-5 border-b border-gray-100">
                <View className="flex-row items-center mb-3">
                  <ArrowUpDown size={18} color="#374151" />
                  <Text className="text-gray-800 font-semibold text-base ml-2">Sort By</Text>
                </View>
                <View className="flex-row flex-wrap">
                  {sortOptions.map((option) => (
                    <Pressable
                      key={option.id}
                      onPress={() => setSortBy(option.id as SortOption)}
                      className={`px-4 py-2.5 rounded-full mr-2 mb-2 ${
                        sortBy === option.id ? "bg-primary" : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          sortBy === option.id ? "text-white" : "text-gray-600"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Category Filter */}
              <View className="p-5 border-b border-gray-100">
                <Text className="text-gray-800 font-semibold text-base mb-3">Category</Text>
                <View className="flex-row flex-wrap">
                  <Pressable
                    onPress={() => setSelectedCategory(null)}
                    className={`px-4 py-2.5 rounded-full mr-2 mb-2 ${
                      selectedCategory === null ? "bg-primary" : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        selectedCategory === null ? "text-white" : "text-gray-600"
                      }`}
                    >
                      All
                    </Text>
                  </Pressable>
                  {categories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2.5 rounded-full mr-2 mb-2 ${
                        selectedCategory === cat.id ? "bg-primary" : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          selectedCategory === cat.id ? "text-white" : "text-gray-600"
                        }`}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Price Range */}
              <View className="p-5 border-b border-gray-100">
                <Text className="text-gray-800 font-semibold text-base mb-3">Price Range</Text>
                <View className="flex-row items-center">
                  <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                    <Text className="text-gray-500 mr-1">₹</Text>
                    <TextInput
                      value={minPrice}
                      onChangeText={(text) => setMinPrice(text.replace(/[^0-9]/g, ""))}
                      placeholder="Min"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      className="flex-1 text-gray-800"
                      style={{ fontSize: 15 }}
                    />
                  </View>
                  <Text className="mx-3 text-gray-400">to</Text>
                  <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                    <Text className="text-gray-500 mr-1">₹</Text>
                    <TextInput
                      value={maxPrice}
                      onChangeText={(text) => setMaxPrice(text.replace(/[^0-9]/g, ""))}
                      placeholder="Max"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      className="flex-1 text-gray-800"
                      style={{ fontSize: 15 }}
                    />
                  </View>
                </View>
              </View>

              {/* Stock Filter */}
              <View className="p-5 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-gray-800 font-semibold text-base">In Stock Only</Text>
                    <Text className="text-gray-500 text-sm mt-1">Hide out of stock items</Text>
                  </View>
                  <Switch
                    value={inStockOnly}
                    onValueChange={setInStockOnly}
                    trackColor={{ false: "#E5E7EB", true: "#1D5A34" }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              {/* Category Filter Bar Toggle */}
              <View className="p-5">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-gray-800 font-semibold text-base">Category Bar</Text>
                    <Text className="text-gray-500 text-sm mt-1">Show category filter below search</Text>
                  </View>
                  <Switch
                    value={showCategoryFilter}
                    onValueChange={setShowCategoryFilter}
                    trackColor={{ false: "#E5E7EB", true: "#1D5A34" }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            </ScrollView>

            {/* Apply Button */}
            <View className="p-5 border-t border-gray-100">
              <Pressable
                onPress={() => setShowFilters(false)}
                className="bg-primary py-4 rounded-xl"
              >
                <Text className="text-white text-center font-bold text-base">
                  Show {filteredProducts.length} Products
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
