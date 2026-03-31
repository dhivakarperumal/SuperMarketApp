import React, { createContext, useContext, useState } from "react";

interface PrinterContextType {
    isConnected: boolean;
    printReceipt: (orderData: any, settings: any) => Promise<void>;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

export const PrinterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected] = useState(false);

    const printReceipt = async (orderData: any, settings: any) => {
        console.log("Printing receipt:", orderData);
    };

    return (
        <PrinterContext.Provider value={{ isConnected, printReceipt }}>
            {children}
        </PrinterContext.Provider>
    );
};

export const usePrinter = () => {
    const context = useContext(PrinterContext);
    if (context === undefined) {
        throw new Error("usePrinter must be used within a PrinterProvider");
    }
    return context;
};
