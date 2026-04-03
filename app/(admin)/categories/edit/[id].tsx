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
import { router, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  Camera,
  Plus,
  X,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../src/services/firebase/config";
import Toast from "react-native-toast-message";

const Logo = require("../../../../assets/images/logo.png");

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [images, setImages] = useState<string[]>([]);

  const [category, setCategory] = useState({
    name: "",
    description: "",
    catId: "",
  });

  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [newSubcategory, setNewSubcategory] = useState("");

  useEffect(() => {
    fetchCategory();
  }, [id]);

  const fetchCategory = async () => {
    if (!id) return;
    try {
      const docRef = doc(db, "categories", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCategory({
          name: data.cname || data.name || "",
          description: data.cdescription || data.description || "",
          catId: data.catId || "",
        });
        setImages(data.cimgs || data.images || []);
        setSubcategories(data.subcategories || []);
      }
    } catch (error) {
      console.error("Error fetching category:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load category",
      });
    } finally {
      setFetching(false);
    }
  };

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

    if (!id) return;

    setLoading(true);
    try {
      const categoryData = {
        cname: category.name,
        cdescription: category.description,
        catId: category.catId,
        cimgs: images,
        subcategories: subcategories,
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, "categories", id), categoryData);

      Toast.show({
        type: "success",
        text1: "Category Updated",
        text2: "Category has been updated successfully",
      });

      router.back();
    } catch (error) {
      console.error("Error updating category:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update category",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9] items-center justify-center" edges={["top","bottom"]}>
        <ActivityIndicator size="large" color="#1D5A34" />
      </SafeAreaView>
    );
  }

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
          <Text className="text-xl font-bold text-gray-800">Edit Category</Text>
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
                className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-[#F1F8E9]"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 font-medium mb-2">Category ID</Text>
              <TextInput
                value={category.catId}
                onChangeText={(text) => setCategory({ ...category, catId: text })}
                placeholder="e.g., CAT001"
                className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-[#F1F8E9]"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-gray-600 font-medium mb-2">Description</Text>
              <TextInput
                value={category.description}
                onChangeText={(text) => setCategory({ ...category, description: text })}
                placeholder="Enter category description"
                multiline
                numberOfLines={3}
                className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-[#F1F8E9]"
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
                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 bg-[#F1F8E9]"
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
            shadowColor: "#1D5A34",
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
              Update Category
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
