import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  ChevronLeft,
  ChevronDown,
  Plus,
  Trash2,
  X,
  Search,
  User,
  Phone,
  Building2,
  Check,
} from "lucide-react-native";
import { router } from "expo-router";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../src/services/firebase/config";
import { useSuppliers } from "../../../src/hooks/useSuppliers";
import { useAuth } from "../../../src/context/AuthContext";
import { Supplier } from "../../../src/types";
import Toast from "react-native-toast-message";

export default function AddPurchaseOrderScreen() {
  const insets = useSafeAreaInsets();
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { userProfile } = useAuth();

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [items, setItems] = useState([{ name: "", quantity: "", price: "" }]);
  const [loading, setLoading] = useState(false);
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");

  const filteredSuppliers = suppliers.filter((s) => {
    const searchLower = supplierSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(searchLower) ||
      s.supplierCode.toLowerCase().includes(searchLower) ||
      s.contactPerson.toLowerCase().includes(searchLower) ||
      s.phone.includes(searchLower)
    );
  });

  const addItem = () => {
    setItems([...items, { name: "", quantity: "", price: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + qty * price;
    }, 0);
  };

  const generatePONumber = async () => {
    try {
      const poQuery = query(collection(db, "purchaseOrders"));
      const snapshot = await getDocs(poQuery);
      const nextNum = snapshot.size + 1;
      return `PO${String(nextNum).padStart(4, "0")}`;
    } catch (error) {
      return `PO${Date.now()}`;
    }
  };

  const handleSave = async () => {
    if (!selectedSupplier) {
      Toast.show({ type: "error", text1: "Error", text2: "Please select a supplier" });
      return;
    }

    const validItems = items.filter((item) => item.name.trim() && item.quantity && item.price);
    if (validItems.length === 0) {
      Toast.show({ type: "error", text1: "Error", text2: "Please add at least one item" });
      return;
    }

    setLoading(true);
    try {
      const poNumber = await generatePONumber();
      const totalAmount = getTotal();

      const poData = {
        poNumber,
        businessId: userProfile?.businessId || "",
        branchId: userProfile?.branchId || "",
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        items: validItems.map((item) => ({
          productId: "",
          productName: item.name,
          orderedQty: parseFloat(item.quantity) || 0,
          receivedQty: 0,
          pendingQty: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.price) || 0,
          taxAmount: 0,
          totalAmount: (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0),
        })),
        status: "draft",
        subtotal: totalAmount,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount,
        paidAmount: 0,
        dueAmount: totalAmount,
        notes: notes.trim() || null,
        createdBy: userProfile?.uid || "",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "purchaseOrders"), poData);

      Toast.show({ type: "success", text1: "Success", text2: `Purchase order ${poNumber} created` });
      router.back();
    } catch (error) {
      console.error("Error creating PO:", error);
      Toast.show({ type: "error", text1: "Error", text2: "Failed to create purchase order" });
    } finally {
      setLoading(false);
    }
  };

  const selectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierModal(false);
    setSupplierSearch("");
  };

  const renderSupplierItem = ({ item }: { item: Supplier }) => (
    <Pressable
      onPress={() => selectSupplier(item)}
      className={`flex-row items-center p-4 border-b border-gray-100 ${
        selectedSupplier?.id === item.id ? "bg-primary/10" : ""
      }`}
    >
      <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3">
        <Building2 size={20} color="#6B7280" />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="text-gray-800 font-semibold">{item.name}</Text>
          <View className="bg-gray-200 px-2 py-0.5 rounded ml-2">
            <Text className="text-gray-600 text-xs">{item.supplierCode}</Text>
          </View>
        </View>
        <View className="flex-row items-center mt-1">
          <User size={12} color="#9CA3AF" />
          <Text className="text-gray-500 text-sm ml-1">{item.contactPerson}</Text>
          <Text className="text-gray-300 mx-2">•</Text>
          <Phone size={12} color="#9CA3AF" />
          <Text className="text-gray-500 text-sm ml-1">{item.phone}</Text>
        </View>
      </View>
      {selectedSupplier?.id === item.id && (
        <View className="w-6 h-6 bg-primary rounded-full items-center justify-center">
          <Check size={14} color="#fff" />
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
        >
          <ChevronLeft size={24} color="#374151" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-800">New Purchase Order</Text>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Supplier */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-gray-700 font-semibold mb-3">Supplier *</Text>
          <Pressable
            onPress={() => setShowSupplierModal(true)}
            className={`flex-row items-center justify-between rounded-xl px-4 py-3 ${
              selectedSupplier ? "bg-primary/10 border-2 border-primary" : "bg-gray-100"
            }`}
          >
            {selectedSupplier ? (
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold">{selectedSupplier.name}</Text>
                <Text className="text-gray-500 text-sm">
                  {selectedSupplier.supplierCode} • {selectedSupplier.contactPerson}
                </Text>
              </View>
            ) : (
              <Text className="text-gray-400">Select supplier</Text>
            )}
            <ChevronDown size={20} color={selectedSupplier ? "#2E7D32" : "#9CA3AF"} />
          </Pressable>

          {suppliers.length === 0 && !suppliersLoading && (
            <Pressable
              onPress={() => router.push("/(admin)/suppliers/add")}
              className="flex-row items-center justify-center mt-3 py-2"
            >
              <Plus size={16} color="#2E7D32" />
              <Text className="text-primary font-medium ml-1">Add New Supplier</Text>
            </Pressable>
          )}
        </View>

        {/* Items */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-700 font-semibold">Items</Text>
            <Pressable onPress={addItem} className="flex-row items-center">
              <Plus size={16} color="#2E7D32" />
              <Text className="text-primary font-medium ml-1">Add Item</Text>
            </Pressable>
          </View>

          {items.map((item, index) => (
            <View key={index} className="mb-4 pb-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-500 text-sm">Item {index + 1}</Text>
                {items.length > 1 && (
                  <Pressable onPress={() => removeItem(index)}>
                    <Trash2 size={16} color="#EF4444" />
                  </Pressable>
                )}
              </View>

              <TextInput
                value={item.name}
                onChangeText={(v) => updateItem(index, "name", v)}
                placeholder="Product name"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800 mb-2"
              />

              <View className="flex-row">
                <TextInput
                  value={item.quantity}
                  onChangeText={(v) => updateItem(index, "quantity", v)}
                  placeholder="Qty"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-800 mr-2"
                />
                <TextInput
                  value={item.price}
                  onChangeText={(v) => updateItem(index, "price", v)}
                  placeholder="Price"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                />
              </View>
            </View>
          ))}

          {/* Total */}
          <View className="flex-row items-center justify-between pt-2">
            <Text className="text-gray-700 font-semibold">Total</Text>
            <Text className="text-xl font-bold text-primary">₹{getTotal().toLocaleString()}</Text>
          </View>
        </View>

        {/* Notes */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-gray-700 font-semibold mb-3">Notes (Optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes for this order..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
            style={{ minHeight: 80, textAlignVertical: "top" }}
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
              Create Order
            </Text>
          )}
        </Pressable>
      </View>

      {/* Supplier Selection Modal */}
      <Modal
        visible={showSupplierModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSupplierModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setShowSupplierModal(false)}
        >
          <Pressable
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
            style={{ maxHeight: "80%" }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View className="items-center py-3">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-800">Select Supplier</Text>
              <Pressable onPress={() => setShowSupplierModal(false)}>
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Search */}
            <View className="px-4 py-3">
              <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                <Search size={20} color="#9CA3AF" />
                <TextInput
                  value={supplierSearch}
                  onChangeText={setSupplierSearch}
                  placeholder="Search by name, code, phone..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 ml-3 text-gray-800"
                />
                {supplierSearch.length > 0 && (
                  <Pressable onPress={() => setSupplierSearch("")}>
                    <X size={18} color="#9CA3AF" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Supplier List */}
            {suppliersLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color="#2E7D32" />
              </View>
            ) : filteredSuppliers.length === 0 ? (
              <View className="items-center py-8">
                <Building2 size={40} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2">
                  {supplierSearch ? "No suppliers found" : "No suppliers added yet"}
                </Text>
                {!supplierSearch && (
                  <Pressable
                    onPress={() => {
                      setShowSupplierModal(false);
                      router.push("/(admin)/suppliers/add");
                    }}
                    className="mt-4 bg-primary px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white font-semibold">Add Supplier</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredSuppliers}
                keyExtractor={(item) => item.id}
                renderItem={renderSupplierItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
