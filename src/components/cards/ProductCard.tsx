import { View, Text, Pressable, Image } from "react-native";
import { Heart, ShoppingCart, Package } from "lucide-react-native";
import { router } from "expo-router";
import { Product } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { useFavorites } from "../../hooks/useFavorites";
import { useCart } from "../../context/CartContext";
import Toast from "react-native-toast-message";

// Helper to get first valid product image (filter out barcodes)
const getFirstValidImage = (images: string[] | undefined): string | null => {
  if (!images || images.length === 0) return null;
  const validImage = images.find((img) => {
    if (img.startsWith("data:image/svg")) return false;
    if (img.length < 50) return false;
    return img.startsWith("http") || img.startsWith("data:image/jpeg") || img.startsWith("data:image/png");
  });
  return validImage || null;
};

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  horizontal?: boolean;
}

export function ProductCard({ product, onPress, horizontal }: ProductCardProps) {
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();

  const favorite = isFavorite(product.id);
  const isOutOfStock = (product.stock || 0) <= 0;

  const priceValues = product.prices ? Object.values(product.prices) : [];
  const firstPrice = priceValues.length > 0
    ? Number(priceValues[0]) || 0
    : Number(product.price) || 0;
  const firstWeight = product.weights?.[0] || null;
  const validImage = getFirstValidImage(product.images);

  const handleFavorite = async () => {
    if (favorite) {
      await removeFromFavorites(product.id);
      Toast.show({ type: "info", text1: "Removed from Favorites" });
    } else {
      await addToFavorites({
        productId: product.id,
        name: product.name,
        price: firstPrice,
        image: validImage || "",
        selectedWeight: firstWeight || undefined,
      });
      Toast.show({ type: "success", text1: "Added to Favorites" });
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      Toast.show({
        type: "error",
        text1: "Out of Stock",
        text2: "This product is currently unavailable",
      });
      return;
    }

    const result = await addToCart({
      productId: product.id,
      name: product.name,
      price: firstPrice,
      quantity: 1,
      image: validImage || "",
      selectedWeight: firstWeight || undefined,
      weights: product.weights || [],
      prices: product.prices || {},
    });

    if (result.success) {
      Toast.show({
        type: "cart",
        text1: "Added to Cart",
        text2: product.name,
        onPress: () => {
          Toast.hide();
          router.push("/(customer)/(tabs)/cart");
        },
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Cannot Add",
        text2: result.message,
      });
    }
  };

  if (horizontal) {
    return (
      <Pressable
        onPress={onPress}
        style={{
          width: 165,
          marginRight: 12,
          backgroundColor: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          elevation: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
      >
        {/* Image Container */}
        <View style={{ height: 120, backgroundColor: '#f9fafb', position: 'relative' }}>
          {validImage ? (
            <Image
              source={{ uri: product.images[0] }}
              style={{ width: '100%', height: '100%', opacity: isOutOfStock ? 0.5 : 1 }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Package size={36} color="#d1d5db" />
            </View>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>OUT OF STOCK</Text>
              </View>
            </View>
          )}

          {/* Discount Badge */}
          {!isOutOfStock && product.offer && product.offer > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                backgroundColor: '#1D5A34',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                {product.offer}% OFF
              </Text>
            </View>
          )}

          {/* Favorite Button */}
          <Pressable
            onPress={handleFavorite}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 30,
              height: 30,
              backgroundColor: '#fff',
              borderRadius: 15,
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 3,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 2,
            }}
          >
            <Heart
              size={15}
              color={favorite ? "#EF4444" : "#9CA3AF"}
              fill={favorite ? "#EF4444" : "transparent"}
            />
          </Pressable>
        </View>

        {/* Content */}
        <View style={{ padding: 12 }}>
          <Text style={{ color: isOutOfStock ? '#9ca3af' : '#1f2937', fontWeight: '600', fontSize: 14 }} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 3 }}>{product.category}</Text>
          <Text style={{ color: isOutOfStock ? '#9ca3af' : '#1D5A34', fontWeight: '700', fontSize: 15, marginTop: 6 }}>
            {formatCurrency(firstPrice)}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}
    >
      {/* Image Container */}
      <View style={{ height: 130, backgroundColor: '#f9fafb', position: 'relative' }}>
        {validImage ? (
          <Image
            source={{ uri: product.images[0] }}
            style={{ width: '100%', height: '100%', opacity: isOutOfStock ? 0.5 : 1 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Package size={40} color="#d1d5db" />
          </View>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 4 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>OUT OF STOCK</Text>
            </View>
          </View>
        )}

        {/* Discount Badge */}
        {!isOutOfStock && product.offer && product.offer > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: '#1D5A34',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
              {product.offer}% OFF
            </Text>
          </View>
        )}

        {/* Favorite Button */}
        <Pressable
          onPress={handleFavorite}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 32,
            height: 32,
            backgroundColor: '#fff',
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 2,
          }}
        >
          <Heart
            size={16}
            color={favorite ? "#EF4444" : "#9CA3AF"}
            fill={favorite ? "#EF4444" : "transparent"}
          />
        </Pressable>
      </View>

      {/* Content */}
      <View style={{ padding: 12, flex: 1, justifyContent: 'space-between' }}>
        <View>
          <Text
            style={{ color: isOutOfStock ? '#9ca3af' : '#1f2937', fontWeight: '600', fontSize: 14, lineHeight: 20 }}
            numberOfLines={2}
          >
            {product.name}
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
            {product.category}
          </Text>
        </View>

        {/* Price and Cart */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <Text style={{ color: isOutOfStock ? '#9ca3af' : '#1D5A34', fontWeight: '700', fontSize: 16 }}>
            {formatCurrency(firstPrice)}
          </Text>
          <Pressable
            onPress={handleAddToCart}
            style={{
              width: 36,
              height: 36,
              backgroundColor: isOutOfStock ? '#D1D5DB' : '#1D5A34',
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={isOutOfStock}
          >
            <ShoppingCart size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
