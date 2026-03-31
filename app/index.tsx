import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import "./global.css";

const Logo = require("../assets/images/logo.png");

export default function Index() {
  const { user, isLoading, role } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem("onboardingCompleted");
      setOnboardingCompleted(completed === "true");
    } catch (error) {
      setOnboardingCompleted(false);
    }
  };

  if (isLoading || onboardingCompleted === null) {
    return (
      <LinearGradient
        colors={["#1D5A34", "#164829"]}
        style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}
      >
        <View
          className="items-center rounded-[32px] bg-white/15 px-8 py-10"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}
        >
          <Image
            source={Logo}
            style={{ width: 110, height: 110 }}
            resizeMode="contain"
          />
          <Text className="mt-4 text-3xl font-bold text-white">Supermarket</Text>
          <Text className="mt-2 text-center text-sm text-white/80">
            Fresh groceries, quick delivery, effortless shopping.
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (!onboardingCompleted && !user) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  switch (role) {
    case "admin":
      return <Redirect href="/(admin)/(tabs)/dashboard" />;
    case "manager":
      return <Redirect href="/(admin)/(tabs)/dashboard" />;
    case "cashier":
      return <Redirect href="/(admin)/(tabs)/billing" />;
    case "customer":
    default:
      return <Redirect href="/(customer)/(tabs)" />;
  }
}
