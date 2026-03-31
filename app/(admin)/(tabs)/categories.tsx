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
import { Search, Plus, FolderOpen, FolderPlus, Package, Edit, Trash2, X } from "lucide-react-native";
import { router } from "expo-router";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../../src/services/firebase/config";
import { useCategories } from "../../../src/hooks/useCategories";
import Toast from "react-native-toast-message";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { categories, loading } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [fabOpen, setFabOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; id: string; name: string }>({
    visible: false,
    id: "",
    name: "",
  });

  const normalizedSearch = (searchQuery || "").trim().toLowerCase();

  const filteredCategories = (categories || []).filter((cat) => {
    const name = (cat?.name || "").toString();
    return name.toLowerCase().includes(normalizedSearch);
  });

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
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-4 bg-gray-100 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-800">Categories</Text>
          <Text className="text-gray-500">{categories.length} items</Text>
        </View>

        {/* Search Bar */}
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
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
        <FlashList
          data={filteredCategories}
          estimatedItemSize={100}
          contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl mb-3">
              <View className="flex-row">
                {/* Category Image */}
                <View className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  {item.images?.[0] ? (
                    <Image
                      source={{ uri: item.images[0] }}
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
                    {item.name}
                  </Text>
                  {item.subcategories && item.subcategories.length > 0 && (
                    <Text className="text-gray-500 text-sm mt-1" numberOfLines={1}>
                      {item.subcategories.length} subcategories
                    </Text>
                  )}
                  <Text className="text-gray-400 text-xs mt-1">
                    ID: {item.categoryId}
                  </Text>
                </View>

                {/* Actions */}
                <View className="justify-center">
                  <Pressable
                    onPress={() => router.push(`/(admin)/categories/edit/${item.id}`)}
                    className="p-2 bg-blue-50 rounded-lg mb-2"
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
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <FolderOpen size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg mt-4">No categories found</Text>
              <Text className="text-gray-400 text-sm mt-1">Tap + to add a category</Text>
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
          {/* Add Product Option */}
          <Pressable
            onPress={() => {
              setFabOpen(false);
              router.push("/(admin)/products/add");
            }}
            className="flex-row items-center mb-3"
          >
            <View className="bg-white px-3 py-2 rounded-lg mr-3 shadow-sm">
              <Text className="text-gray-700 font-medium">Product</Text>
            </View>
            <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center shadow-lg">
              <Package size={22} color="#fff" />
            </View>
          </Pressable>

          {/* Add Category Option */}
          <Pressable
            onPress={() => {
              setFabOpen(false);
              router.push("/(admin)/categories/add");
            }}
            className="flex-row items-center"
          >
            <View className="bg-white px-3 py-2 rounded-lg mr-3 shadow-sm">
              <Text className="text-gray-700 font-medium">Category</Text>
            </View>
            <View className="w-12 h-12 bg-orange-500 rounded-full items-center justify-center shadow-lg">
              <FolderPlus size={22} color="#fff" />
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
            shadowColor: fabOpen ? "#374151" : "#2E7D32",
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
