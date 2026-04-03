import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Switch,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  ChevronLeft,
  User,
  Phone,
  MapPin,
  Building2,
  Map,
  Hash,
  Home,
  Briefcase,
  MapPinned,
  CheckCircle,
  Save,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAddresses } from "../../../src/hooks/useAddresses";
import Toast from "react-native-toast-message";

const addressLabels = [
  { id: "home", label: "Home", icon: Home },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "other", label: "Other", icon: MapPinned },
];

export default function EditAddressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addresses, updateAddress, loading: addressesLoading } = useAddresses();
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("home");
  const [isDefault, setIsDefault] = useState(false);

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  // Load existing address data
  useEffect(() => {
    if (id && addresses.length > 0) {
      const existingAddress = addresses.find((addr) => addr.id === id);
      if (existingAddress) {
        setFirstname(existingAddress.firstname);
        setLastname(existingAddress.lastname);
        setPhone(existingAddress.phone);
        setAddress(existingAddress.address);
        setCity(existingAddress.city);
        setState(existingAddress.state);
        setZip(existingAddress.zip);
        setSelectedLabel(existingAddress.label?.toLowerCase() || "home");
        setIsDefault(existingAddress.isDefault || false);
      }
    }
  }, [id, addresses]);

  const handleSubmit = async () => {
    if (!firstname || !lastname || !phone || !address || !city || !state || !zip) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please fill in all required fields",
      });
      return;
    }

    if (phone.length < 10) {
      Toast.show({
        type: "error",
        text1: "Invalid Phone",
        text2: "Please enter a valid 10-digit phone number",
      });
      return;
    }

    if (zip.length < 6) {
      Toast.show({
        type: "error",
        text1: "Invalid PIN Code",
        text2: "Please enter a valid 6-digit PIN code",
      });
      return;
    }

    if (!id) return;

    setLoading(true);
    try {
      await updateAddress(id, {
        firstname,
        lastname,
        phone,
        address,
        city,
        state,
        zip,
        label: selectedLabel.charAt(0).toUpperCase() + selectedLabel.slice(1),
        isDefault: isDefault,
      });
      Toast.show({
        type: "success",
        text1: "Address Updated",
        text2: "Your address has been updated successfully",
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update address. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (addressesLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9] items-center justify-center">
        <ActivityIndicator size="large" color="#1D5A34" />
        <Text className="text-gray-500 mt-4">Loading address...</Text>
      </SafeAreaView>
    );
  }

  const currentAddress = addresses.find((addr) => addr.id === id);

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />
      {/* Header */}
      <View}}
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
            Edit Address
          </Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          {/* Address Label */}
          <View className="mb-5">
            <Text className="text-gray-700 text-sm font-semibold mb-2.5 ml-1">
              Address Type
            </Text>
            <View className="flex-row">
              {addressLabels.map((item) => {
                const isSelected = selectedLabel === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedLabel(item.id)}
                    className={`flex-1 flex-row items-center justify-center py-3.5 rounded-xl mr-2 ${
                      isSelected
                        ? "bg-primary"
                        : "bg-white border border-gray-200"
                    }`}
                    style={item.id === "other" ? { marginRight: 0 } : {}}
                  >
                    <item.icon
                      size={18}
                      color={isSelected ? "#fff" : "#6B7280"}
                    />
                    <Text
                      className={`ml-2 font-semibold ${
                        isSelected ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Section Title */}
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 ml-1">
            Contact Information
          </Text>

          {/* Name Row */}
          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <Text className="text-gray-700 text-sm font-semibold mb-2 ml-1">
                First Name <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center rounded-xl px-4 bg-white border border-gray-200 h-[52px]">
                <User size={18} color="#9CA3AF" />
                <TextInput
                  value={firstname}
                  onChangeText={setFirstname}
                  placeholder="John"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  style={{ flex: 1, marginLeft: 12, fontSize: 15, color: "#1F2937" }}
                />
              </View>
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-gray-700 text-sm font-semibold mb-2 ml-1">
                Last Name <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center rounded-xl px-4 bg-white border border-gray-200 h-[52px]">
                <User size={18} color="#9CA3AF" />
                <TextInput
                  value={lastname}
                  onChangeText={setLastname}
                  placeholder="Doe"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  style={{ flex: 1, marginLeft: 12, fontSize: 15, color: "#1F2937" }}
                />
              </View>
            </View>
          </View>

          {/* Phone */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-semibold mb-2 ml-1">
              Phone Number <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row items-center rounded-xl px-4 bg-white border border-gray-200 h-[52px]">
              <Phone size={18} color="#9CA3AF" />
              <TextInput
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ""))}
                placeholder="8940450960"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
                style={{ flex: 1, marginLeft: 12, fontSize: 15, color: "#1F2937" }}
              />
            </View>
          </View>

          {/* Section Title */}
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 ml-1 mt-2">
            Address Details
          </Text>

          {/* Full Address */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-semibold mb-2 ml-1">
              Full Address <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row rounded-xl px-4 bg-white border border-gray-200" style={{ minHeight: 90, alignItems: "flex-start" }}>
              <View style={{ marginTop: 16 }}>
                <MapPin size={18} color="#9CA3AF" />
              </View>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="House/Flat No, Building, Street, Area"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                style={{ flex: 1, marginLeft: 12, fontSize: 15, color: "#1F2937", height: 70, textAlignVertical: "top", paddingTop: 14 }}
              />
            </View>
          </View>

          {/* City & State Row */}
          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <Text className="text-gray-700 text-sm font-semibold mb-2 ml-1">
                City <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center rounded-xl px-4 bg-white border border-gray-200 h-[52px]">
                <Building2 size={18} color="#9CA3AF" />
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="Chennai"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  style={{ flex: 1, marginLeft: 12, fontSize: 15, color: "#1F2937" }}
                />
              </View>
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-gray-700 text-sm font-semibold mb-2 ml-1">
                State <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center rounded-xl px-4 bg-white border border-gray-200 h-[52px]">
                <Map size={18} color="#9CA3AF" />
                <TextInput
                  value={state}
                  onChangeText={setState}
                  placeholder="Tamil Nadu"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  style={{ flex: 1, marginLeft: 12, fontSize: 15, color: "#1F2937" }}
                />
              </View>
            </View>
          </View>

          {/* PIN Code */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-semibold mb-2 ml-1">
              PIN Code <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row items-center rounded-xl px-4 bg-white border border-gray-200 h-[52px]">
              <Hash size={18} color="#9CA3AF" />
              <TextInput
                value={zip}
                onChangeText={(v) => setZip(v.replace(/[^0-9]/g, ""))}
                placeholder="600001"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
                style={{ flex: 1, marginLeft: 12, fontSize: 15, color: "#1F2937" }}
              />
            </View>
          </View>

          {/* Set as Default Toggle */}
          {!currentAddress?.isDefault && (
            <View className="flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-200 mb-4">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
                  <CheckCircle size={20} color="#1D5A34" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-800 font-semibold">Set as Default</Text>
                  <Text className="text-gray-500 text-sm">Use this as your primary address</Text>
                </View>
              </View>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{ false: "#E5E7EB", true: "#1D5A34" }}
                thumbColor="#fff"
              />
            </View>
          )}

          {/* Current Default Indicator */}
          {currentAddress?.isDefault && (
            <View className="flex-row items-center bg-primary/10 p-4 rounded-xl border border-primary/20 mb-4">
              <CheckCircle size={20} color="#1D5A34" />
              <Text className="text-primary font-semibold ml-2">
                This is your default address
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="rounded-xl overflow-hidden mt-2 mb-6"
            style={{
              height: 54,
              backgroundColor: loading ? "#9CA3AF" : "#1D5A34",
            }}
          >
            <View className="flex-1 flex-row items-center justify-center">
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Save size={20} color="#fff" />
                  <Text className="text-white font-bold text-base ml-2">
                    Update Address
                  </Text>
                </>
              )}
            </View>
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
