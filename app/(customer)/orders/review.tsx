import { router, useLocalSearchParams } from "expo-router";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { ChevronLeft, ShoppingBag, Star } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    StatusBar,
    Text,
    TextInput,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAuth } from "../../../src/context/AuthContext";
import { db } from "../../../src/services/firebase/config";

export default function ReviewScreen() {
  const { productId, productName, productImage, orderId } = useLocalSearchParams<{
    productId: string;
    productName: string;
    productImage: string;
    orderId: string;
  }>();

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [focusedInput, setFocusedInput] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select a rating",
      });
      return;
    }

    if (!review.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please write a review",
      });
      return;
    }

    if (!user) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please login to submit a review",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if user already reviewed this product for this order
      const existingReviewQuery = query(
        collection(db, "reviews"),
        where("userId", "==", user.uid),
        where("productId", "==", productId),
        where("orderId", "==", orderId)
      );
      const existingReviews = await getDocs(existingReviewQuery);

      if (!existingReviews.empty) {
        Toast.show({
          type: "error",
          text1: "Already Reviewed",
          text2: "You have already reviewed this product for this order",
        });
        setLoading(false);
        return;
      }

      // Add review to Firestore
      await addDoc(collection(db, "reviews"), {
        productId,
        productName,
        orderId,
        userId: user.uid,
        userName: user.displayName || "Customer",
        userPhoto: user.photoURL || "",
        rating,
        review: review.trim(),
        createdAt: new Date(),
      });

      Toast.show({
        type: "success",
        text1: "Review Submitted",
        text2: "Thank you for your feedback!",
      });
      router.back();
    } catch (error) {
      console.error("Error submitting review:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to submit review. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View className="flex-row justify-center my-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => setRating(star)}
            className="mx-2"
          >
            <Star
              size={40}
              color={star <= rating ? "#F59E0B" : "#D1D5DB"}
              fill={star <= rating ? "#F59E0B" : "transparent"}
            />
          </Pressable>
        ))}
      </View>
    );
  };

  const getRatingText = () => {
    switch (rating) {
      case 1:
        return "Poor";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Very Good";
      case 5:
        return "Excellent";
      default:
        return "Tap to rate";
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />
      {/* Header */}
      <View
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="text-xl font-bold text-white">
            Write a Review
          </Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16 }}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          {/* Product Info */}
          <View
            className="bg-white rounded-xl p-4 mb-4 flex-row items-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
              {productImage ? (
                <Image
                  source={{ uri: productImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <ShoppingBag size={24} color="#9CA3AF" />
                </View>
              )}
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-gray-800 font-semibold text-base" numberOfLines={2}>
                {productName}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                Share your experience
              </Text>
            </View>
          </View>

          {/* Rating Section */}
          <View
            className="bg-white rounded-xl p-4 mb-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text className="text-gray-800 font-bold text-center mb-2">
              How would you rate this product?
            </Text>
            {renderStars()}
            <Text
              className={`text-center font-semibold ${
                rating > 0 ? "text-yellow-600" : "text-gray-400"
              }`}
            >
              {getRatingText()}
            </Text>
          </View>

          {/* Review Text */}
          <View
            className="bg-white rounded-xl p-4 mb-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text className="text-gray-800 font-bold mb-3">
              Write your review
            </Text>
            <View
              className={`rounded-xl bg-[#F1F8E9] ${
                focusedInput
                  ? "border-2 border-primary"
                  : "border border-gray-200"
              }`}
            >
              <TextInput
                value={review}
                onChangeText={setReview}
                placeholder="Tell us about your experience with this product. What did you like or dislike?"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                className="p-4 text-gray-800"
                style={{
                  fontSize: 15,
                  minHeight: 150,
                  textAlignVertical: "top",
                }}
              />
            </View>
            <Text className="text-gray-400 text-xs mt-2 text-right">
              {review.length}/500 characters
            </Text>
          </View>

          {/* Tips */}
          <View className="bg-yellow-50 rounded-xl p-4 mb-4">
            <Text className="text-yellow-800 font-semibold mb-2">
              Tips for a helpful review:
            </Text>
            <Text className="text-yellow-700 text-sm leading-5">
              • Describe the product quality and freshness{"\n"}
              • Mention if it met your expectations{"\n"}
              • Share any tips for other buyers{"\n"}
              • Be honest and constructive
            </Text>
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="rounded-xl overflow-hidden mb-6"
            style={{
              height: 52,
              backgroundColor: "#1D5A34",
              shadowColor: "#1D5A34",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <View className="flex-1 flex-row items-center justify-center">
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Star size={20} color="#fff" />
                  <Text className="text-white font-bold text-base ml-2">
                    Submit Review
                  </Text>
                </>
              )}
            </View>
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
