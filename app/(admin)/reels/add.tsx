import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ChevronLeft,
  X,
  Video,
  Image as ImageIcon,
  Link,
  Tag,
  ShoppingBag,
  Upload,
  Camera,
  FolderOpen,
  Link2,
  Trash2,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Video as ExpoVideo, ResizeMode } from "expo-av";
import { useReelsAdmin } from "../../../src/hooks/useReels";
import { useProducts } from "../../../src/hooks/useProducts";
import { uploadVideo } from "../../../src/services/firebase/storage";
import Toast from "react-native-toast-message";

export default function AddReelScreen() {
  const { createReel } = useReelsAdmin();
  const { products } = useProducts();
  const [loading, setLoading] = useState(false);

  const [videoUrl, setVideoUrl] = useState("");
  const [localVideoUri, setLocalVideoUri] = useState<string | null>(null);
  const [thumbnailBase64, setThumbnailBase64] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Pick video from gallery
  const pickVideoFromGallery = async () => {
    setShowUploadOptions(false);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your media library");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.7,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      setLocalVideoUri(result.assets[0].uri);
      setVideoUrl("");
    }
  };

  // Record video with camera
  const recordVideo = async () => {
    setShowUploadOptions(false);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your camera");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.7,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      setLocalVideoUri(result.assets[0].uri);
      setVideoUrl("");
    }
  };

  // Upload video to Firebase Storage
  const uploadToFirebase = async (uri: string): Promise<string> => {
    return uploadVideo(uri, "reels", (progress) => {
      setUploadProgress(progress);
    });
  };

  const clearVideo = () => {
    setLocalVideoUri(null);
    setVideoUrl("");
  };

  // Pick and compress thumbnail image to Base64
  const pickThumbnail = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your media library");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        // Compress and resize image
        const manipulated = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 400 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        if (manipulated.base64) {
          const sizeInKB = (manipulated.base64.length * 0.75) / 1024;
          if (sizeInKB > 500) {
            Alert.alert("Image Too Large", "Please select a smaller image");
            return;
          }
          setThumbnailBase64(`data:image/jpeg;base64,${manipulated.base64}`);
        }
      } catch (error) {
        console.error("Error compressing image:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to process image",
        });
      }
    }
  };

  const clearThumbnail = () => {
    setThumbnailBase64(null);
  };

  const handleSave = async () => {
    if (!videoUrl.trim() && !localVideoUri) {
      Toast.show({
        type: "error",
        text1: "Video Required",
        text2: "Please add a video or enter a video URL",
      });
      return;
    }

    setLoading(true);
    setIsUploading(true);

    try {
      let finalVideoUrl = videoUrl.trim();

      // Upload local video to Firebase Storage if selected
      if (localVideoUri) {
        Toast.show({
          type: "info",
          text1: "Uploading Video",
          text2: "Please wait while uploading...",
        });
        finalVideoUrl = await uploadToFirebase(localVideoUri);
      }

      const product = products.find((p) => p.id === selectedProduct);
      const hashtagArray = hashtags
        .split(/[,\s#]+/)
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0);

      // Get product price
      const getProductPrice = () => {
        if (!product) return undefined;
        if (product.price) return Number(product.price);
        if (product.prices) {
          const priceValues = Object.values(product.prices);
          if (priceValues.length > 0) return Number(priceValues[0]);
        }
        return undefined;
      };

      // Save to Firestore
      await createReel({
        videoUrl: finalVideoUrl,
        thumbnailUrl: thumbnailBase64 || undefined, // Base64 stored in Firestore
        caption: caption.trim() || undefined,
        hashtags: hashtagArray.length > 0 ? hashtagArray : undefined,
        authorId: "admin",
        authorName: "Dhiva Deva",
        isVerified: true,
        productId: selectedProduct || undefined,
        productName: product?.name || undefined,
        productPrice: getProductPrice(),
        isActive: true,
      });

      Toast.show({
        type: "success",
        text1: "Reel Created",
        text2: "Your reel has been published",
      });

      router.back();
    } catch (error: any) {
      console.error("Error creating reel:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.message || "Failed to create reel",
      });
    } finally {
      setLoading(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const selectedProductData = products.find((p) => p.id === selectedProduct);

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
          <Text className="text-xl font-bold text-gray-800">Add Reel</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={loading}
          className={`px-5 py-2 rounded-full ${loading ? "bg-gray-300" : "bg-primary"}`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold">Publish</Text>
          )}
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Video Upload Section */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <Video size={20} color="#2E7D32" />
            <Text className="text-gray-800 font-semibold ml-2">Video *</Text>
          </View>

          {/* Video Preview or Upload Button */}
          {localVideoUri ? (
            <View className="rounded-xl overflow-hidden bg-black">
              <ExpoVideo
                source={{ uri: localVideoUri }}
                style={{ width: "100%", height: 200 }}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
                isLooping={false}
                useNativeControls
              />
              <Pressable
                onPress={clearVideo}
                className="absolute top-2 right-2 bg-red-500 w-8 h-8 rounded-full items-center justify-center"
              >
                <Trash2 size={16} color="#fff" />
              </Pressable>
            </View>
          ) : videoUrl ? (
            <View className="bg-gray-100 rounded-xl p-4">
              <View className="flex-row items-center">
                <Link2 size={20} color="#2E7D32" />
                <Text className="text-gray-700 ml-2 flex-1" numberOfLines={1}>
                  {videoUrl}
                </Text>
                <Pressable onPress={clearVideo}>
                  <X size={20} color="#6B7280" />
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowUploadOptions(true)}
              className="bg-gray-100 rounded-xl p-6 items-center border-2 border-dashed border-gray-300"
            >
              <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-3">
                <Upload size={28} color="#2E7D32" />
              </View>
              <Text className="text-gray-800 font-semibold">Add Video</Text>
              <Text className="text-gray-500 text-sm mt-1">
                Record, upload from gallery, or paste URL
              </Text>
            </Pressable>
          )}

          {/* Upload Progress */}
          {isUploading && uploadProgress > 0 && (
            <View className="mt-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-gray-600 text-sm">Uploading video...</Text>
                <Text className="text-primary font-semibold">{uploadProgress}%</Text>
              </View>
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Thumbnail Image */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <ImageIcon size={20} color="#2E7D32" />
              <Text className="text-gray-800 font-semibold ml-2">Thumbnail</Text>
            </View>
            {thumbnailBase64 && (
              <Pressable onPress={clearThumbnail}>
                <Trash2 size={18} color="#EF4444" />
              </Pressable>
            )}
          </View>

          {thumbnailBase64 ? (
            <View className="rounded-xl overflow-hidden">
              <Image
                source={{ uri: thumbnailBase64 }}
                className="w-full h-48 rounded-xl"
                resizeMode="cover"
              />
            </View>
          ) : (
            <Pressable
              onPress={pickThumbnail}
              className="bg-gray-100 rounded-xl p-6 items-center border-2 border-dashed border-gray-300"
            >
              <ImageIcon size={32} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">Tap to add thumbnail</Text>
              <Text className="text-gray-400 text-xs mt-1">
                Compressed & stored in Firestore
              </Text>
            </Pressable>
          )}
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
            <Tag size={20} color="#2E7D32" />
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
          <Text className="text-gray-400 text-xs mt-2">
            Separate hashtags with commas or spaces
          </Text>
        </View>

        {/* Link Product */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <ShoppingBag size={20} color="#2E7D32" />
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

        {/* Tips */}
        <View className="bg-blue-50 rounded-xl p-4 mb-8">
          <Text className="text-blue-800 font-semibold mb-1">Tips</Text>
          <Text className="text-blue-600 text-sm">
            • Use vertical videos (9:16 ratio) for best results{"\n"}
            • Keep videos under 60 seconds{"\n"}
            • Videos → Firebase Storage, Thumbnails → Firestore{"\n"}
            • Link products to drive sales
          </Text>
        </View>
      </ScrollView>

      {/* Upload Options Modal */}
      <Modal
        visible={showUploadOptions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadOptions(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowUploadOptions(false)}
        >
          <Pressable className="bg-white rounded-t-3xl" onPress={(e) => e.stopPropagation()}>
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mt-3" />
            <Text className="text-xl font-bold text-gray-800 text-center py-4">
              Add Video
            </Text>

            <View className="px-4 pb-8">
              {/* Record Video */}
              <Pressable
                onPress={recordVideo}
                className="flex-row items-center p-4 bg-gray-50 rounded-xl mb-3"
              >
                <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center">
                  <Camera size={24} color="#EF4444" />
                </View>
                <View className="ml-4">
                  <Text className="text-gray-800 font-semibold">Record Video</Text>
                  <Text className="text-gray-500 text-sm">Use camera to record</Text>
                </View>
              </Pressable>

              {/* Pick from Gallery */}
              <Pressable
                onPress={pickVideoFromGallery}
                className="flex-row items-center p-4 bg-gray-50 rounded-xl mb-3"
              >
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
                  <FolderOpen size={24} color="#3B82F6" />
                </View>
                <View className="ml-4">
                  <Text className="text-gray-800 font-semibold">Choose from Gallery</Text>
                  <Text className="text-gray-500 text-sm">Select video from your device</Text>
                </View>
              </Pressable>

              {/* Paste URL */}
              <View className="p-4 bg-gray-50 rounded-xl">
                <View className="flex-row items-center mb-3">
                  <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
                    <Link2 size={24} color="#66BB6A" />
                  </View>
                  <View className="ml-4">
                    <Text className="text-gray-800 font-semibold">Paste Video URL</Text>
                    <Text className="text-gray-500 text-sm">YouTube, Vimeo, direct link</Text>
                  </View>
                </View>
                <TextInput
                  value={videoUrl}
                  onChangeText={setVideoUrl}
                  placeholder="https://example.com/video.mp4"
                  placeholderTextColor="#9CA3AF"
                  className="bg-white rounded-xl px-4 py-3 text-gray-800 border border-gray-200"
                  autoCapitalize="none"
                  keyboardType="url"
                />
                {videoUrl.trim() && (
                  <Pressable
                    onPress={() => setShowUploadOptions(false)}
                    className="bg-primary py-3 rounded-xl mt-3 items-center"
                  >
                    <Text className="text-white font-semibold">Use This URL</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
