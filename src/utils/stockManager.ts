// stockManager - utilities for managing product stock
import { doc, getDoc, increment, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase/config";
import { CartItem } from "../types";

export const decrementStock = async (productId: string, quantity: number) => {
    await updateDoc(doc(db, "products", productId), {
        stock: increment(-quantity),
    });
};

export const incrementStock = async (productId: string, quantity: number) => {
    await updateDoc(doc(db, "products", productId), {
        stock: increment(quantity),
    });
};

export const checkStockAvailability = (product: any, requestedQty: number): boolean => {
    return (product?.stock || 0) >= requestedQty;
};

export const getStockStatus = (stock: number, unit: string): "normal" | "low" | "out" => {
    if (stock === 0) return "out";
    const threshold = unit === "g" || unit === "ml" ? 2000 : 3;
    return stock < threshold ? "low" : "normal";
};

export const getProductStock = async (productId: string): Promise<number> => {
    const productDoc = await getDoc(doc(db, "products", productId));
    if (productDoc.exists()) {
        const productData = productDoc.data();
        return productData?.stock || 0;
    }
    return 0;
};

export interface StockValidationResult {
    isValid: boolean;
    outOfStockItems: Array<{ name: string; productId: string }>;
    insufficientStockItems: Array<{ name: string; productId: string; availableQty: number; requestedQty: number }>;
}

export const validateCartStock = async (cart: CartItem[]): Promise<StockValidationResult> => {
    const outOfStockItems: Array<{ name: string; productId: string }> = [];
    const insufficientStockItems: Array<{ name: string; productId: string; availableQty: number; requestedQty: number }> = [];

    for (const item of cart) {
        const availableStock = await getProductStock(item.productId);
        
        if (availableStock === 0) {
            outOfStockItems.push({
                name: item.name,
                productId: item.productId
            });
        } else if (availableStock < item.quantity) {
            insufficientStockItems.push({
                name: item.name,
                productId: item.productId,
                availableQty: availableStock,
                requestedQty: item.quantity
            });
        }
    }

    return {
        isValid: outOfStockItems.length === 0 && insufficientStockItems.length === 0,
        outOfStockItems,
        insufficientStockItems
    };
};

export interface StockReductionResult {
    success: boolean;
    error?: string;
}

export const reduceStockAfterOrder = async (
    items: Array<{ productId: string; quantity: number; name: string }>,
    orderId: string,
    userId: string
): Promise<StockReductionResult> => {
    try {
        // Process stock reduction for each item
        const stockPromises = items.map(async (item) => {
            const availableStock = await getProductStock(item.productId);
            
            if (availableStock < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}. Available: ${availableStock}, Required: ${item.quantity}`);
            }
            
            await decrementStock(item.productId, item.quantity);
        });

        await Promise.all(stockPromises);
        
        return { success: true };
    } catch (error) {
        console.error("Stock reduction error:", error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Unknown stock reduction error" 
        };
    }
};
