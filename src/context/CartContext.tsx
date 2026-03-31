import React, { createContext, useContext, useState, useCallback } from "react";
import { CartItem } from "../types";

interface CartContextType {
    cart: CartItem[];
    cartTotal: number;
    cartCount: number;
    addToCart: (item: Omit<CartItem, 'id'>) => Promise<{ success: boolean; message: string }>;
    removeFromCart: (id: string) => Promise<void>;
    updateQuantity: (id: string, quantity: number) => Promise<{ success: boolean; message: string }>;
    clearCart: () => Promise<void>;
    getItemQuantity: (productId: string) => number;
    getCartItemId: (productId: string) => string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const addToCart = useCallback(async (item: Omit<CartItem, 'id'>) => {
        try {
            setCart(prev => {
                const existingItem = prev.find(cartItem =>
                    cartItem.productId === item.productId &&
                    (cartItem.selectedWeight || "") === (item.selectedWeight || "")
                );

                if (existingItem) {
                    return prev.map(cartItem =>
                        cartItem.id === existingItem.id
                            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                            : cartItem
                    );
                }

                const id = `${item.productId}_${Date.now()}`;
                return [...prev, { ...item, id }];
            });
            return { success: true, message: "Added to cart" };
        } catch (error) {
            return { success: false, message: "Failed to add to cart" };
        }
    }, []);

    const removeFromCart = useCallback(async (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    }, []);

    const updateQuantity = useCallback(async (id: string, quantity: number) => {
        if (quantity <= 0) {
            await removeFromCart(id);
            return { success: true, message: "Item removed" };
        }
        setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
        return { success: true, message: "Quantity updated" };
    }, [removeFromCart]);

    const clearCart = useCallback(async () => {
        setCart([]);
    }, []);

    const getItemQuantity = useCallback((productId: string) => {
        return cart
            .filter(item => item.productId === productId)
            .reduce((sum, item) => sum + item.quantity, 0);
    }, [cart]);

    const getCartItemId = useCallback((productId: string) => {
        const item = cart.find(item => item.productId === productId);
        return item ? item.id : null;
    }, [cart]);

    return (
        <CartContext.Provider value={{ 
            cart, 
            cartTotal,
            cartCount,
            addToCart, 
            removeFromCart, 
            updateQuantity, 
            clearCart, 
            getItemQuantity, 
            getCartItemId 
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
