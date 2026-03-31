import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import {
  ChevronLeft,
  Camera,
  Plus,
  X,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../../../src/services/firebase/config";
import Toast from "react-native-toast-message";

const Logo = require("../../../assets/images/logo.png");

export default function AddCategoryScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const [category, setCategory] = useState({
    name: "",
    description: "",
    catId: "",
  });

  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [newSubcategory, setNewSubcategory] = useState("");

  // Generate next sequential category ID
  const generateNextCatId = async () => {
    try {
      const snapshot = await getDocs(collection(db, "categories"));
      let maxNumber = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const catId = data.catId || "";
        // Only match sequential IDs with 1-4 digits (CAT001 to CAT9999)
        // Ignore old timestamp-based IDs like CAT1705564364340
        const match = catId.match(/^CAT(\d{1,4})$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });

      // Generate next ID with 3-digit padding (CAT001, CAT002, etc.)
      const nextNumber = maxNumber + 1;
      const nextCatId = `CAT${nextNumber.toString().padStart(3, "0")}`;
      setCategory((prev) => ({ ...prev, catId: nextCatId }));
    } catch (error) {
      console.error("Error generating catId:", error);
      // Fallback to CAT001 if error
      setCategory((prev) => ({ ...prev, catId: "CAT001" }));
    }
  };

  useEffect(() => {
    generateNextCatId();
  }, []);

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
        const compressed = await manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.5, format: SaveFormat.JPEG }
        );

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

  const addSubcategory = () => {
    if (newSubcategory.trim() && !subcategories.includes(newSubcategory.trim())) {
      setSubcategories([...subcategories, newSubcategory.trim()]);
      setNewSubcategory("");
    }
  };

  const removeSubcategory = (sub: string) => {
    setSubcategories(subcategories.filter((s) => s !== sub));
  };

  const handleSubmit = async () => {
    if (!category.name) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please enter category name",
      });
      return;
    }

    setLoading(true);
    try {
      const categoryData = {
        cname: category.name,
        cdescription: category.description,
        catId: category.catId,
        cimgs: images,
        subcategories: subcategories,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "categories"), categoryData);

      Toast.show({
        type: "success",
        text1: "Category Added",
        text2: "Category has been added successfully",
      });

      router.back();
    } catch (error) {
      console.error("Error adding category:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add category",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-gray-100 border-b border-gray-200">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-800">Add Category</Text>
        </View>
        <Image source={Logo} style={{ width: 40, height: 40 }} resizeMode="contain" />
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === "ios" ? 120 : 80}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-4">
          {/* Images */}
          <View className="bg-white p-4 rounded-xl mb-4">
            <Text className="font-bold text-gray-800 mb-3">Category Image</Text>
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
            <Text className="font-bold text-gray-800 mb-3">Category Information</Text>

            <View className="mb-4">
              <Text className="text-gray-600 font-medium mb-2">Category Name *</Text>
              <TextInput
                value={category.name}
                onChangeText={(text) => setCategory({ ...category, name: text })}
                placeholder="Enter category name"
                className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 font-medium mb-2">Category ID (Auto-generated)</Text>
              <TextInput
                value={category.catId}
                onChangeText={(text) => setCategory({ ...category, catId: text.toUpperCase() })}
                placeholder="Loading..."
                className="border-2 border-green-400 rounded-xl px-4 py-3 bg-green-50"
                placeholderTextColor="#9CA3AF"
                editable={true}
              />
              <Text className="text-gray-400 text-xs mt-1">Auto-generated. You can edit if needed.</Text>
            </View>

            <View>
              <Text className="text-gray-600 font-medium mb-2">Description</Text>
              <TextInput
                value={category.description}
                onChangeText={(text) => setCategory({ ...category, description: text })}
                placeholder="Enter category description"
                multiline
                numberOfLines={3}
                className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50"
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Subcategories */}
          <View className="bg-white p-4 rounded-xl mb-4">
            <Text className="font-bold text-gray-800 mb-3">Subcategories</Text>

            {subcategories.length > 0 && (
              <View className="flex-row flex-wrap mb-3">
                {subcategories.map((sub, index) => (
                  <View
                    key={index}
                    className="flex-row items-center bg-gray-100 px-3 py-2 rounded-lg mr-2 mb-2"
                  >
                    <Text className="text-gray-700">{sub}</Text>
                    <Pressable
                      onPress={() => removeSubcategory(sub)}
                      className="ml-2"
                    >
                      <X size={14} color="#EF4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View className="flex-row items-center">
              <TextInput
                value={newSubcategory}
                onChangeText={setNewSubcategory}
                placeholder="Add subcategory"
                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50"
                placeholderTextColor="#9CA3AF"
                onSubmitEditing={addSubcategory}
              />
              <Pressable
                onPress={addSubcategory}
                className="ml-2 p-3 bg-primary rounded-xl"
              >
                <Plus size={20} color="#fff" />
              </Pressable>
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
            shadowColor: "#2E7D32",
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
              Add Category
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
