import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Share,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  ChevronLeft,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  Package,
  Share2,
  AlertCircle,
  Star,
  Clock,
  ChevronRight,
  X,
  Edit3,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
import Toast from "react-native-toast-message";
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../../../src/services/firebase/config";
import { useCart } from "../../../src/context/CartContext";
import { useFavorites } from "../../../src/hooks/useFavorites";
import { useOffers } from "../../../src/context/OfferContext";
import { useAuth } from "../../../src/context/AuthContext";
import { formatCurrency } from "../../../src/utils/formatters";
import { getStockStatus } from "../../../src/utils/stockManager";
import { Product } from "../../../src/types";
// import { WhatsAppOrderButton } from "../../../src/components/whatsapp";

const getValidProductImages = (images: string[] | undefined): string[] => {
  if (!images || images.length === 0) return [];
  return images.filter((img) => {
    if (img.startsWith("data:image/svg")) return false;
    if (img.length < 50) return false;
    return img.startsWith("http") || img.startsWith("data:image/jpeg") || img.startsWith("data:image/png");
  });
};

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

interface RecentProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToCart, cart } = useCart();
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites();
  const { getOfferInfoForProduct } = useOffers();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageListRef = useRef<FlatList>(null);

  // Review Modal States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const isFavorite = favorites.some((f) => f.productId === id);
  const isInCart = cart.some((item) => item.productId === id);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    loadRecentProducts();
  }, [id]);

  useEffect(() => {
    if (product) {
      fetchSimilarProducts();
      saveToRecentlyViewed();
    }
  }, [product]);

  const fetchProduct = async () => {
    if (!id) return;
    try {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const productData = { id: docSnap.id, ...docSnap.data() } as Product;
        setProduct(productData);
        if (productData.weights && productData.weights.length > 0) {
          setSelectedWeight(productData.weights[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!id) return;
    try {
      const reviewsRef = collection(db, "products", id, "reviews");
      const q = query(reviewsRef, orderBy("createdAt", "desc"), limit(5));
      const snapshot = await getDocs(q);
      const reviewsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Review[];
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const fetchSimilarProducts = async () => {
    if (!product?.category) return;
    try {
      const productsRef = collection(db, "products");
      const q = query(productsRef, where("category", "==", product.category), limit(8));
      const snapshot = await getDocs(q);
      const products = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Product))
        .filter((p) => p.id !== id);
      setSimilarProducts(products.slice(0, 6));
    } catch (error) {
      console.error("Error fetching similar products:", error);
    }
  };

  const loadRecentProducts = async () => {
    try {
      const recent = await AsyncStorage.getItem("recentlyViewed");
      if (recent) {
        const parsed = JSON.parse(recent) as RecentProduct[];
        setRecentProducts(parsed.filter((p) => p.id !== id).slice(0, 6));
      }
    } catch (error) {
      console.error("Error loading recent products:", error);
    }
  };

  const saveToRecentlyViewed = async () => {
    if (!product) return;
    try {
      const recent = await AsyncStorage.getItem("recentlyViewed");
      let recentList: RecentProduct[] = recent ? JSON.parse(recent) : [];
      recentList = recentList.filter((p) => p.id !== product.id);

      const priceValues = product.prices ? Object.values(product.prices) : [];
      const price = priceValues.length > 0 ? Number(priceValues[0]) : Number(product.price) || 0;
      const validImages = getValidProductImages(product.images);

      recentList.unshift({
        id: product.id,
        name: product.name,
        image: validImages[0] || "",
        price: price,
        category: product.category,
      });
      recentList = recentList.slice(0, 10);
      await AsyncStorage.setItem("recentlyViewed", JSON.stringify(recentList));
    } catch (error) {
      console.error("Error saving to recent:", error);
    }
  };

  const getPrice = () => {
    if (!product) return 0;
    const priceValues = product.prices ? Object.values(product.prices) : [];
    if (priceValues.length > 0 && selectedWeight && product.prices) {
      return Number(product.prices[selectedWeight]) || Number(priceValues[0]) || 0;
    }
    if (priceValues.length > 0) {
      return Number(priceValues[0]) || 0;
    }
    return Number(product.price) || 0;
  };

  const getOfferInfo = () => {
    if (!product) return null;
    return getOfferInfoForProduct(product.id, product.categoryId, getPrice());
  };

  const offerInfo = product ? getOfferInfo() : null;
  const stockStatus = product ? getStockStatus(product.stock || 0, product.stockUnit || "pcs") : null;
  const maxQuantity = product?.stock || 0;

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    return total / reviews.length;
  };

  const handleAddToCart = async () => {
    if (!product || addingToCart) return;

    if ((product.stock || 0) <= 0) {
      Toast.show({
        type: "error",
        text1: "Out of Stock",
        text2: "This product is currently unavailable",
      });
      return;
    }

    setAddingToCart(true);

    const validImages = getValidProductImages(product.images);
    const result = await addToCart({
      productId: product.id,
      name: product.name,
      price: getPrice(),
      image: validImages[0] || "",
      selectedWeight: selectedWeight || undefined,
      quantity,
      weights: product.weights || [],
      prices: product.prices || {},
    });

    setAddingToCart(false);

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Added to Cart",
        text2: `${quantity} x ${product.name}`,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Cannot Add",
        text2: result.message,
      });
    }
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Check out ${product.name} - ${formatCurrency(getPrice())}`,
        title: product.name,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!product) return;
    if (isFavorite) {
      const fav = favorites.find((f) => f.productId === id);
      if (fav) await removeFromFavorites(fav.id);
      Toast.show({ type: "info", text1: "Removed from Favorites" });
    } else {
      const validImages = getValidProductImages(product.images);
      await addToFavorites({
        productId: product.id,
        name: product.name,
        price: getPrice(),
        image: validImages[0],
        selectedWeight: selectedWeight || undefined,
      });
      Toast.show({ type: "success", text1: "Added to Favorites" });
    }
  };

  const handleIncreaseQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    } else {
      Toast.show({
        type: "info",
        text1: "Maximum Reached",
        text2: `Only ${maxQuantity} available`,
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!id || !user) {
      Toast.show({
        type: "error",
        text1: "Please login",
        text2: "You need to login to submit a review",
      });
      return;
    }

    if (reviewComment.trim().length < 3) {
      Toast.show({
        type: "error",
        text1: "Review too short",
        text2: "Please write at least a few words",
      });
      return;
    }

    setSubmittingReview(true);

    try {
      const reviewsRef = collection(db, "products", id, "reviews");
      await addDoc(reviewsRef, {
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Customer",
        rating: reviewRating,
        comment: reviewComment.trim(),
        createdAt: serverTimestamp(),
      });

      Toast.show({
        type: "success",
        text1: "Review Submitted",
        text2: "Thank you for your feedback!",
      });

      // Reset form and close modal
      setReviewRating(5);
      setReviewComment("");
      setShowReviewModal(false);

      // Refresh reviews
      fetchReviews();
    } catch (error) {
      console.error("Error submitting review:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to submit review. Please try again.",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatReviewDate = (createdAt: any) => {
    if (!createdAt) return "";
    const date = createdAt?.toDate?.() || new Date(createdAt?.seconds * 1000) || new Date();
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const renderStars = (rating: number) => (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          color="#F59E0B"
          fill={star <= rating ? "#F59E0B" : "transparent"}
        />
      ))}
    </View>
  );

  const renderProductCard = (item: Product | RecentProduct) => {
    const priceValues = "prices" in item && item.prices ? Object.values(item.prices) : [];
    const price = priceValues.length > 0 ? Number(priceValues[0]) : Number(item.price) || 0;
    const rawImage = "images" in item ? item.images : item.image ? [item.image] : [];
    const cardValidImages = getValidProductImages(Array.isArray(rawImage) ? rawImage : [rawImage]);
    const cardImage = cardValidImages[0] || null;
    const itemOfferInfo = "id" in item ? getOfferInfoForProduct(item.id, ("categoryId" in item ? item.categoryId : undefined) || "", price) : null;

    return (
      <Pressable
        key={item.id}
        onPress={() => router.push(`/(customer)/product/${item.id}`)}
        className="mr-3 bg-white rounded-2xl overflow-hidden border border-gray-100"
        style={{ width: 140 }}
      >
        <View className="h-32 bg-gray-50 items-center justify-center p-2">
          {cardImage ? (
            <Image source={{ uri: cardImage }} className="w-full h-full" resizeMode="contain" />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Package size={32} color="#D1D5DB" />
            </View>
          )}
          {itemOfferInfo?.hasOffer && (
            <View className="absolute top-2 left-2 bg-red-500 px-2 py-0.5 rounded">
              <Text className="text-white font-bold text-xs">{itemOfferInfo.discountPercentage}%</Text>
            </View>
          )}
        </View>
        <View className="p-2.5">
          <Text className="text-gray-800 font-medium text-sm" numberOfLines={2}>
            {item.name}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-primary font-bold">
              {formatCurrency(itemOfferInfo?.hasOffer ? itemOfferInfo.effectivePrice : price)}
            </Text>
            {itemOfferInfo?.hasOffer && (
              <Text className="text-gray-400 text-xs line-through ml-1">
                {formatCurrency(price)}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  // Loading State
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D5A34" />
          <Text className="text-gray-500 mt-4">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Not Found State
  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <Pressable onPress={() => router.back()} className="p-2">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <AlertCircle size={48} color="#EF4444" />
          <Text className="text-xl font-bold text-gray-800 mt-4">Product Not Found</Text>
          <Text className="text-gray-500 text-center mt-2">
            This product doesn't exist or has been removed.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 bg-primary px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const validImages = getValidProductImages(product.images);
  const currentPrice = offerInfo?.hasOffer ? offerInfo.effectivePrice : getPrice();
  const avgRating = getAverageRating();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />
      {/* Header */}
      <LinearGradient
        colors={["#1D5A34", "#164829"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </Pressable>
          <Text className="flex-1 text-center font-bold text-white text-lg" numberOfLines={1}>
            Product Details
          </Text>
          <View className="flex-row" style={{ gap: 10 }}>
            <Pressable
              onPress={handleShare}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Share2 size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={handleToggleFavorite}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Heart
                size={20}
                color={isFavorite ? "#EF4444" : "#FFFFFF"}
                fill={isFavorite ? "#EF4444" : "transparent"}
              />
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <View className="bg-white" style={{ height: 320 }}>
          {validImages.length > 0 ? (
            <>
              <FlatList
                ref={imageListRef}
                data={validImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setCurrentImageIndex(index);
                }}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                  <View
                    style={{ width: SCREEN_WIDTH, height: 280 }}
                    className="items-center justify-center"
                  >
                    <Image
                      source={{ uri: item }}
                      style={{ width: SCREEN_WIDTH, height: 280 }}
                      resizeMode="contain"
                    />
                  </View>
                )}
              />
              {/* Image Indicators */}
              <View className="flex-row justify-center items-center py-3" style={{ gap: 6 }}>
                {validImages.length > 1 ? (
                  validImages.map((_, index) => (
                    <Pressable
                      key={index}
                      onPress={() => {
                        imageListRef.current?.scrollToIndex({ index, animated: true });
                        setCurrentImageIndex(index);
                      }}
                    >
                      <View
                        className={`rounded-full ${currentImageIndex === index ? "bg-primary" : "bg-gray-300"}`}
                        style={{
                          width: currentImageIndex === index ? 20 : 8,
                          height: 8,
                        }}
                      />
                    </Pressable>
                  ))
                ) : (
                  <View className="h-2" />
                )}
              </View>
            </>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Package size={64} color="#D1D5DB" />
              <Text className="text-gray-400 mt-2">No Image</Text>
            </View>
          )}

          {/* Offer Badge */}
          {offerInfo?.hasOffer && (
            <View className="absolute top-3 left-3 bg-red-500 px-3 py-1.5 rounded-lg">
              <Text className="text-white font-bold text-sm">{offerInfo.discountPercentage}% OFF</Text>
            </View>
          )}

          {/* Image Counter */}
          {validImages.length > 1 && (
            <View className="absolute top-3 right-3 bg-black/50 px-2.5 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">
                {currentImageIndex + 1}/{validImages.length}
              </Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="bg-white p-4 border-t border-gray-100">
          {/* Category */}
          <View className="bg-primary/10 self-start px-3 py-1.5 rounded-full mb-3">
            <Text className="text-primary font-medium text-sm">{product.category}</Text>
          </View>

          {/* Name */}
          <Text className="text-2xl font-bold text-gray-900 mb-2">{product.name}</Text>

          {/* Rating */}
          {reviews.length > 0 && (
            <View className="flex-row items-center mb-3">
              {renderStars(Math.round(avgRating))}
              <Text className="text-gray-600 ml-2 text-sm">
                {avgRating.toFixed(1)} ({reviews.length} reviews)
              </Text>
            </View>
          )}

          {/* Price */}
          <View className="flex-row items-baseline mb-3">
            <Text className="text-3xl font-bold text-primary">
              {formatCurrency(currentPrice)}
            </Text>
            {offerInfo?.hasOffer && (
              <Text className="ml-2 text-lg text-gray-400 line-through">
                {formatCurrency(offerInfo.originalPrice)}
              </Text>
            )}
          </View>

          {/* Offer Banner */}
          {offerInfo?.hasOffer && (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="bg-red-500 px-2 py-1 rounded-lg mr-2">
                    <Text className="text-white font-bold text-sm">{offerInfo.discountPercentage}% OFF</Text>
                  </View>
                  <View>
                    <Text className="text-red-600 font-semibold">{offerInfo.offerName || "Special Offer"}</Text>
                    <Text className="text-gray-500 text-xs">Limited time offer</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-green-600 font-bold">
                    Save {formatCurrency(offerInfo.originalPrice - offerInfo.effectivePrice)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Stock Status */}
          {stockStatus && (
            <View
              className="flex-row items-center p-3 rounded-lg mb-4"
              style={{
                backgroundColor: stockStatus.isOutOfStock
                  ? "#FEE2E2"
                  : stockStatus.isLowStock
                  ? "#FEF3C7"
                  : "#E8F5E9",
              }}
            >
              <Text
                className="font-semibold"
                style={{
                  color: stockStatus.isOutOfStock
                    ? "#DC2626"
                    : stockStatus.isLowStock
                    ? "#D97706"
                    : "#1D5A34",
                }}
              >
                {stockStatus.label}
              </Text>
              {stockStatus.isLowStock && !stockStatus.isOutOfStock && (
                <Text className="text-amber-600 ml-2">Only {maxQuantity} left</Text>
              )}
            </View>
          )}

          {/* Weight Selection */}
          {product.weights && product.weights.length > 0 && (
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">Select Size</Text>
              <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                {product.weights.map((weight) => (
                  <Pressable
                    key={weight}
                    onPress={() => setSelectedWeight(weight)}
                    className={`px-4 py-2.5 rounded-xl border-2 ${
                      selectedWeight === weight
                        ? "border-primary bg-primary/5"
                        : "border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        selectedWeight === weight ? "text-primary" : "text-gray-700"
                      }`}
                    >
                      {weight}
                    </Text>
                    {product.prices?.[weight] && (
                      <Text className="text-xs text-gray-500 mt-0.5">
                        {formatCurrency(Number(product.prices[weight]))}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Quantity Selector */}
          {!stockStatus?.isOutOfStock && (
            <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-xl mb-4">
              <Text className="text-gray-700 font-semibold">Quantity</Text>
              <View className="flex-row items-center bg-white rounded-xl border border-gray-200">
                <Pressable
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 items-center justify-center"
                  disabled={quantity <= 1}
                >
                  <Minus size={18} color={quantity <= 1 ? "#D1D5DB" : "#374151"} />
                </Pressable>
                <Text className="w-12 text-center font-bold text-lg">{quantity}</Text>
                <Pressable
                  onPress={handleIncreaseQuantity}
                  className="w-10 h-10 items-center justify-center"
                  disabled={quantity >= maxQuantity}
                >
                  <Plus size={18} color={quantity >= maxQuantity ? "#D1D5DB" : "#374151"} />
                </Pressable>
              </View>
            </View>
          )}

          {/* Description */}
          {product.description && (
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">Description</Text>
              <Text className="text-gray-600 leading-6">{product.description}</Text>
            </View>
          )}

          {/* In Cart Badge */}
          {isInCart && (
            <View className="flex-row items-center bg-green-50 p-3 rounded-lg">
              <ShoppingCart size={18} color="#66BB6A" />
              <Text className="text-green-600 font-medium ml-2">Already in your cart</Text>
            </View>
          )}
        </View>

        {/* Reviews Section */}
        <View className="bg-gray-50 p-4 mt-3 mx-4 rounded-2xl">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Reviews</Text>
            <Pressable
              onPress={() => setShowReviewModal(true)}
              className="flex-row items-center bg-primary/10 px-3 py-2 rounded-lg"
            >
              <Edit3 size={14} color="#1D5A34" />
              <Text className="text-primary font-semibold text-sm ml-1">Write Review</Text>
            </Pressable>
          </View>

          {/* Rating Summary */}
          {reviews.length > 0 && (
            <View className="flex-row items-center bg-amber-50 p-3 rounded-xl mb-4">
              <Star size={24} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-2xl font-bold text-gray-900 ml-2">{avgRating.toFixed(1)}</Text>
              <Text className="text-gray-500 ml-2">({reviews.length} reviews)</Text>
            </View>
          )}

          {reviews.length === 0 ? (
            <View className="items-center py-6 bg-gray-50 rounded-xl">
              <Star size={32} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">No reviews yet</Text>
              <Text className="text-gray-400 text-sm mt-1">Be the first to review!</Text>
            </View>
          ) : (
            <View>
              {reviews.map((review, index) => (
                <View
                  key={review.id}
                  className={`py-3 ${index < reviews.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 bg-primary/10 rounded-full items-center justify-center">
                        <Text className="text-primary font-bold">
                          {(review.userName || "C")[0].toUpperCase()}
                        </Text>
                      </View>
                      <Text className="font-semibold text-gray-800 ml-2">
                        {review.userName || "Customer"}
                      </Text>
                    </View>
                    <Text className="text-gray-400 text-xs">{formatReviewDate(review.createdAt)}</Text>
                  </View>
                  <View className="flex-row items-center mb-2">
                    {renderStars(review.rating)}
                  </View>
                  {review.comment && (
                    <Text className="text-gray-600 leading-5">{review.comment}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <View className="p-4 mt-3">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-gray-900">Similar Products</Text>
              <Pressable
                onPress={() => router.push(`/(customer)/(tabs)/shop?category=${product.categoryId || product.category}`)}
                className="flex-row items-center"
              >
                <Text className="text-primary font-medium text-sm">See All</Text>
                <ChevronRight size={16} color="#1D5A34" />
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {similarProducts.map((item) => renderProductCard(item))}
            </ScrollView>
          </View>
        )}

        {/* Recently Viewed */}
        {recentProducts.length > 0 && (
          <View className="p-4 mt-2">
            <View className="flex-row items-center mb-3">
              <Clock size={18} color="#6B7280" />
              <Text className="text-lg font-bold text-gray-900 ml-2">Recently Viewed</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentProducts.map((item) => renderProductCard(item))}
            </ScrollView>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 100 + insets.bottom }} />
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-gray-900">Write a Review</Text>
                <Pressable
                  onPress={() => setShowReviewModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                >
                  <X size={18} color="#6B7280" />
                </Pressable>
              </View>

              <View className="p-4">
                {/* Rating Selection */}
                <Text className="text-gray-700 font-semibold mb-3">Your Rating</Text>
                <View className="flex-row justify-center mb-6" style={{ gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable key={star} onPress={() => setReviewRating(star)}>
                      <Star
                        size={36}
                        color="#F59E0B"
                        fill={star <= reviewRating ? "#F59E0B" : "transparent"}
                      />
                    </Pressable>
                  ))}
                </View>

                {/* Review Comment */}
                <Text className="text-gray-700 font-semibold mb-2">Your Review</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 min-h-[120px]"
                  placeholder="Share your experience with this product..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  maxLength={500}
                />
                <Text className="text-gray-400 text-xs text-right mt-1">
                  {reviewComment.length}/500
                </Text>

                {/* Submit Button */}
                <Pressable
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                  className={`mt-4 py-4 rounded-xl items-center ${
                    submittingReview ? "bg-gray-300" : "bg-primary"
                  }`}
                >
                  {submittingReview ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-base">Submit Review</Text>
                  )}
                </Pressable>
              </View>

              {/* Safe area padding */}
              <View style={{ height: 20 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bottom Action Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-gray-200 px-4 pt-4 bg-white"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="flex-row items-center">
          {/* Total */}
          <View className="flex-1">
            <Text className="text-gray-500 text-sm">Total</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {formatCurrency(currentPrice * quantity)}
            </Text>
            {offerInfo?.hasOffer && quantity > 0 && (
              <Text className="text-green-600 text-xs font-medium">
                Saving {formatCurrency((offerInfo.originalPrice - offerInfo.effectivePrice) * quantity)}
              </Text>
            )}
          </View>

          {stockStatus?.isOutOfStock ? (
            <View className="bg-gray-200 px-6 py-3.5 rounded-xl">
              <Text className="text-gray-500 font-semibold">Out of Stock</Text>
            </View>
          ) : (
            <View className="flex-row" style={{ gap: 10 }}>
              {/* <WhatsAppOrderButton
                product={{
                  productId: product.id,
                  name: product.name,
                  price: currentPrice,
                  quantity,
                  selectedWeight: selectedWeight || undefined,
                  image: validImages[0],
                }}
                variant="secondary"
                size="large"
                iconOnly
                style={{ borderRadius: 12, width: 50, height: 50 }}
              /> */}
              <Pressable
                onPress={handleAddToCart}
                disabled={addingToCart}
                className="flex-row items-center bg-primary px-6 py-3.5 rounded-xl"
              >
                {addingToCart ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <ShoppingCart size={20} color="#fff" />
                    <Text className="text-white font-bold ml-2">Add to Cart</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
