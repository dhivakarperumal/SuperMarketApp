import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  ChevronLeft,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
} from "lucide-react-native";
import { Linking } from "react-native";
import { useReturnRequest } from "../../../src/hooks/useReturns";
import { formatCurrency, formatDate } from "../../../src/utils/formatters";
import { RETURN_REASONS } from "../../../src/types";
import {
  getReturnStatusColor,
  getReturnStatusLabel,
} from "../../../src/utils/returnUtils";
import Toast from "react-native-toast-message";

const statusSteps = [
  { key: "Pending", label: "Pending Review", icon: Clock },
  { key: "Approved", label: "Approved", icon: CheckCircle },
  { key: "Completed", label: "Refund Processed", icon: CheckCircle },
];

export default function ReturnStatusScreen() {
  const { returnId } = useLocalSearchParams<{ returnId: string }>();
  const { returnRequest, loading, error } = useReturnRequest(returnId || null);

  const getStatusIndex = (status: string) => {
    if (status === "Rejected") return -1;
    const index = statusSteps.findIndex((s) => s.key === status);
    return index >= 0 ? index : 0;
  };

  const getDate = (timestamp: any) => {
    if (!timestamp) return new Date();
    if (timestamp?.toDate) return timestamp.toDate();
    if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
    if (typeof timestamp === "string") return new Date(timestamp);
    return new Date();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1D5A34" />
      </SafeAreaView>
    );
  }

  if (error || !returnRequest) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />
      {/* Header */}
      <LinearGradient
        colors={["#1D5A34", "#164829"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
            Return Status
          </Text>
        </View>
      </LinearGradient>
        <View className="flex-1 items-center justify-center">
          <AlertCircle size={64} color="#9CA3AF" />
          <Text className="text-gray-500 mt-4">Return request not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatusIndex = getStatusIndex(returnRequest.status);
  const statusColor = getReturnStatusColor(returnRequest.status);
  const isRejected = returnRequest.status === "Rejected";

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "bottom"]}>
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
            <Text className="text-xl font-bold text-gray-800">Return Status</Text>
            <Text className="text-gray-500 text-sm">
              {returnRequest.returnId || `#${returnRequest.id.slice(0, 8).toUpperCase()}`}
            </Text>
          </View>
        </View>
        <View className={`px-3 py-1 rounded-full ${statusColor.bg}`}>
          <Text className={`text-sm font-medium ${statusColor.text}`}>
            {getReturnStatusLabel(returnRequest.status)}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Status Progress */}
        {!isRejected ? (
          <View className="bg-white m-4 p-4 rounded-xl">
            <Text className="font-bold text-gray-800 mb-4">Return Progress</Text>

            {/* Progress Line */}
            <View className="flex-row items-center justify-between mb-2 px-4">
              {statusSteps.map((_, index) => (
                <View key={`line-${index}`} className="flex-row items-center flex-1">
                  {index > 0 && (
                    <View
                      className={`flex-1 h-1 ${
                        index <= currentStatusIndex ? "bg-orange-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </View>
              ))}
            </View>

            {/* Status Icons */}
            <View className="flex-row items-start justify-between">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const IconComponent = step.icon;

                return (
                  <View key={step.key} className="items-center" style={{ width: 90 }}>
                    <View
                      className={`w-12 h-12 rounded-full items-center justify-center ${
                        isCompleted ? "bg-orange-500" : "bg-gray-200"
                      }`}
                      style={
                        isCurrent
                          ? {
                              shadowColor: "#F97316",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.3,
                              shadowRadius: 4,
                              elevation: 4,
                            }
                          : {}
                      }
                    >
                      <IconComponent size={22} color={isCompleted ? "#fff" : "#9CA3AF"} />
                    </View>
                    <Text
                      className={`text-xs mt-2 text-center ${
                        isCompleted ? "text-orange-500 font-semibold" : "text-gray-400"
                      }`}
                      numberOfLines={2}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View className="bg-red-50 m-4 p-4 rounded-xl">
            <View className="flex-row items-center mb-2">
              <XCircle size={24} color="#EF4444" />
              <Text className="ml-2 font-bold text-red-700 text-lg">
                Return Request Rejected
              </Text>
            </View>
            {returnRequest.adminNotes && (
              <View className="mt-2 p-3 bg-red-100 rounded-lg">
                <Text className="text-red-700 font-medium mb-1">Reason:</Text>
                <Text className="text-red-600">{returnRequest.adminNotes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Request Date */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-4">
          <View className="flex-row items-center">
            <Clock size={20} color="#6B7280" />
            <Text className="ml-3 text-gray-600">
              Requested on {formatDate(getDate(returnRequest.createdAt))}
            </Text>
          </View>
          {returnRequest.processedAt && (
            <View className="flex-row items-center mt-2">
              <CheckCircle size={20} color="#66BB6A" />
              <Text className="ml-3 text-green-600">
                Completed on {formatDate(getDate(returnRequest.processedAt))}
              </Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-4">
          <Text className="font-bold text-gray-800 mb-4">
            Items ({returnRequest.items.length})
          </Text>
          {returnRequest.items.map((item, index) => (
            <View
              key={index}
              className={`py-3 ${
                index < returnRequest.items.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden">
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Package size={20} color="#9CA3AF" />
                    </View>
                  )}
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-800 font-medium" numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {item.selectedWeight ? `${item.selectedWeight} • ` : ""}
                    Returning {item.quantity} of {item.originalQuantity}
                  </Text>
                  <Text className="text-orange-600 text-sm mt-1">
                    {RETURN_REASONS.find((r) => r.value === item.reason)?.label ||
                      item.reason}
                  </Text>
                </View>
                <Text className="font-bold text-gray-800">
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Refund Summary */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-4">
          <Text className="font-bold text-gray-800 mb-3">Refund Summary</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Original Order Total</Text>
            <Text className="font-medium">
              {formatCurrency(returnRequest.originalOrderTotal)}
            </Text>
          </View>
          <View className="flex-row justify-between pt-3 border-t border-gray-100">
            <Text className="text-lg font-bold text-gray-800">
              {returnRequest.status === "Completed" ? "Refunded Amount" : "Expected Refund"}
            </Text>
            <Text className="text-lg font-bold text-orange-500">
              {formatCurrency(returnRequest.refundAmount)}
            </Text>
          </View>
        </View>

        {/* Customer Notes */}
        {returnRequest.customerNotes && (
          <View className="bg-white mx-4 p-4 rounded-xl mb-4">
            <Text className="font-bold text-gray-800 mb-2">Your Notes</Text>
            <Text className="text-gray-600">{returnRequest.customerNotes}</Text>
          </View>
        )}

        {/* Admin Notes (for approved returns) */}
        {returnRequest.status === "Approved" && returnRequest.adminNotes && (
          <View className="bg-blue-50 mx-4 p-4 rounded-xl mb-4">
            <Text className="font-bold text-blue-800 mb-2">Admin Message</Text>
            <Text className="text-blue-700">{returnRequest.adminNotes}</Text>
          </View>
        )}

        {/* Help Section */}
        <View className="bg-white mx-4 p-4 rounded-xl mb-8">
          <Text className="font-bold text-gray-800 mb-2">Need Help?</Text>
          <Text className="text-gray-600 mb-3">
            If you have any questions about your return, please contact our support team.
          </Text>
          <Pressable
            onPress={async () => {
              try {
                const phoneNumber = "tel:+918940450960";
                const canOpen = await Linking.canOpenURL(phoneNumber);
                if (canOpen) {
                  await Linking.openURL(phoneNumber);
                } else {
                  Toast.show({
                    type: "info",
                    text1: "Contact Us",
                    text2: "Call us at: 8940450960",
                  });
                }
              } catch (error) {
                Toast.show({
                  type: "info",
                  text1: "Contact Us",
                  text2: "Call us at: 8940450960",
                });
              }
            }}
            className="flex-row items-center justify-center py-3 bg-primary rounded-xl"
          >
            <Phone size={18} color="#fff" />
            <Text className="ml-2 text-white font-semibold">Contact Support</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
