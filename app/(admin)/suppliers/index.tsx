import { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Plus, Search, Phone, Mail, MapPin, Building2 } from "lucide-react-native";
import { router } from "expo-router";
import { useSuppliers } from "../../../src/hooks/useSuppliers";

export default function SuppliersScreen() {
  const { suppliers, loading } = useSuppliers();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text className="text-gray-500 mt-4">Loading suppliers...</Text>
      </SafeAreaView>
    );
  }

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
          <View>
            <Text className="text-xl font-bold text-gray-800">Suppliers</Text>
            <Text className="text-gray-500 text-sm">{suppliers.length} suppliers</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/(admin)/suppliers/add")}
          className="bg-primary p-2.5 rounded-full"
        >
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Search */}
      <View className="px-4 py-3 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search suppliers..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-gray-800"
          />
        </View>
      </View>

      {/* Suppliers List */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {filteredSuppliers.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Building2 size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-center">
              {searchQuery ? "No suppliers found" : "No suppliers yet.\nTap + to add one."}
            </Text>
          </View>
        ) : (
          filteredSuppliers.map((supplier) => (
            <Pressable
              key={supplier.id}
              onPress={() => router.push(`/(admin)/suppliers/${supplier.id}`)}
              className="bg-white rounded-2xl p-4 mb-3"
            >
              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center">
                  <Building2 size={24} color="#2E7D32" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-800 font-semibold text-base">{supplier.name}</Text>
                  <Text className="text-gray-500 text-sm">{supplier.contactPerson || "No contact"}</Text>
                </View>
                {supplier.currentBalance > 0 && (
                  <View className="bg-red-50 px-2 py-1 rounded-full">
                    <Text className="text-red-600 text-xs font-medium">Due: ₹{supplier.currentBalance}</Text>
                  </View>
                )}
              </View>

              {supplier.phone && (
                <View className="flex-row items-center mb-2">
                  <Phone size={14} color="#9CA3AF" />
                  <Text className="text-gray-600 text-sm ml-2">{supplier.phone}</Text>
                </View>
              )}

              {supplier.email && (
                <View className="flex-row items-center mb-2">
                  <Mail size={14} color="#9CA3AF" />
                  <Text className="text-gray-600 text-sm ml-2">{supplier.email}</Text>
                </View>
              )}

              {supplier.address && (
                <View className="flex-row items-center">
                  <MapPin size={14} color="#9CA3AF" />
                  <Text className="text-gray-600 text-sm ml-2" numberOfLines={1}>
                    {supplier.address}, {supplier.city}
                  </Text>
                </View>
              )}
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
