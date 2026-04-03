import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  X,
  Video,
  Image as ImageIcon,
  Link,
  Tag,
  ShoppingBag,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../src/services/firebase/config";
import { useReelsAdmin, Reel } from "../../../../src/hooks/useReels";
import { useProducts } from "../../../../src/hooks/useProducts";
import Toast from "react-native-toast-message";

export default function EditReelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateReel } = useReelsAdmin();
  const { products } = useProducts();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reel, setReel] = useState<Reel | null>(null);

  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);

  useEffect(() => {
    const fetchReel = async () => {
      if (!id) return;

      try {
        const reelDoc = await getDoc(doc(db, "reels", id));
        if (reelDoc.exists()) {
          const data = reelDoc.data() as Reel;
          setReel({ ...data, id: reelDoc.id });
          setVideoUrl(data.videoUrl || "");
          setThumbnailUrl(data.thumbnailUrl || "");
          setCaption(data.caption || "");
          setHashtags(data.hashtags?.join(", ") || "");
          setSelectedProduct(data.productId || null);
        }
      } catch (error) {
        console.error("Error fetching reel:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load reel",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReel();
  }, [id]);

  const handleSave = async () => {
    if (!id || !videoUrl.trim()) {
      Toast.show({
        type: "error",
        text1: "Video Required",
        text2: "Please enter a video URL",
      });
      return;
    }

    setSaving(true);

    try {
      const product = products.find((p) => p.id === selectedProduct);
      const hashtagArray = hashtags
        .split(/[,\s#]+/)
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0);

      // Get product price - handle both price and prices object
      const getProductPrice = () => {
        if (!product) return undefined;
        if (product.price) return Number(product.price);
        if (product.prices) {
          const priceValues = Object.values(product.prices);
          if (priceValues.length > 0) return Number(priceValues[0]);
        }
        return undefined;
      };

      await updateReel(id, {
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        caption: caption.trim() || undefined,
        hashtags: hashtagArray.length > 0 ? hashtagArray : undefined,
        productId: selectedProduct || undefined,
        productName: product?.name || undefined,
        productPrice: getProductPrice(),
      });

      Toast.show({
        type: "success",
        text1: "Reel Updated",
        text2: "Changes have been saved",
      });

      router.back();
    } catch (error) {
      console.error("Error updating reel:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update reel",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedProductData = products.find((p) => p.id === selectedProduct);

  const formatCount = (count: number): string => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9] items-center justify-center">
        <ActivityIndicator size="large" color="#1D5A34" />
      </SafeAreaView>
    );
  }

  if (!reel) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9] items-center justify-center">
        <Text className="text-gray-500">Reel not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]" edges={["top","bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-800">Edit Reel</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className={`px-5 py-2 rounded-full ${saving ? "bg-gray-300" : "bg-primary"}`}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold">Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Stats Card */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-gray-800 font-semibold mb-3">Performance</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <View className="flex-row items-center">
                <Eye size={18} color="#6B7280" />
                <Text className="text-gray-800 font-bold text-lg ml-2">
                  {formatCount(reel.viewsCount || 0)}
                </Text>
              </View>
              <Text className="text-gray-500 text-xs mt-1">Views</Text>
            </View>
            <View className="items-center">
              <View className="flex-row items-center">
                <Heart size={18} color="#EF4444" />
                <Text className="text-gray-800 font-bold text-lg ml-2">
                  {formatCount(reel.likesCount || 0)}
                </Text>
              </View>
              <Text className="text-gray-500 text-xs mt-1">Likes</Text>
            </View>
            <View className="items-center">
              <View className="flex-row items-center">
                <MessageCircle size={18} color="#3B82F6" />
                <Text className="text-gray-800 font-bold text-lg ml-2">
                  {formatCount(reel.commentsCount || 0)}
                </Text>
              </View>
              <Text className="text-gray-500 text-xs mt-1">Comments</Text>
            </View>
          </View>
        </View>

        {/* Video URL */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <Video size={20} color="#1D5A34" />
            <Text className="text-gray-800 font-semibold ml-2">Video URL *</Text>
          </View>
          <TextInput
            value={videoUrl}
            onChangeText={setVideoUrl}
            placeholder="https://example.com/video.mp4"
            placeholderTextColor="#9CA3AF"
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        {/* Thumbnail URL */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <ImageIcon size={20} color="#1D5A34" />
            <Text className="text-gray-800 font-semibold ml-2">Thumbnail URL</Text>
          </View>
          <TextInput
            value={thumbnailUrl}
            onChangeText={setThumbnailUrl}
            placeholder="https://example.com/thumbnail.jpg"
            placeholderTextColor="#9CA3AF"
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        {/* Caption */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-gray-800 font-semibold mb-3">Caption</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption for your reel..."
            placeholderTextColor="#9CA3AF"
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ minHeight: 80 }}
          />
        </View>

        {/* Hashtags */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <Tag size={20} color="#1D5A34" />
            <Text className="text-gray-800 font-semibold ml-2">Hashtags</Text>
          </View>
          <TextInput
            value={hashtags}
            onChangeText={setHashtags}
            placeholder="fresh, organic, deals, grocery"
            placeholderTextColor="#9CA3AF"
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
            autoCapitalize="none"
          />
        </View>

        {/* Link Product */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <ShoppingBag size={20} color="#1D5A34" />
              <Text className="text-gray-800 font-semibold ml-2">Link Product</Text>
            </View>
            {selectedProduct && (
              <Pressable onPress={() => setSelectedProduct(null)}>
                <X size={20} color="#6B7280" />
              </Pressable>
            )}
          </View>

          {selectedProductData ? (
            <View className="flex-row items-center bg-gray-100 rounded-xl p-3">
              {selectedProductData.images?.[0] && (
                <Image
                  source={{ uri: selectedProductData.images[0] }}
                  className="w-12 h-12 rounded-lg"
                />
              )}
              <View className="flex-1 ml-3">
                <Text className="text-gray-800 font-medium">
                  {selectedProductData.name}
                </Text>
                <Text className="text-primary font-semibold">
                  ₹{selectedProductData.price || Object.values(selectedProductData.prices || {})[0]}
                </Text>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowProductPicker(true)}
              className="bg-gray-100 rounded-xl p-4 items-center"
            >
              <Link size={24} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">Tap to link a product</Text>
            </Pressable>
          )}
        </View>

        {/* Product Picker */}
        {showProductPicker && (
          <View className="bg-white rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-800 font-semibold">Select Product</Text>
              <Pressable onPress={() => setShowProductPicker(false)}>
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {products.slice(0, 20).map((product) => (
                <Pressable
                  key={product.id}
                  onPress={() => {
                    setSelectedProduct(product.id);
                    setShowProductPicker(false);
                  }}
                  className="flex-row items-center py-3 border-b border-gray-100"
                >
                  {product.images?.[0] && (
                    <Image
                      source={{ uri: product.images[0] }}
                      className="w-10 h-10 rounded-lg"
                    />
                  )}
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-800" numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      ₹{product.price || Object.values(product.prices || {})[0]}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
