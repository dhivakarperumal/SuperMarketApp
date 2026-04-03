import { router } from "expo-router";
import {
    Briefcase,
    CheckCircle,
    ChevronLeft,
    Edit2,
    Home,
    MapPin,
    MapPinned,
    Phone,
    Plus,
    Trash2,
} from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAddresses } from "../../../src/hooks/useAddresses";
import { SavedAddress } from "../../../src/types";

export default function AddressesScreen() {
  const { addresses, loading, deleteAddress, setAsDefault } = useAddresses();

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<SavedAddress | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeletePress = (address: SavedAddress) => {
    setAddressToDelete(address);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;

    setDeleting(true);
    try {
      await deleteAddress(addressToDelete.id);
      setShowDeleteModal(false);
      setAddressToDelete(null);
      Toast.show({
        type: "success",
        text1: "Address Deleted",
        text2: "Address has been removed successfully",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete address",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setAsDefault(id);
      Toast.show({
        type: "success",
        text1: "Default Updated",
        text2: "Default address has been updated",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update default address",
      });
    }
  };

  const getLabelIcon = (label?: string) => {
    switch (label?.toLowerCase()) {
      case "home":
        return Home;
      case "work":
        return Briefcase;
      default:
        return MapPinned;
    }
  };

  const renderAddressCard = (address: SavedAddress, index: number) => {
    const LabelIcon = getLabelIcon(address.label);

    return (
      <View
        key={`${address.id}-${index}`}
        className={`bg-white rounded-2xl mb-3 overflow-hidden ${
          address.isDefault ? "border-2 border-primary" : "border border-gray-100"
        }`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <View className="flex-row items-center flex-1">
            <View
              className={`w-11 h-11 rounded-full items-center justify-center ${
                address.isDefault ? "bg-primary/10" : "bg-gray-100"
              }`}
            >
              <LabelIcon
                size={20}
                color={address.isDefault ? "#1D5A34" : "#6B7280"}
              />
            </View>
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Text className="text-gray-800 font-bold text-base">
                  {address.label || "Address"}
                </Text>
                {address.isDefault && (
                  <View className="flex-row items-center ml-2 bg-primary/10 px-2 py-0.5 rounded-full">
                    <CheckCircle size={10} color="#1D5A34" />
                    <Text className="text-primary text-xs ml-1 font-medium">Default</Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-500 text-sm mt-0.5">
                {address.firstname} {address.lastname}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row items-center">
            <Pressable
              onPress={() =>
                router.push(`/(customer)/addresses/edit?id=${address.id}`)
              }
              className="p-2.5 bg-blue-50 rounded-xl mr-2"
            >
              <Edit2 size={16} color="#3B82F6" />
            </Pressable>
            <Pressable
              onPress={() => handleDeletePress(address)}
              className="p-2.5 bg-red-50 rounded-xl"
            >
              <Trash2 size={16} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-100 mx-4" />

        {/* Address Details */}
        <View className="px-4 py-3">
          {/* Phone */}
          <View className="flex-row items-center mb-2">
            <Phone size={14} color="#9CA3AF" />
            <Text className="text-gray-600 text-sm ml-2">{address.phone}</Text>
          </View>

          {/* Address */}
          <View className="flex-row items-start">
            <MapPin size={14} color="#9CA3AF" style={{ marginTop: 2 }} />
            <Text className="text-gray-600 text-sm ml-2 flex-1 leading-5">
              {address.address}, {address.city}, {address.state} - {address.zip}
            </Text>
          </View>
        </View>

        {/* Set as Default Button */}
        {!address.isDefault && (
          <View className="px-4 pb-4">
            <Pressable
              onPress={() => handleSetDefault(address.id)}
              className="py-2.5 border border-primary rounded-xl bg-primary/5"
            >
              <Text className="text-primary text-center font-semibold text-sm">
                Set as Default
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1D5A34" />
      {/* Header */}
      <View
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </Pressable>
            <Text className="text-xl font-bold text-white">
              My Addresses
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(customer)/addresses/add")}
            className="flex-row items-center bg-white/20 px-4 py-2.5 rounded-xl border border-white/20"
          >
            <Plus size={18} color="#fff" />
            <Text className="text-white font-semibold ml-1.5">Add New</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D5A34" />
        </View>
      ) : addresses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <View className="bg-primary/10 p-6 rounded-full mb-4">
            <MapPin size={48} color="#1D5A34" />
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">
            No addresses saved
          </Text>
          <Text className="text-gray-500 text-center mb-6">
            Add your delivery addresses for faster checkout
          </Text>
          <Pressable
            onPress={() => router.push("/(customer)/addresses/add")}
            className="bg-primary px-6 py-3.5 rounded-xl flex-row items-center"
            style={{
              shadowColor: "#1D5A34",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Plus size={20} color="#fff" />
            <Text className="text-white font-bold ml-2">Add Address</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Address Count */}
          <Text className="text-gray-500 text-sm mb-3">
            {addresses.length} {addresses.length === 1 ? "address" : "addresses"} saved
          </Text>

          {addresses.map((address, index) => renderAddressCard(address, index))}

          {/* Add More Button at Bottom */}
          <Pressable
            onPress={() => router.push("/(customer)/addresses/add")}
            className="flex-row items-center justify-center py-4 border-2 border-dashed border-gray-300 rounded-xl mt-2"
          >
            <Plus size={20} color="#9CA3AF" />
            <Text className="text-gray-500 font-semibold ml-2">Add Another Address</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center px-6"
          onPress={() => !deleting && setShowDeleteModal(false)}
        >
          <Pressable
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <View className="items-center pt-8 pb-4">
              <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center">
                <MapPin size={36} color="#EF4444" />
              </View>
            </View>

            {/* Content */}
            <View className="px-6 pb-6">
              <Text className="text-xl font-bold text-gray-800 text-center mb-2">
                Delete Address?
              </Text>
              <Text className="text-gray-500 text-center mb-4">
                Are you sure you want to delete this address?
              </Text>

              {/* Address Preview */}
              {addressToDelete && (
                <View className="bg-[#F1F8E9] p-4 rounded-xl mb-6">
                  <View className="flex-row items-center mb-2">
                    <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center">
                      {(() => {
                        const Icon = getLabelIcon(addressToDelete.label);
                        return <Icon size={14} color="#6B7280" />;
                      })()}
                    </View>
                    <View className="ml-2">
                      <Text className="text-gray-800 font-semibold text-sm">
                        {addressToDelete.label || "Address"}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {addressToDelete.firstname} {addressToDelete.lastname}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-600 text-sm leading-5">
                    {addressToDelete.address}, {addressToDelete.city}, {addressToDelete.state} - {addressToDelete.zip}
                  </Text>
                </View>
              )}

              {/* Buttons */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 py-4 bg-gray-100 rounded-xl"
                >
                  <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-4 bg-red-500 rounded-xl flex-row items-center justify-center"
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold text-center">Delete</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
