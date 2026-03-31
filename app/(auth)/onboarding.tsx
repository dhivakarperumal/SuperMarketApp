import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { CreditCard, ShoppingBag, Truck, ChevronRight } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const Logo = require("../../assets/images/logo.png");

const slides = [
  {
    id: "1",
    icon: ShoppingBag,
    title: "Fresh groceries",
    subtitle: "Picked daily, delivered fast",
    description: "Browse fruits, veggies, and daily essentials in a clean shopping experience.",
    color: "#1D5A34",
    bgColor: "#E9F7E1",
    badge: "Daily fresh",
  },
  {
    id: "2",
    icon: Truck,
    title: "Quick delivery",
    subtitle: "From store to doorstep",
    description: "Track your order and receive it quickly with a smoother, more reliable flow.",
    color: "#F59E0B",
    bgColor: "#FFF4DB",
    badge: "30 min slots",
  },
  {
    id: "3",
    icon: CreditCard,
    title: "Simple checkout",
    subtitle: "Fast, secure, effortless",
    description: "Save favorites, pay easily, and reorder your everyday essentials in seconds.",
    color: "#3B82F6",
    bgColor: "#EAF2FF",
    badge: "Safe payments",
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("onboardingCompleted", "true");
    router.replace("/(auth)/login");
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem("onboardingCompleted", "true");
    router.replace("/(auth)/register");
  };

  const renderSlide = ({ item }: { item: (typeof slides)[0] }) => {
    const IconComponent = item.icon;

    return (
      <View style={{ width }} className="px-6 pt-2">
        <LinearGradient
          colors={[item.bgColor, "#FFFFFF"]}
          style={{
            minHeight: height * 0.5,
            borderRadius: 30,
            padding: 24,
            justifyContent: "space-between",
          }}
        >
          <View>
            <View className="self-start rounded-full bg-white px-3 py-1">
              <Text className="text-xs font-semibold" style={{ color: item.color }}>
                {item.badge}
              </Text>
            </View>

            <View className="mt-6 items-center">
              <View
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  backgroundColor: `${item.color}18`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: item.color,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconComponent size={58} color="#fff" strokeWidth={1.8} />
                </View>
              </View>
            </View>
          </View>

          <View>
            <Text className="text-sm font-semibold" style={{ color: item.color }}>
              {item.subtitle}
            </Text>
            <Text className="mt-2 text-3xl font-bold text-slate-900">{item.title}</Text>
            <Text className="mt-3 text-base leading-6 text-slate-500">
              {item.description}
            </Text>

            <View className="mt-5 flex-row flex-wrap">
              {["Fresh picks", "Smart offers", "Easy reorder"].map((label) => (
                <View key={label} className="mr-2 mt-2 rounded-full bg-white px-3 py-1.5">
                  <Text className="text-xs font-semibold text-slate-600">{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderDots = () => (
    <View className="mb-7 flex-row items-center justify-center">
      {slides.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [10, 30, 10],
          extrapolate: "clamp",
        });

        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            key={index}
            style={{
              width: dotWidth,
              height: 10,
              borderRadius: 999,
              backgroundColor: slides[currentIndex].color,
              opacity: dotOpacity,
              marginHorizontal: 4,
            }}
          />
        );
      })}
    </View>
  );

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-[#F4F8F2]">
      <View className="flex-row items-center justify-between px-6 pt-3">
        <View className="flex-row items-center">
          <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl bg-[#E9F7E1]">
            <Image source={Logo} style={{ width: 28, height: 28 }} resizeMode="contain" />
          </View>
          <View>
            <Text className="text-lg font-bold text-slate-900">Supermarket</Text>
            <Text className="text-xs text-slate-500">Fresh grocery experience</Text>
          </View>
        </View>

        <Pressable onPress={handleSkip} className="rounded-full bg-white px-4 py-2">
          <Text className="text-sm font-semibold text-slate-500">Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      <View className="px-6 pb-8 pt-3">
        {renderDots()}

        {isLastSlide ? (
          <View>
            <Pressable onPress={handleGetStarted} className="overflow-hidden rounded-2xl">
              <LinearGradient
                colors={["#5AC42A", "#3D971B"]}
                style={{ paddingVertical: 16, borderRadius: 16 }}
              >
                <Text className="text-center text-lg font-bold text-white">Get Started</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleSkip}
              className="mt-3 rounded-2xl border border-gray-200 bg-white py-4"
            >
              <Text className="text-center text-base font-semibold text-slate-700">
                I already have an account
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <Pressable onPress={handleSkip} className="px-5 py-4">
              <Text className="text-base font-semibold text-slate-500">Login</Text>
            </Pressable>

            <Pressable
              onPress={handleNext}
              style={{ backgroundColor: slides[currentIndex].color }}
              className="flex-row items-center rounded-2xl px-8 py-4"
            >
              <Text className="mr-2 text-base font-bold text-white">Next</Text>
              <ChevronRight size={20} color="#fff" />
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
