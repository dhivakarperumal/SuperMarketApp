import { useState } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ChevronLeft, Building2 } from "lucide-react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { useSuppliers } from "../../../src/hooks/useSuppliers";

export default function AddSupplierScreen() {
  const insets = useSafeAreaInsets();
  const { addSupplier } = useSuppliers();
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [gstin, setGstin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: "error", text1: "Error", text2: "Supplier name is required" });
      return;
    }

    if (!phone.trim()) {
      Toast.show({ type: "error", text1: "Error", text2: "Phone number is required" });
      return;
    }

    setLoading(true);
    try {
      await addSupplier({
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        gstin: gstin.trim(),
      });
      Toast.show({ type: "success", text1: "Success", text2: "Supplier added successfully" });
      router.back();
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message || "Failed to add supplier" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-800">Add Supplier</Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center">
            <Building2 size={40} color="#2E7D32" />
          </View>
        </View>

        {/* Form */}
        <View className="bg-white rounded-2xl p-4">
          <Text className="text-gray-700 font-medium mb-2">Company Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter company name"
            placeholderTextColor="#9CA3AF"
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800 mb-4"
          />

          <Text className="text-gray-700 font-medium mb-2">Contact Person</Text>
          <TextInput
            value={contactPerson}
            onChangeText={setContactPerson}
            placeholder="Enter contact person name"
            placeholderTextColor="#9CA3AF"
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800 mb-4"
          />

          <Text className="text-gray-700 font-medium mb-2">Phone *</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800 mb-4"
          />

          <Text className="text-gray-700 font-medium mb-2">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email address"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800 mb-4"
          />

          <Text className="text-gray-700 font-medium mb-2">GSTIN</Text>
          <TextInput
            value={gstin}
            onChangeText={setGstin}
            placeholder="Enter GSTIN"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800 mb-4"
          />

          <Text className="text-gray-700 font-medium mb-2">Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Enter address"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={2}
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800 mb-4"
            style={{ textAlignVertical: "top", minHeight: 60 }}
          />

          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <Text className="text-gray-700 font-medium mb-2">City</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
              />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-gray-700 font-medium mb-2">State</Text>
              <TextInput
                value={state}
                onChangeText={setState}
                placeholder="State"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
              />
            </View>
          </View>

          <Text className="text-gray-700 font-medium mb-2">Pincode</Text>
          <TextInput
            value={pincode}
            onChangeText={setPincode}
            placeholder="Enter pincode"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
          />
        </View>
      </KeyboardAwareScrollView>

      {/* Save Button */}
      <View
        className="bg-white px-4 pt-4 border-t border-gray-100"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          onPress={handleSave}
          disabled={loading}
          className="bg-primary py-4 rounded-xl"
          style={{
            opacity: loading ? 0.7 : 1,
            shadowColor: "#2E7D32",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              Save Supplier
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
