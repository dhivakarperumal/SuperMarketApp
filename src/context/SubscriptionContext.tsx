import React, { createContext, useContext, useState } from "react";

interface SubscriptionContextType {
    isPro: boolean;
    plan: string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPro] = useState(true);
    const [plan] = useState("Pro");

    return (
        <SubscriptionContext.Provider value={{ isPro, plan }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscriptionContext = () => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error("useSubscriptionContext must be used within a SubscriptionProvider");
    }
    return context;
};
