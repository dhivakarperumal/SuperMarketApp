import React, { createContext, useContext, useState, useEffect } from "react";
import { Linking } from "react-native";
import { doc, setDoc, onSnapshot, collection } from "firebase/firestore";
import { db } from "../services/firebase/config";
import { WhatsAppOrder, WhatsAppConfig } from "../types/whatsapp";

interface WhatsAppContextType {
    pendingCount: number;
    orders: WhatsAppOrder[];
    config: WhatsAppConfig;
    loading: boolean;
    isAvailable: boolean;
    updateConfig: (config: Partial<WhatsAppConfig>) => Promise<void>;
    checkAvailability: () => boolean;
    generateProductMessage: (productData: any) => string;
    generateOrderMessage: (orderData: any) => string;
    sendWhatsAppMessage: (message: string) => Promise<boolean>;
}

const defaultConfig: WhatsAppConfig = {
    isEnabled: false,
    phoneNumber: "",
    displayNumber: "",
    isAvailable24x7: true,
    availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    availableFromTime: "09:00",
    availableToTime: "21:00",
    enableProductOrders: false,
    enableCartOrders: false,
    enablePOSOrders: false,
    enableSupport: false,
    allowCOD: true,
    allowOnlinePayment: false,
    welcomeMessage: "Welcome to our store! How can we help you today?",
    orderConfirmationMessage: "Thank you for your order! We'll process it shortly.",
};

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

const normalizeStatus = (status?: string) => {
    switch ((status || "Pending").toLowerCase()) {
        case "confirmed":
            return "Confirmed";
        case "converted":
            return "Converted";
        case "rejected":
            return "Rejected";
        case "completed":
            return "Completed";
        default:
            return "Pending";
    }
};

export const WhatsAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pendingCount, setPendingCount] = useState(0);
    const [orders, setOrders] = useState<WhatsAppOrder[]>([]);
    const [config, setConfig] = useState<WhatsAppConfig>(defaultConfig);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const configRef = doc(db, "settings", "whatsapp");
        const unsubscribeConfig = onSnapshot(configRef, (configDoc) => {
            if (configDoc.exists()) {
                setConfig({ ...defaultConfig, ...configDoc.data() } as WhatsAppConfig);
            } else {
                setConfig(defaultConfig);
            }
            setLoading(false);
        });

        const ordersRef = collection(db, "whatsappOrders");
        const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
            const mappedOrders = snapshot.docs.map((orderDoc) => {
                const data = orderDoc.data() as any;
                return {
                    id: orderDoc.id,
                    ...data,
                    status: normalizeStatus(data.status),
                    customerPhone: data.customerPhone || data.phone || "",
                    items: Array.isArray(data.items) ? data.items : [],
                    statusHistory: Array.isArray(data.statusHistory) ? data.statusHistory : [],
                } as WhatsAppOrder;
            });

            setPendingCount(mappedOrders.filter((order) => normalizeStatus(order.status) === "Pending").length);
            setOrders(mappedOrders);
        });

        return () => {
            unsubscribeConfig();
            unsubscribeOrders();
        };
    }, []);

    const updateConfig = async (newConfig: Partial<WhatsAppConfig>) => {
        const configRef = doc(db, "settings", "whatsapp");
        await setDoc(configRef, { ...config, ...newConfig }, { merge: true });
    };

    const checkAvailability = (): boolean => {
        if (config.isAvailable24x7) return true;

        const now = new Date();
        const currentDay = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        const currentTime = now.toTimeString().slice(0, 5);
        const availableDays = Array.isArray(config.availableDays) ? config.availableDays : defaultConfig.availableDays;

        return availableDays.includes(currentDay) &&
            currentTime >= config.availableFromTime &&
            currentTime <= config.availableToTime;
    };

    const isAvailable = Boolean(config.isEnabled && config.phoneNumber && checkAvailability());

    const generateProductMessage = (productData: any): string => {
        const weightText = productData.selectedWeight ? ` (${productData.selectedWeight})` : "";

        return [
            "Hello! I want to order this product:",
            "",
            `Product: ${productData.productName || productData.name || "Item"}${weightText}`,
            `Quantity: ${Number(productData.quantity || 1)}`,
            `Price: ₹${Number(productData.price || 0).toFixed(2)}`,
            "",
            `Customer: ${productData.customerName || "Customer"}`,
        ]
            .filter(Boolean)
            .join("\n");
    };

    const generateOrderMessage = (orderData: any): string => {
        const items = Array.isArray(orderData.items)
            ? orderData.items
                .map((item: any) => {
                    const itemName = item.name || item.productName || "Item";
                    const weightText = item.selectedWeight ? ` (${item.selectedWeight})` : "";
                    return `• ${itemName}${weightText} x${item.quantity} - ₹${Number(item.price || 0) * Number(item.quantity || 0)}`;
                })
                .join("\n")
            : "";

        const deliveryAddress = orderData.deliveryAddress
            ? `${orderData.deliveryAddress.address || orderData.deliveryAddress.street || ""}, ${orderData.deliveryAddress.city || ""}, ${orderData.deliveryAddress.state || ""} - ${orderData.deliveryAddress.zip || orderData.deliveryAddress.pincode || ""}`
            : "Not provided";

        return [
            "Hello! I would like to place an order:",
            "",
            items,
            "",
            `Subtotal: ₹${Number(orderData.subtotal || 0).toFixed(2)}`,
            `Discount: ₹${Number(orderData.discount || 0).toFixed(2)}`,
            `Delivery: ₹${Number(orderData.deliveryFee || 0).toFixed(2)}`,
            `Total: ₹${Number(orderData.total || 0).toFixed(2)}`,
            "",
            `Customer: ${orderData.customerName || "Customer"}`,
            `Phone: ${orderData.customerPhone || "Not provided"}`,
            `Address: ${deliveryAddress}`,
            `Payment: ${orderData.paymentMethod || "cod"}`,
            orderData.notes ? `Notes: ${orderData.notes}` : "",
        ]
            .filter(Boolean)
            .join("\n");
    };

    const sendWhatsAppMessage = async (message: string): Promise<boolean> => {
        const phone = (config.phoneNumber || "").replace(/[^0-9]/g, "");

        if (!phone) {
            throw new Error("WhatsApp number is not configured");
        }

        const encodedMessage = encodeURIComponent(message);
        const appUrl = `whatsapp://send?phone=${phone}&text=${encodedMessage}`;
        const webUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

        try {
            const canOpenApp = await Linking.canOpenURL(appUrl);
            await Linking.openURL(canOpenApp ? appUrl : webUrl);
            return true;
        } catch (error) {
            console.error("Sending WhatsApp message failed:", error);
            throw new Error("Unable to open WhatsApp");
        }
    };

    return (
        <WhatsAppContext.Provider value={{
            pendingCount,
            orders,
            config,
            loading,
            isAvailable,
            updateConfig,
            checkAvailability,
            generateProductMessage,
            generateOrderMessage,
            sendWhatsAppMessage,
        }}>
            {children}
        </WhatsAppContext.Provider>
    );
};

export const useWhatsApp = () => {
    const context = useContext(WhatsAppContext);
    if (context === undefined) {
        throw new Error("useWhatsApp must be used within a WhatsAppProvider");
    }
    return context;
};
