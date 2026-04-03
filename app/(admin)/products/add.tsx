import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import {
  ChevronLeft,
  Camera,
  Plus,
  X,
  Package,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../../../src/services/firebase/config";
import { useCategories } from "../../../src/hooks/useCategories";
import { useAuth } from "../../../src/context/AuthContext";
import { generateBarcodeSVG } from "../../../src/utils/barcode";
import Toast from "react-native-toast-message";

const Logo = require("../../../assets/images/logo.png");

export default function AddProductScreen() {
  const insets = useSafeAreaInsets();
  const { categories } = useCategories();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const [product, setProduct] = useState({
    name: "",
    description: "",
    category: "",
    categoryId: "",
    price: "",
    stock: "",
    stockUnit: "pcs",
    discount: "",
    productId: "",
  });

  // Generate product ID on component mount
  useEffect(() => {
    generateNextProductId();
  }, []);

  const generateNextProductId = async () => {
    try {
      // Get ALL products to find the highest ID
      const snapshot = await getDocs(collection(db, "products"));

      let maxNumber = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        const productId = data.productId || "";
        // Only match sequential IDs with 1-4 digits (SP001 to SP9999)
        // Ignore old timestamp-based IDs like SP1768968581610
        const match = productId.match(/^SP(\d{1,4})$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });

      // Generate next ID with 3-digit padding (SP001, SP002, etc.)
      const nextNumber = maxNumber + 1;
      const nextId = `SP${nextNumber.toString().padStart(3, "0")}`;
      setProduct((prev) => ({ ...prev, productId: nextId }));
    } catch (error) {
      console.error("Error generating product ID:", error);
      // Fallback to SP001 if error
      setProduct((prev) => ({ ...prev, productId: "SP001" }));
    }
  };

  const [weights, setWeights] = useState<string[]>([]);
  const [prices, setPrices] = useState<{ [key: string]: number }>({});
  const [newWeight, setNewWeight] = useState("");

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setLoading(true);
      try {
        // Compress image to max 800px and ~200-300KB
        const compressed = await manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.5, format: SaveFormat.JPEG }
        );

        // Convert to base64
        const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const base64Image = `data:image/jpeg;base64,${base64}`;

        setImages((prev) => [...prev, base64Image]);
      } catch (error) {
        console.error("Image compression failed:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to process image",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addWeight = () => {
    if (newWeight && !weights.includes(newWeight)) {
      setWeights([...weights, newWeight]);
      setPrices({ ...prices, [newWeight]: 0 });
      setNewWeight("");
    }
  };

  const removeWeight = (weight: string) => {
    setWeights(weights.filter((w) => w !== weight));
    const newPrices = { ...prices };
    delete newPrices[weight];
    setPrices(newPrices);
  };

  const updateWeightPrice = (weight: string, price: string) => {
    setPrices({ ...prices, [weight]: parseFloat(price) || 0 });
  };

  const handleSubmit = async () => {
    if (!product.name || !product.category) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please fill in product name and category",
      });
      return;
    }

    setLoading(true);
    try {
      // Generate barcode SVG with product ID
      const barcodeImage = generateBarcodeSVG(product.productId, product.name);

      // Prepare product data (images are already base64 compressed)
      const productData: any = {
        name: product.name,
        description: product.description,
        category: product.category,
        categoryId: product.categoryId,
        productId: product.productId,
        barcode: product.productId, // Use productId as barcode value
        barcodeImage: barcodeImage, // Store barcode SVG as base64
        images: images,
        stock: parseInt(product.stock) || 0,
        stockUnit: product.stockUnit,
        discount: parseInt(product.discount) || 0,
        businessId: userProfile?.businessId || null,
        branchId: userProfile?.branchId || null,
        createdAt: serverTimestamp(),
      };

      // Add prices
      if (weights.length > 0) {
        productData.weights = weights;
        productData.prices = prices;
        productData.price = Object.values(prices)[0] || 0;
      } else {
        productData.price = parseFloat(product.price) || 0;
      }

      await addDoc(collection(db, "products"), productData);

      Toast.show({
        type: "success",
        text1: "Product Added",
        text2: "Product has been added successfully",
      });

      router.back();
    } catch (error) {
      console.error("Error adding product:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add product",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]" edges={["top","bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-gray-100 border-b border-gray-200">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-800">Add Product</Text>
        </View>
        <Image source={Logo} style={{ width: 40, height: 40 }} resizeMode="contain" />
      </View>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-4">
          {/* Images */}
          <View className="bg-white p-4 rounded-xl mb-4">
            <Text className="font-bold text-gray-800 mb-3">Product Images</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((image, index) => (
                <View key={index} className="mr-3 relative">
                  <Image
                    source={{ uri: image }}
                    className="w-24 h-24 rounded-xl"
                  />
                  <Pressable
                    onPress={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                  >
                    <X size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
              <Pressable
                onPress={pickImage}
                className="w-24 h-24 bg-gray-100 rounded-xl items-center justify-center border-2 border-dashed border-gray-300"
              >
                <Camera size={24} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs mt-1">Add</Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* Basic Info */}
          <View className="bg-white p-4 rounded-xl mb-4">
            <Text className="font-bold text-gray-800 mb-3">Basic Information</Text>

            <View className="mb-4">
              <Text className="text-gray-600 font-medium mb-2">Product Name *</Text>
              <TextInput
                value={product.name}
                onChangeText={(text) => setProduct({ ...product, name: text })}
                placeholder="Enter product name"
                className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-[#F1F8E9]"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 font-medium mb-2">Product ID (Auto-generated)</Text>
              <TextInput
                value={product.productId}
                onChangeText={(text) => setProduct({ ...product, productId: text.toUpperCase() })}
                placeholder="Loading..."
                className="border-2 border-green-400 rounded-xl px-4 py-3 bg-green-50"
                placeholderTextColor="#9CA3AF"
                editable={true}
              />
              <Text className="text-gray-400 text-xs mt-1">Auto-generated. You can edit if needed.</Text>
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 font-medium mb-2">Description</Text>
              <TextInput
                value={product.description}
                onChangeText={(text) => setProduct({ ...product, description: text })}
                placeholder="Enter product description"
                multiline
                numberOfLines={3}
                className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-[#F1F8E9]"
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 font-medium mb-2">Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setProduct({ ...product, category: cat.cname, categoryId: cat.id })}
                    className={`px-4 py-2 rounded-xl mr-2 border-2 ${
                      product.categoryId === cat.id
                        ? "border-primary bg-primary/10"
                        : "border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        product.categoryId === cat.id ? "text-primary" : "text-gray-600"
                      }`}
                    >
                      {cat.cname}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

          </View>

          {/* Pricing */}
          <View className="bg-white p-4 rounded-xl mb-4">
            <Text className="font-bold text-gray-800 mb-3">Pricing</Text>

            {weights.length === 0 ? (
              <View className="mb-4">
                <Text className="text-gray-600 font-medium mb-2">Price (₹)</Text>
                <TextInput
                  value={product.price}
                  onChangeText={(text) => setProduct({ ...product, price: text })}
                  placeholder="0"
                  keyboardType="numeric"
                  className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-[#F1F8E9]"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            ) : (
              <View className="mb-4">
                {weights.map((weight) => (
                  <View key={weight} className="flex-row items-center mb-3">
                    <View className="flex-1 flex-row items-center">
                      <Text className="text-gray-700 font-medium w-20">{weight}</Text>
                      <TextInput
                        value={prices[weight]?.toString() || ""}
                        onChangeText={(text) => updateWeightPrice(weight, text)}
                        placeholder="0"
                        keyboardType="numeric"
                        className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 bg-[#F1F8E9]"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                    <Pressable
                      onPress={() => removeWeight(weight)}
                      className="ml-2 p-2 bg-red-50 rounded-lg"
                    >
                      <X size={18} color="#EF4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Add Weight Option */}
            <View className="flex-row items-center">
              <TextInput
                value={newWeight}
                onChangeText={setNewWeight}
                placeholder="Add variant (e.g., 500g, 1kg)"
                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 bg-[#F1F8E9]"
                placeholderTextColor="#9CA3AF"
              />
              <Pressable
                onPress={addWeight}
                className="ml-2 p-3 bg-primary rounded-xl"
              >
                <Plus size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Stock */}
          <View className="bg-white p-4 rounded-xl mb-4">
            <Text className="font-bold text-gray-800 mb-3">Stock & Discount</Text>

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-gray-600 font-medium mb-2">Stock</Text>
                <TextInput
                  value={product.stock}
                  onChangeText={(text) => setProduct({ ...product, stock: text })}
                  placeholder="0"
                  keyboardType="numeric"
                  className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-[#F1F8E9]"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-gray-600 font-medium mb-2">Unit</Text>
                <View className="flex-row">
                  {["pcs", "g", "kg", "ml", "L"].map((unit) => (
                    <Pressable
                      key={unit}
                      onPress={() => setProduct({ ...product, stockUnit: unit })}
                      className={`px-3 py-3 rounded-xl mr-1 ${
                        product.stockUnit === unit
                          ? "bg-primary"
                          : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          product.stockUnit === unit ? "text-white" : "text-gray-600"
                        }`}
                      >
                        {unit}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <View>
              <Text className="text-gray-600 font-medium mb-2">Discount (%)</Text>
              <TextInput
                value={product.discount}
                onChangeText={(text) => setProduct({ ...product, discount: text })}
                placeholder="0"
                keyboardType="numeric"
                className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-[#F1F8E9]"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Submit Button */}
      <View
        className="bg-white px-4 pt-4 border-t border-gray-100"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className="bg-primary py-4 rounded-xl"
          style={{
            shadowColor: "#1D5C45",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              Add Product
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
