import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

interface DeliveryConfig {
    isEnabled: boolean;
    defaultCharge: number;
    freeDeliveryThreshold?: number;
}

interface DeliveryContextType {
    isEnabled: boolean;
    config: DeliveryConfig;
    calculateCharge: (params: { pincode: string; orderValue: number }) => any;
    getFreeDeliveryThreshold: () => number;
    getAmountNeededForFreeDelivery: (currentTotal: number) => number;
}

const DeliveryConfigContext = createContext<DeliveryContextType | undefined>(undefined);

export const DeliveryConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isEnabled] = useState(true);
    const [config] = useState<DeliveryConfig>({ 
        isEnabled: true, 
        defaultCharge: 40,
        freeDeliveryThreshold: 500 // Free delivery on orders above 500
    });

    const calculateCharge = useMemo(() => (params: { pincode: string; orderValue: number }) => {
        const freeDeliveryThreshold = config.freeDeliveryThreshold || 500;
        const isFree = params.orderValue >= freeDeliveryThreshold;
        return {
            baseCharge: config.defaultCharge,
            discount: 0,
            additionalCharges: 0,
            finalCharge: isFree ? 0 : config.defaultCharge,
            isFree: isFree,
            appliedRules: [],
            message: isFree ? "Free Delivery" : `Standard Delivery - ₹${config.defaultCharge}`,
            minOrderMet: params.orderValue >= (freeDeliveryThreshold * 0.5),
        };
    }, [config]);

    const getFreeDeliveryThreshold = useCallback(() => {
        return config.freeDeliveryThreshold || 500;
    }, [config]);

    const getAmountNeededForFreeDelivery = useCallback((currentTotal: number) => {
        const threshold = config.freeDeliveryThreshold || 500;
        const amountNeeded = threshold - currentTotal;
        return amountNeeded > 0 ? amountNeeded : 0;
    }, [config]);

    return (
        <DeliveryConfigContext.Provider value={{ 
            isEnabled, 
            config, 
            calculateCharge,
            getFreeDeliveryThreshold,
            getAmountNeededForFreeDelivery
        }}>
            {children}
        </DeliveryConfigContext.Provider>
    );
};

export const useDeliveryConfig = () => {
    const context = useContext(DeliveryConfigContext);
    if (context === undefined) {
        throw new Error("useDeliveryConfig must be used within a DeliveryConfigProvider");
    }
    return context;
};
