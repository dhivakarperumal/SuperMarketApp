import { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Check, Crown, Calendar, AlertCircle } from "lucide-react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { useSubscription } from "../../../src/hooks/useSubscription";
import { SubscriptionPlanType, BillingCycle } from "../../../src/types";

const planColors: Record<string, string[]> = {
  basic: ["#6B7280", "#9CA3AF"],
  standard: ["#3B82F6", "#60A5FA"],
  premium: ["#1D5A34", "#66BB6A"],
  enterprise: ["#6C5CE7", "#A29BFE"],
};

export default function SubscriptionScreen() {
  const { subscription, plans, loading, createSubscription, updateSubscription, getDaysRemaining, getCurrentPlan } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const currentPlan = getCurrentPlan();
  const daysRemaining = getDaysRemaining();

  const handleSelectPlan = async (planType: SubscriptionPlanType) => {
    setProcessingPlan(planType);
    try {
      if (subscription) {
        await updateSubscription(planType, billingCycle);
        Toast.show({ type: "success", text1: "Plan Updated", text2: "Your subscription has been updated" });
      } else {
        await createSubscription(planType, billingCycle);
        Toast.show({ type: "success", text1: "Subscription Created", text2: "Welcome to your new plan!" });
      }
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message || "Failed to update subscription" });
    } finally {
      setProcessingPlan(null);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9] items-center justify-center" edges={["top","bottom"]}>
        <ActivityIndicator size="large" color="#1D5A34" />
        <Text className="text-gray-500 mt-4">Loading subscription...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]" edges={["top","bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
        >
          <ChevronLeft size={24} color="#374151" />
        </Pressable>
        <View>
          <Text className="text-xl font-bold text-gray-800">Subscription</Text>
          <Text className="text-gray-500 text-sm">Manage your plan</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Current Plan */}
        <View className="bg-white rounded-2xl p-4 mb-6">
          <View className="flex-row items-center mb-3">
            <Crown size={20} color="#F59E0B" />
            <Text className="text-gray-800 font-semibold ml-2">Current Plan</Text>
          </View>

          {subscription ? (
            <>
              <Text className="text-2xl font-bold text-gray-800 capitalize">{currentPlan?.name || subscription.planType}</Text>
              <View className="flex-row items-center mt-2">
                <Calendar size={14} color="#9CA3AF" />
                <Text className="text-gray-500 ml-2">
                  {subscription.status === "active"
                    ? `${daysRemaining} days remaining`
                    : subscription.status === "trial"
                      ? "Trial period"
                      : subscription.status}
                </Text>
              </View>
              <Text className="text-gray-400 text-sm mt-1">
                Renews on {formatDate(subscription.endDate)}
              </Text>

              {/* Current plan limits */}
              <View className="flex-row mt-4 pt-4 border-t border-gray-100">
                <View className="flex-1 items-center">
                  <Text className="text-gray-500 text-xs">Branches</Text>
                  <Text className="text-gray-800 font-semibold">
                    {subscription.maxBranches === -1 ? "Unlimited" : subscription.maxBranches}
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-gray-500 text-xs">Users</Text>
                  <Text className="text-gray-800 font-semibold">
                    {subscription.maxUsers === -1 ? "Unlimited" : subscription.maxUsers}
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-gray-500 text-xs">Products</Text>
                  <Text className="text-gray-800 font-semibold">
                    {subscription.maxProducts === -1 ? "Unlimited" : subscription.maxProducts}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text className="text-2xl font-bold text-gray-800">No Active Plan</Text>
              <View className="flex-row items-center mt-2">
                <AlertCircle size={14} color="#EF4444" />
                <Text className="text-red-500 ml-2">Choose a plan to get started</Text>
              </View>
            </>
          )}
        </View>

        {/* Billing Cycle Toggle */}
        <View className="bg-white rounded-2xl p-4 mb-6">
          <Text className="text-gray-800 font-semibold mb-3">Billing Cycle</Text>
          <View className="flex-row">
            <Pressable
              onPress={() => setBillingCycle("monthly")}
              className={`flex-1 py-3 rounded-xl mr-2 ${billingCycle === "monthly" ? "bg-primary" : "bg-gray-100"}`}
            >
              <Text className={`text-center font-semibold ${billingCycle === "monthly" ? "text-white" : "text-gray-600"}`}>
                Monthly
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setBillingCycle("yearly")}
              className={`flex-1 py-3 rounded-xl ml-2 ${billingCycle === "yearly" ? "bg-primary" : "bg-gray-100"}`}
            >
              <Text className={`text-center font-semibold ${billingCycle === "yearly" ? "text-white" : "text-gray-600"}`}>
                Yearly
              </Text>
              <Text className={`text-center text-xs ${billingCycle === "yearly" ? "text-green-200" : "text-green-600"}`}>
                Save 17%
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Plans */}
        <Text className="text-lg font-bold text-gray-800 mb-4">
          {subscription ? "Change Plan" : "Choose a Plan"}
        </Text>

        {plans.map((plan) => {
          const isCurrentPlan = subscription?.planType === plan.type;
          const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
          const colors = planColors[plan.type] || ["#6B7280", "#9CA3AF"];
          const isPopular = plan.type === "premium";

          return (
            <View
              key={plan.id}
              className="bg-white rounded-2xl mb-4 overflow-hidden"
              style={{ borderWidth: isPopular ? 2 : isCurrentPlan ? 2 : 0, borderColor: isCurrentPlan ? "#3B82F6" : "#1D5A34" }}
            >
              {isPopular && !isCurrentPlan && (
                <View className="bg-primary py-1">
                  <Text className="text-white text-center text-xs font-semibold">MOST POPULAR</Text>
                </View>
              )}
              {isCurrentPlan && (
                <View className="bg-blue-500 py-1">
                  <Text className="text-white text-center text-xs font-semibold">CURRENT PLAN</Text>
                </View>
              )}
              <View className="p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-xl font-bold text-gray-800">{plan.name}</Text>
                  <View className="items-end">
                    <View className="flex-row items-baseline">
                      <Text className="text-2xl font-bold text-gray-800">₹{price.toLocaleString()}</Text>
                      <Text className="text-gray-500 text-sm">/{billingCycle === "monthly" ? "mo" : "yr"}</Text>
                    </View>
                    {billingCycle === "yearly" && (
                      <Text className="text-green-600 text-xs">
                        ₹{(plan.monthlyPrice * 12 - plan.yearlyPrice).toLocaleString()} saved
                      </Text>
                    )}
                  </View>
                </View>

                {/* Limits */}
                <View className="flex-row mb-3 py-2 bg-[#F1F8E9] rounded-xl">
                  <View className="flex-1 items-center">
                    <Text className="text-gray-500 text-xs">Branches</Text>
                    <Text className="text-gray-800 font-semibold text-sm">
                      {plan.maxBranches === -1 ? "∞" : plan.maxBranches}
                    </Text>
                  </View>
                  <View className="flex-1 items-center border-x border-gray-200">
                    <Text className="text-gray-500 text-xs">Users</Text>
                    <Text className="text-gray-800 font-semibold text-sm">
                      {plan.maxUsers === -1 ? "∞" : plan.maxUsers}
                    </Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className="text-gray-500 text-xs">Products</Text>
                    <Text className="text-gray-800 font-semibold text-sm">
                      {plan.maxProducts === -1 ? "∞" : plan.maxProducts}
                    </Text>
                  </View>
                </View>

                {plan.features.map((feature, index) => (
                  <View key={index} className="flex-row items-center mb-2">
                    <Check size={16} color="#1D5A34" />
                    <Text className="text-gray-600 ml-2">{feature}</Text>
                  </View>
                ))}

                <Pressable
                  onPress={() => !isCurrentPlan && handleSelectPlan(plan.type)}
                  disabled={isCurrentPlan || processingPlan !== null}
                  className="mt-4"
                  style={{ opacity: isCurrentPlan ? 0.5 : 1 }}
                >
                  <View}}
                    style={{ borderRadius: 12, padding: 14 }}
                  >
                    <Text className="text-white text-center font-semibold">
                      {processingPlan === plan.type
                        ? "Processing..."
                        : isCurrentPlan
                          ? "Current Plan"
                          : subscription
                            ? "Switch to This Plan"
                            : isPopular
                              ? "Get Started"
                              : "Choose Plan"}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
