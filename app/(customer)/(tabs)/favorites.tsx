import { router } from "expo-router";
import {
    ChevronLeft,
    Heart,
    HeartOff,
    ShoppingBag,
    ShoppingCart,
    Trash2,
} from "lucide-react-native";
import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useCart } from "../../../src/context/CartContext";
import { useFavorites } from "../../../src/hooks/useFavorites";
import { FavoriteItem } from "../../../src/types";
import { formatCurrency } from "../../../src/utils/formatters";

export default function FavoritesScreen() {
  const { favorites, removeFromFavorites, clearAllFavorites, loading } = useFavorites();
  const { addToCart } = useCart();

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FavoriteItem | null>(null);

  const handleDeletePress = (item: FavoriteItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await removeFromFavorites(itemToDelete.id);
      setShowDeleteModal(false);
      setItemToDelete(null);
      Toast.show({
        type: "success",
        text1: "Removed from Wishlist",
        text2: `${itemToDelete.name} has been removed`,
      });
    }
  };

  const handleAddToCart = async (item: FavoriteItem) => {
    await addToCart({
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      selectedWeight: item.selectedWeight,
      quantity: 1,
    });
    Toast.show({
      type: "success",
      text1: "Added to Cart",
      text2: `${item.name} has been added to your cart`,
    });
  };

  const handleAddAllToCart = async () => {
    for (const item of favorites) {
      await addToCart({
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        selectedWeight: item.selectedWeight,
        quantity: 1,
      });
    }
    Toast.show({
      type: "success",
      text1: "Added All to Cart",
      text2: `${favorites.length} items added to your cart`,
    });
  };

  const handleClearAll = async () => {
    if (clearAllFavorites) {
      await clearAllFavorites();
      setShowClearAllModal(false);
      Toast.show({
        type: "success",
        text1: "Wishlist Cleared",
        text2: "All items have been removed",
      });
    }
  };

  if (favorites.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9]" edges={["top", "bottom"]}>
        <View className="px-4 py-4 bg-primary border-b border-primaryDark">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 bg-white rounded-full items-center justify-center mr-3"
            >
              <ChevronLeft size={24} color="#1D5C45" />
            </Pressable>
            <Text className="text-2xl font-bold text-white">Wishlist</Text>
          </View>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-5"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <Heart size={40} color="#EF4444" />
          </View>
          <Text className="text-lg font-bold text-gray-800 mb-2">
            No favorites yet
          </Text>
          <Text className="text-gray-500 text-center mb-6">
            Items you like will appear here
          </Text>
          <Pressable
            onPress={() => router.push("/(customer)/(tabs)/shop")}
            className="bg-primary px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Browse Products</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="px-4 py-4 bg-primary border-b border-primaryDark">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 bg-white rounded-full items-center justify-center mr-3"
            >
              <ChevronLeft size={24} color="#1D5C45" />
            </Pressable>
            <View>
              <Text className="text-2xl font-bold text-white">Wishlist</Text>
              <Text className="text-white/80 text-sm">{favorites.length} items</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <Pressable
              onPress={handleAddAllToCart}
              className="flex-row items-center bg-primary px-3 py-2 rounded-lg mr-2"
            >
              <ShoppingCart size={14} color="#fff" />
              <Text className="text-white font-semibold text-xs ml-1">Add All</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowClearAllModal(true)}
              className="flex-row items-center bg-red-50 px-3 py-2 rounded-lg"
            >
              <Trash2 size={14} color="#EF4444" />
              <Text className="text-red-500 font-semibold text-xs ml-1">Clear</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* List */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {favorites.map((item, index) => (
          <Pressable
            key={`${item.id}-${index}`}
            onPress={() => router.push(`/(customer)/product/${item.productId}`)}
            className="flex-row bg-white mx-4 my-2 p-4 rounded-xl"
          >
            {/* Image */}
            <View className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <ShoppingBag size={24} color="#9CA3AF" />
                </View>
              )}
            </View>

            {/* Details */}
            <View className="flex-1 ml-4">
              <Text className="text-gray-800 font-semibold" numberOfLines={2}>
                {item.name}
              </Text>
              {item.selectedWeight && (
                <Text className="text-gray-500 text-sm mt-1">
                  {item.selectedWeight}
                </Text>
              )}
              <Text className="text-primary font-bold mt-1">
                {formatCurrency(item.price)}
              </Text>
            </View>

            {/* Actions */}
            <View className="flex-row items-center">
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddToCart(item);
                }}
                className="w-10 h-10 bg-primary rounded-full items-center justify-center mr-2"
              >
                <ShoppingCart size={18} color="#fff" />
              </Pressable>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeletePress(item);
                }}
                className="w-10 h-10 bg-red-50 rounded-full items-center justify-center"
              >
                <Trash2 size={18} color="#EF4444" />
              </Pressable>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center px-6"
          onPress={() => setShowDeleteModal(false)}
        >
          <Pressable
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <View className="items-center pt-8 pb-4">
              <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center">
                <HeartOff size={36} color="#EF4444" />
              </View>
            </View>

            {/* Content */}
            <View className="px-6 pb-6">
              <Text className="text-xl font-bold text-gray-800 text-center mb-2">
                Remove from Wishlist?
              </Text>
              <Text className="text-gray-500 text-center mb-6">
                Are you sure you want to remove{" "}
                <Text className="font-semibold text-gray-700">
                  {itemToDelete?.name}
                </Text>{" "}
                from your wishlist?
              </Text>

              {/* Product Preview */}
              {itemToDelete && (
                <View className="flex-row items-center bg-[#F1F8E9] p-3 rounded-xl mb-6">
                  <View className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                    {itemToDelete.image ? (
                      <Image
                        source={{ uri: itemToDelete.image }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <ShoppingBag size={16} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-800 font-medium text-sm" numberOfLines={1}>
                      {itemToDelete.name}
                    </Text>
                    <Text className="text-primary font-bold text-sm">
                      {formatCurrency(itemToDelete.price)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Buttons */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowDeleteModal(false)}
                  className="flex-1 py-4 bg-gray-100 rounded-xl"
                >
                  <Text className="text-gray-700 font-semibold text-center">Keep it</Text>
                </Pressable>
                <Pressable
                  onPress={confirmDelete}
                  className="flex-1 py-4 bg-red-500 rounded-xl"
                >
                  <Text className="text-white font-semibold text-center">Remove</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Clear All Confirmation Modal */}
      <Modal
        visible={showClearAllModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearAllModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center px-6"
          onPress={() => setShowClearAllModal(false)}
        >
          <Pressable
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <View className="items-center pt-8 pb-4">
              <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center">
                <Trash2 size={36} color="#EF4444" />
              </View>
            </View>

            {/* Content */}
            <View className="px-6 pb-6">
              <Text className="text-xl font-bold text-gray-800 text-center mb-2">
                Clear Wishlist?
              </Text>
              <Text className="text-gray-500 text-center mb-6">
                Are you sure you want to remove all {favorites.length} items from your wishlist? This action cannot be undone.
              </Text>

              {/* Buttons */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowClearAllModal(false)}
                  className="flex-1 py-4 bg-gray-100 rounded-xl"
                >
                  <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleClearAll}
                  className="flex-1 py-4 bg-red-500 rounded-xl"
                >
                  <Text className="text-white font-semibold text-center">Clear All</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
