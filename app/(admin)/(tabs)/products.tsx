import { useState, useMemo } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator, Image, ScrollView, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { Search, Plus, Package, Edit, Trash2, FolderPlus, X, Printer } from "lucide-react-native";
import { router } from "expo-router";
import * as Print from "expo-print";
import { useProducts } from "../../../src/hooks/useProducts";
import { useCategories } from "../../../src/hooks/useCategories";
import { formatCurrency } from "../../../src/utils/formatters";
import { generateBarcodeSVGForPrint } from "../../../src/utils/barcode";
import Toast from "react-native-toast-message";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const { products, loading, deleteProduct } = useProducts();
  const { categories } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [fabOpen, setFabOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; id: string; name: string }>({
    visible: false,
    id: "",
    name: "",
  });

  // Print all product barcodes on A4 sheet
  const printAllBarcodes = async () => {
    if (filteredProducts.length === 0) {
      Toast.show({
        type: "error",
        text1: "No Products",
        text2: "No products to print barcodes for",
      });
      return;
    }

    setPrinting(true);
    try {
      // Generate barcode labels HTML (3 columns x multiple rows on A4)
      const barcodeLabels = filteredProducts.map((product) => {
        const barcodeValue = product.productId || product.barcode || product.id.slice(0, 8);
        const price = product.prices
          ? Object.values(product.prices)[0]
          : product.price || 0;

        // Generate inline SVG barcode
        const barcodeSVG = generateBarcodeSVGForPrint(barcodeValue);

        return `
          <div class="label">
            <div class="product-name">${product.name.substring(0, 25)}</div>
            <div class="barcode-container">${barcodeSVG}</div>
            <div class="barcode-text">${barcodeValue}</div>
            <div class="price">₹${price}</div>
          </div>
        `;
      }).join("");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Product Barcodes</title>
          <style>
            @page {
              size: A4;
              margin: 8mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .container {
              display: flex;
              flex-wrap: wrap;
              justify-content: flex-start;
            }
            .label {
              width: 62mm;
              height: 36mm;
              border: 1px dashed #ccc;
              padding: 2mm;
              margin: 0.5mm;
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              page-break-inside: avoid;
              box-sizing: border-box;
            }
            .product-name {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 2mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              max-width: 100%;
            }
            .barcode-container {
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .barcode-container svg {
              max-width: 55mm;
              height: auto;
            }
            .barcode-text {
              font-size: 11px;
              font-family: monospace;
              font-weight: bold;
              margin-top: 1mm;
              letter-spacing: 1px;
            }
            .price {
              font-size: 13px;
              font-weight: bold;
              margin-top: 1mm;
              color: #000;
            }
            .header {
              text-align: center;
              margin-bottom: 3mm;
              padding-bottom: 2mm;
              border-bottom: 1px solid #333;
            }
            .header h1 {
              margin: 0;
              font-size: 14px;
            }
            .header p {
              margin: 1mm 0 0 0;
              font-size: 9px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Product Barcodes - Dhiva Deva Super Markets</h1>
            <p>Total: ${filteredProducts.length} products | Date: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="container">
            ${barcodeLabels}
          </div>
        </body>
        </html>
      `;

      await Print.printAsync({ html });

      Toast.show({
        type: "success",
        text1: "Print Ready",
        text2: `${filteredProducts.length} barcode labels`,
      });
    } catch (error) {
      console.error("Print error:", error);
      Toast.show({
        type: "error",
        text1: "Print Failed",
        text2: "Failed to print barcodes",
      });
    } finally {
      setPrinting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) =>
        product.categoryId === selectedCategory || product.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [products, searchQuery, selectedCategory]);

  const handleDelete = (id: string, name: string) => {
    setDeleteModal({ visible: true, id, name });
  };

  const confirmDelete = async () => {
    try {
      await deleteProduct(deleteModal.id);
      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: `${deleteModal.name} has been deleted`,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete product",
      });
    }
    setDeleteModal({ visible: false, id: "", name: "" });
  };

  const getStockStatus = (product: any) => {
    const stock = product.stock || 0;
    const unit = product.stockUnit || "pcs";

    if (unit === "g" || unit === "ml") {
      if (stock < 2000) return { label: "Low", color: "bg-red-100 text-red-700" };
      if (stock < 5000) return { label: "Medium", color: "bg-yellow-100 text-yellow-700" };
      return { label: "In Stock", color: "bg-green-100 text-green-700" };
    }

    if (stock < 3) return { label: "Low", color: "bg-red-100 text-red-700" };
    if (stock < 10) return { label: "Medium", color: "bg-yellow-100 text-yellow-700" };
    return { label: "In Stock", color: "bg-green-100 text-green-700" };
  };

  const formatStock = (product: any) => {
    const stock = product.stock || 0;
    const unit = product.stockUnit || "pcs";

    if (unit === "g" && stock >= 1000) return `${(stock / 1000).toFixed(1)} kg`;
    if (unit === "ml" && stock >= 1000) return `${(stock / 1000).toFixed(1)} L`;
    return `${stock} ${unit}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />
      {/* Header */}
      <LinearGradient
        colors={["#1D5A34", "#164829"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-white">Products</Text>
          <View className="flex-row items-center">
            <Text className="text-white/80 mr-3">{filteredProducts.length} items</Text>
            <Pressable
              onPress={printAllBarcodes}
              disabled={printing}
              className="p-2 bg-white/20 rounded-lg border border-white/30"
            >
              {printing ? (
                <ActivityIndicator size={20} color="#FFFFFF" />
              ) : (
                <Printer size={20} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-gray-800"
          />
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {/* All Button */}
          <Pressable
            onPress={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-xl mr-2 ${
              selectedCategory === "all"
                ? "bg-white"
                : "bg-white/20 border border-white/30"
            }`}
          >
            <Text
              className={`font-medium ${
                selectedCategory === "all" ? "text-primary font-bold" : "text-white"
              }`}
            >
              All
            </Text>
          </Pressable>

          {/* Category Buttons */}
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl mr-2 ${
                selectedCategory === cat.id
                  ? "bg-white"
                  : "bg-white/20 border border-white/30"
              }`}
            >
              <Text
                className={`font-medium ${
                  selectedCategory === cat.id ? "text-primary font-bold" : "text-white"
                }`}
              >
                {cat.cname}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Products List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D5A34" />
        </View>
      ) : (
        <FlashList
          data={filteredProducts}
          estimatedItemSize={100}
          contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
          renderItem={({ item }) => {
            const stockStatus = getStockStatus(item);
            const firstPrice = item.prices
              ? Object.values(item.prices)[0]
              : item.price || 0;

            return (
              <View className="bg-white p-4 rounded-xl mb-3">
                <View className="flex-row">
                  {/* Product Image */}
                  <View className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                    {item.images?.[0] ? (
                      <Image
                        source={{ uri: item.images[0] }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Package size={24} color="#9CA3AF" />
                      </View>
                    )}
                  </View>

                  {/* Product Details */}
                  <View className="flex-1 ml-4">
                    <Text className="font-semibold text-gray-800" numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      {item.category}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <Text className="font-bold text-primary">
                        {formatCurrency(firstPrice as number)}
                      </Text>
                      <View className={`ml-2 px-2 py-1 rounded ${stockStatus.color}`}>
                        <Text className="text-xs font-medium">
                          {formatStock(item)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="justify-between">
                    <Pressable
                      onPress={() => router.push(`/(admin)/products/edit/${item.id}`)}
                      className="p-2 bg-blue-50 rounded-lg"
                    >
                      <Edit size={18} color="#3B82F6" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(item.id, item.name)}
                      className="p-2 bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Package size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg mt-4">No products found</Text>
            </View>
          }
        />
      )}

      {/* FAB Menu Overlay */}
      {fabOpen && (
        <Pressable
          onPress={() => setFabOpen(false)}
          className="absolute inset-0 bg-black/30"
        />
      )}

      {/* FAB Options */}
      {fabOpen && (
        <View
          className="absolute right-4"
          style={{ bottom: 90 }}
        >
          {/* Add Category Option */}
          <Pressable
            onPress={() => {
              setFabOpen(false);
              router.push("/(admin)/categories/add");
            }}
            className="flex-row items-center mb-3"
          >
            <View className="bg-white px-3 py-2 rounded-lg mr-3 shadow-sm">
              <Text className="text-gray-700 font-medium">Category</Text>
            </View>
            <View className="w-12 h-12 bg-orange-500 rounded-full items-center justify-center shadow-lg">
              <FolderPlus size={22} color="#fff" />
            </View>
          </Pressable>

          {/* Add Product Option */}
          <Pressable
            onPress={() => {
              setFabOpen(false);
              router.push("/(admin)/products/add");
            }}
            className="flex-row items-center"
          >
            <View className="bg-white px-3 py-2 rounded-lg mr-3 shadow-sm">
              <Text className="text-gray-700 font-medium">Product</Text>
            </View>
            <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center shadow-lg">
              <Package size={22} color="#fff" />
            </View>
          </Pressable>
        </View>
      )}

      {/* Main FAB Button */}
      <Pressable
        onPress={() => setFabOpen(!fabOpen)}
        className="absolute right-4"
        style={{ bottom: 20 }}
      >
        <View
          className={`w-14 h-14 rounded-full items-center justify-center shadow-lg ${
            fabOpen ? "bg-gray-700" : "bg-primary"
          }`}
          style={{
            shadowColor: fabOpen ? "#374151" : "#1D5A34",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {fabOpen ? (
            <X size={24} color="#fff" />
          ) : (
            <Plus size={24} color="#fff" />
          )}
        </View>
      </Pressable>

      {/* Delete Product Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModal.visible}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ visible: false, id: "", name: "" })}
      />
    </SafeAreaView>
  );
}
