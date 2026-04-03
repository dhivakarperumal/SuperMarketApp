import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { ChevronLeft, Search, Plus, FolderOpen, Edit, Trash2 } from "lucide-react-native";
import { router } from "expo-router";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../../src/services/firebase/config";
import { useCategories } from "../../../src/hooks/useCategories";
import Toast from "react-native-toast-message";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";

const Logo = require("../../../assets/images/logo.png");

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { categories, loading } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; id: string; name: string }>({
    visible: false,
    id: "",
    name: "",
  });

  const filteredCategories = categories.filter((cat) =>
    cat.cname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    setDeleteModal({ visible: true, id, name });
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "categories", deleteModal.id));
      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: `${deleteModal.name} has been deleted`,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete category",
      });
    }
    setDeleteModal({ visible: false, id: "", name: "" });
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
          <Text className="text-xl font-bold text-gray-800">Categories</Text>
        </View>
        <Pressable
          onPress={() => router.push("/(admin)/categories/add")}
          className="flex-row items-center bg-primary px-4 py-2 rounded-xl"
        >
          <Plus size={18} color="#fff" />
          <Text className="text-white font-semibold ml-1">Add</Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-3">
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search categories..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-gray-800"
          />
        </View>
      </View>

      {/* Categories List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D5C45" />
        </View>
      ) : (
        <FlashList
          data={filteredCategories}
          estimatedItemSize={100}
          contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 100) }}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl mb-3">
              <View className="flex-row">
                {/* Category Image */}
                <View className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  {item.cimgs?.[0] ? (
                    <Image
                      source={{ uri: item.cimgs[0] }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <FolderOpen size={24} color="#9CA3AF" />
                    </View>
                  )}
                </View>

                {/* Category Details */}
                <View className="flex-1 ml-4">
                  <Text className="font-semibold text-gray-800 text-lg">
                    {item.cname}
                  </Text>
                  {item.subcategories && item.subcategories.length > 0 && (
                    <Text className="text-gray-500 text-sm mt-1" numberOfLines={1}>
                      {item.subcategories.length} subcategories
                    </Text>
                  )}
                  <Text className="text-gray-400 text-xs mt-1">
                    ID: {item.catId}
                  </Text>
                </View>

                {/* Actions */}
                <View className="justify-center space-y-2">
                  <Pressable
                    onPress={() => router.push(`/(admin)/categories/edit/${item.id}`)}
                    className="p-2 bg-blue-50 rounded-lg mb-2"
                  >
                    <Edit size={18} color="#3B82F6" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(item.id, item.cname)}
                    className="p-2 bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <FolderOpen size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg mt-4">No categories found</Text>
              <Pressable
                onPress={() => router.push("/(admin)/categories/add")}
                className="mt-4 bg-primary px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">Add Category</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* Delete Category Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModal.visible}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteModal.name}"? Products in this category won't be deleted.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ visible: false, id: "", name: "" })}
      />
    </SafeAreaView>
  );
}
