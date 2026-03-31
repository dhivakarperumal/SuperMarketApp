import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { WifiOff, RefreshCw, CloudOff, Check } from "lucide-react-native";
import { useOffline } from "../context/OfflineContext";

interface OfflineBannerProps {
  compact?: boolean;
}

export function OfflineBanner({ compact }: OfflineBannerProps) {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOffline();

  // Don't show if online and no pending items
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  if (compact) {
    if (!isOnline) {
      return (
        <View className="flex-row items-center bg-amber-500 px-3 py-1.5">
          <WifiOff size={14} color="#fff" />
          <Text className="text-white text-xs font-medium ml-1.5">Offline Mode</Text>
        </View>
      );
    }

    if (isSyncing) {
      return (
        <View className="flex-row items-center bg-blue-500 px-3 py-1.5">
          <ActivityIndicator size="small" color="#fff" />
          <Text className="text-white text-xs font-medium ml-1.5">Syncing...</Text>
        </View>
      );
    }

    if (pendingCount > 0) {
      return (
        <Pressable
          onPress={syncNow}
          className="flex-row items-center bg-amber-500 px-3 py-1.5"
        >
          <CloudOff size={14} color="#fff" />
          <Text className="text-white text-xs font-medium ml-1.5">
            {pendingCount} pending • Tap to sync
          </Text>
        </Pressable>
      );
    }

    return null;
  }

  // Full banner
  if (!isOnline) {
    return (
      <View className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center">
            <WifiOff size={20} color="#D97706" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-amber-800 font-semibold">You're Offline</Text>
            <Text className="text-amber-600 text-sm">
              You can still browse and place orders. They'll sync when you're back online.
            </Text>
          </View>
        </View>
        {pendingCount > 0 && (
          <View className="mt-2 bg-amber-100 rounded-lg px-3 py-2">
            <Text className="text-amber-700 text-sm">
              {pendingCount} item(s) waiting to sync
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (isSyncing) {
    return (
      <View className="bg-blue-50 border-b border-blue-200 px-4 py-3">
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color="#2563EB" />
          <Text className="text-blue-700 font-medium ml-3">
            Syncing {pendingCount} item(s)...
          </Text>
        </View>
      </View>
    );
  }

  if (pendingCount > 0) {
    return (
      <Pressable
        onPress={syncNow}
        className="bg-amber-50 border-b border-amber-200 px-4 py-3"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <CloudOff size={18} color="#D97706" />
            <Text className="text-amber-700 font-medium ml-2">
              {pendingCount} item(s) pending sync
            </Text>
          </View>
          <View className="flex-row items-center bg-amber-500 px-3 py-1.5 rounded-lg">
            <RefreshCw size={14} color="#fff" />
            <Text className="text-white font-semibold text-sm ml-1">Sync Now</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return null;
}

// Small indicator for headers
export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing } = useOffline();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <View
      className={`px-2 py-1 rounded-full flex-row items-center ${
        isOnline ? "bg-amber-100" : "bg-red-100"
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff size={12} color="#DC2626" />
          <Text className="text-red-600 text-xs font-medium ml-1">Offline</Text>
        </>
      ) : isSyncing ? (
        <>
          <ActivityIndicator size={10} color="#2563EB" />
          <Text className="text-blue-600 text-xs font-medium ml-1">Syncing</Text>
        </>
      ) : (
        <>
          <CloudOff size={12} color="#D97706" />
          <Text className="text-amber-600 text-xs font-medium ml-1">{pendingCount}</Text>
        </>
      )}
    </View>
  );
}
