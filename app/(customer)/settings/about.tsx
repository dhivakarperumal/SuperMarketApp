import { View, Text, Pressable, ScrollView, Image, Linking, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Heart,
} from "lucide-react-native";
import { router } from "expo-router";

const Logo = require("../../../assets/images/logo.png");

export default function AboutScreen() {
  const handleLink = (url: string) => {
    Linking.openURL(url);
  };

  const SocialButton = ({ icon: Icon, color, onPress }: any) => (
    <Pressable
      onPress={onPress}
      className="w-12 h-12 rounded-full items-center justify-center mx-2"
      style={{ backgroundColor: color + "15" }}
    >
      <Icon size={22} color={color} />
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      {/* Header */}
      <LinearGradient
        colors={["#2E7D32", "#1B5E20"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' }}>About App</Text>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* App Info Card */}
        <View
          className="bg-white rounded-xl p-6 items-center mb-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Image
            source={Logo}
            style={{ width: 90, height: 90, marginBottom: 16 }}
            resizeMode="contain"
          />
          <Text className="text-2xl font-bold text-gray-800">
            Dhiva Deva Super Markets
          </Text>
          <Text className="text-gray-500 mt-1">Version 1.0.0</Text>
          <View className="flex-row items-center mt-2">
            <Text className="text-gray-500 text-sm">Made with</Text>
            <Heart size={14} color="#EF4444" fill="#EF4444" className="mx-1" />
            <Text className="text-gray-500 text-sm">in India</Text>
          </View>
        </View>

        {/* Description */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-2">About Us</Text>
          <Text className="text-gray-600 leading-6">
            Dhiva Deva Super Markets is your one-stop destination for fresh
            groceries, daily essentials, and quality products. We are committed
            to providing the best shopping experience with doorstep delivery
            and competitive prices.
          </Text>
          <Text className="text-gray-600 leading-6 mt-3">
            Our mission is to make grocery shopping convenient, affordable, and
            enjoyable for everyone. We source directly from farmers and trusted
            suppliers to ensure freshness and quality.
          </Text>
        </View>

        {/* Contact Info */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Contact Us
          </Text>

          <Pressable
            onPress={() => handleLink("mailto:support@dhivadeva.com")}
            className="flex-row items-center py-3"
          >
            <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
              <Mail size={20} color="#2E7D32" />
            </View>
            <View className="ml-3">
              <Text className="text-gray-500 text-xs">Email</Text>
              <Text className="text-gray-800 font-medium">
                support@dhivadeva.com
              </Text>
            </View>
          </Pressable>

          <View className="h-px bg-gray-100 ml-12" />

          <Pressable
            onPress={() => handleLink("tel:+918940450960")}
            className="flex-row items-center py-3"
          >
            <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
              <Phone size={20} color="#2E7D32" />
            </View>
            <View className="ml-3">
              <Text className="text-gray-500 text-xs">Phone</Text>
              <Text className="text-gray-800 font-medium">+91 89404 50960</Text>
            </View>
          </Pressable>

          <View className="h-px bg-gray-100 ml-12" />

          <Pressable
            onPress={() => handleLink("https://dhivadeva.com")}
            className="flex-row items-center py-3"
          >
            <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
              <Globe size={20} color="#2E7D32" />
            </View>
            <View className="ml-3">
              <Text className="text-gray-500 text-xs">Website</Text>
              <Text className="text-gray-800 font-medium">www.dhivadeva.com</Text>
            </View>
          </Pressable>

          <View className="h-px bg-gray-100 ml-12" />

          <View className="flex-row items-center py-3">
            <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
              <MapPin size={20} color="#2E7D32" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-xs">Address</Text>
              <Text className="text-gray-800 font-medium">
                123, Main Street, Chennai, Tamil Nadu - 600001
              </Text>
            </View>
          </View>
        </View>

        {/* Social Media */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3 text-center">
            Follow Us
          </Text>
          <View className="flex-row justify-center">
            <SocialButton
              icon={Instagram}
              color="#E4405F"
              onPress={() => handleLink("https://instagram.com")}
            />
            <SocialButton
              icon={Facebook}
              color="#1877F2"
              onPress={() => handleLink("https://facebook.com")}
            />
            <SocialButton
              icon={Twitter}
              color="#1DA1F2"
              onPress={() => handleLink("https://twitter.com")}
            />
          </View>
        </View>

        {/* Legal Links */}
        <View className="bg-white rounded-xl overflow-hidden mb-8">
          <Pressable
            onPress={() => router.push("/(customer)/policies/privacy")}
            className="p-4 active:bg-gray-50"
          >
            <Text className="text-primary font-semibold text-center">
              Privacy Policy
            </Text>
          </Pressable>
          <View className="h-px bg-gray-100" />
          <Pressable
            onPress={() => router.push("/(customer)/policies/terms")}
            className="p-4 active:bg-gray-50"
          >
            <Text className="text-primary font-semibold text-center">
              Terms & Conditions
            </Text>
          </Pressable>
        </View>

        {/* Copyright */}
        <Text className="text-gray-400 text-center text-sm mb-4">
          © 2026 Dhiva Deva Super Markets. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
