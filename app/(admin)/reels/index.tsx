import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import {
  ChevronLeft,
  Plus,
  Play,
  Eye,
  Heart,
  MessageCircle,
  MoreVertical,
  Trash2,
  Edit,
  ToggleLeft,
  ToggleRight,
  Clapperboard,
} from "lucide-react-native";
import { useReelsAdmin, Reel } from "../../../src/hooks/useReels";
import { formatDate } from "../../../src/utils/formatters";
import Toast from "react-native-toast-message";

export default function AdminReelsScreen() {
  const { reels, loading, deleteReel, toggleReelStatus } = useReelsAdmin();
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleDelete = (reel: Reel) => {
    Alert.alert(
      "Delete Reel",
      "Are you sure you want to delete this reel?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteReel(reel.id);
              Toast.show({
                type: "success",
                text1: "Reel Deleted",
                text2: "The reel has been removed",
              });
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to delete reel",
              });
            }
          },
        },
      ]
    );
    setMenuOpen(null);
  };

  const handleToggleStatus = async (reel: Reel) => {
    try {
      await toggleReelStatus(reel.id, !reel.isActive);
      Toast.show({
        type: "success",
        text1: reel.isActive ? "Reel Hidden" : "Reel Published",
        text2: reel.isActive
          ? "The reel is now hidden from users"
          : "The reel is now visible to users",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update reel status",
      });
    }
    setMenuOpen(null);
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  const renderReel = ({ item }: { item: Reel }) => {
    const createdDate = item.createdAt?.toDate?.() || new Date(item.createdAt as any);

    return (
      <Pressable
        onPress={() => router.push(`/(admin)/reels/edit/${item.id}`)}
        className="bg-white rounded-xl mb-3 overflow-hidden"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View className="flex-row p-3">
          {/* Thumbnail */}
          <View className="w-24 h-32 rounded-lg overflow-hidden bg-gray-200">
            {item.thumbnailUrl || item.videoUrl ? (
              <Image
                source={{ uri: item.thumbnailUrl || item.videoUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center bg-gray-300">
                <Clapperboard size={32} color="#9CA3AF" />
              </View>
            )}
            {/* Play overlay */}
            <View className="absolute inset-0 items-center justify-center bg-black/20">
              <View className="w-10 h-10 rounded-full bg-white/90 items-center justify-center">
                <Clapperboard size={20} color="#000" fill="#000" />
              </View>
            </View>
            {/* Status badge */}
            <View
              className={`absolute top-2 left-2 px-2 py-1 rounded ${
                item.isActive ? "bg-green-500" : "bg-gray-500"
              }`}
            >
              <Text className="text-white text-xs font-semibold">
                {item.isActive ? "Active" : "Hidden"}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View className="flex-1 ml-3">
            <Text className="text-gray-800 font-semibold text-base" numberOfLines={2}>
              {item.caption || "No caption"}
            </Text>

            <Text className="text-gray-500 text-sm mt-1">
              @{item.authorName || "dhivadeva"}
            </Text>

            {/* Stats */}
            <View className="flex-row items-center mt-2 space-x-4">
              <View className="flex-row items-center">
                <Eye size={14} color="#6B7280" />
                <Text className="text-gray-500 text-xs ml-1">
                  {formatCount(item.viewsCount || 0)}
                </Text>
              </View>
              <View className="flex-row items-center ml-3">
                <Heart size={14} color="#6B7280" />
                <Text className="text-gray-500 text-xs ml-1">
                  {formatCount(item.likesCount || 0)}
                </Text>
              </View>
              <View className="flex-row items-center ml-3">
                <MessageCircle size={14} color="#6B7280" />
                <Text className="text-gray-500 text-xs ml-1">
                  {formatCount(item.commentsCount || 0)}
                </Text>
              </View>
            </View>

            {/* Product tag */}
            {item.productName && (
              <View className="flex-row items-center mt-2">
                <View className="bg-primary/10 px-2 py-1 rounded">
                  <Text className="text-primary text-xs font-medium">
                    {item.productName}
                  </Text>
                </View>
              </View>
            )}

            <Text className="text-gray-400 text-xs mt-2">
              {formatDate(createdDate)}
            </Text>
          </View>

          {/* Menu button */}
          <Pressable
            onPress={() => setMenuOpen(menuOpen === item.id ? null : item.id)}
            className="p-2"
          >
            <MoreVertical size={20} color="#6B7280" />
          </Pressable>
        </View>

        {/* Dropdown menu */}
        {menuOpen === item.id && (
          <View className="absolute right-3 top-12 bg-white rounded-lg shadow-lg z-10 border border-gray-100">
            <Pressable
              onPress={() => {
                router.push(`/(admin)/reels/edit/${item.id}`);
                setMenuOpen(null);
              }}
              className="flex-row items-center px-4 py-3 border-b border-gray-100"
            >
              <Edit size={18} color="#4B5563" />
              <Text className="text-gray-700 ml-3">Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => handleToggleStatus(item)}
              className="flex-row items-center px-4 py-3 border-b border-gray-100"
            >
              {item.isActive ? (
                <>
                  <ToggleLeft size={18} color="#4B5563" />
                  <Text className="text-gray-700 ml-3">Hide</Text>
                </>
              ) : (
                <>
                  <ToggleRight size={18} color="#66BB6A" />
                  <Text className="text-green-600 ml-3">Publish</Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => handleDelete(item)}
              className="flex-row items-center px-4 py-3"
            >
              <Trash2 size={18} color="#EF4444" />
              <Text className="text-red-500 ml-3">Delete</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <View>
            <Text className="text-xl font-bold text-gray-800">Reels</Text>
            <Text className="text-gray-500 text-sm">{reels.length} videos</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/(admin)/reels/add")}
          className="bg-primary px-4 py-2 rounded-full flex-row items-center"
        >
          <Plus size={20} color="#fff" />
          <Text className="text-white font-semibold ml-1">Add</Text>
        </Pressable>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D5A34" />
        </View>
      ) : reels.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <View className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center mb-4">
            <Clapperboard size={40} color="#9CA3AF" />
          </View>
          <Text className="text-gray-800 text-xl font-bold mb-2">No Reels Yet</Text>
          <Text className="text-gray-500 text-center mb-6">
            Create engaging video content to showcase your products
          </Text>
          <Pressable
            onPress={() => router.push("/(admin)/reels/add")}
            className="bg-primary px-6 py-3 rounded-full flex-row items-center"
          >
            <Plus size={20} color="#fff" />
            <Text className="text-white font-semibold ml-2">Create First Reel</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={reels}
          renderItem={renderReel}
          estimatedItemSize={150}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1D5A34"
              colors={["#1D5A34"]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
