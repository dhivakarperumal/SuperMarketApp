import { View, Text, Pressable } from "react-native";
import { Category } from "../../types";

interface CategoryCardProps {
  category: Category;
  onPress?: () => void;
}

export function CategoryCard({ category, onPress }: CategoryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginRight: 10,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 10,
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          borderWidth: 1,
          borderColor: "#f0f0f0",
        }}
      >
        <Text
          style={{
            color: "#374151",
            fontSize: 13,
            fontWeight: "600",
          }}
          numberOfLines={1}
        >
          {category.name}
        </Text>
      </View>
    </Pressable>
  );
}
