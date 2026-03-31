import { View, Text, Pressable } from "react-native";
import { LucideIcon } from "lucide-react-native";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  onPress?: () => void;
  subValue?: string;
}

export function StatCard({ label, value, icon: Icon, color, bgColor, onPress, subValue }: StatCardProps) {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      className="w-[48%] bg-white p-4 rounded-2xl mb-3"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View
          className="w-11 h-11 rounded-xl items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <Icon size={22} color={color} />
        </View>
      </View>
      <Text
        className="text-2xl font-bold text-gray-800"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text className="text-gray-500 text-sm mt-1">{label}</Text>
      {subValue && (
        <Text className="text-xs mt-1" style={{ color }}>{subValue}</Text>
      )}
    </Container>
  );
}
