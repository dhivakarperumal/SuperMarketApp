import React, { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";

interface PermissionContextType {
    role: string | null;
    isCashier: boolean;
    isAdmin: boolean;
    isManager: boolean;
    hasPermission: (permission: string) => boolean;
    canAccessDashboard: boolean;
    canAccessBilling: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { role } = useAuth();

    const isCashier = role === "cashier";
    const isAdmin = role === "admin";
    const isManager = role === "manager";

    const hasPermission = (permission: string): boolean => {
        switch (permission) {
            case "dashboard":
                return isAdmin || isManager;
            case "billing":
                return isAdmin || isManager || isCashier;
            case "inventory":
                return isAdmin || isManager;
            case "orders":
            case "orders.view":
                return isAdmin || isManager;
            case "products":
            case "products.view":
                return isAdmin || isManager;
            case "categories":
            case "categories.view":
                return isAdmin || isManager;
            case "settings":
            case "settings.view":
                return isAdmin;
            case "users":
                return isAdmin;
            default:
                return false;
        }
    };

    const canAccessDashboard = hasPermission("dashboard");
    const canAccessBilling = hasPermission("billing");

    return (
        <PermissionContext.Provider value={{
            role,
            isCashier,
            isAdmin,
            isManager,
            hasPermission,
            canAccessDashboard,
            canAccessBilling
        }}>
            {children}
        </PermissionContext.Provider>
    );
};

export const usePermissions = () => {
    const context = useContext(PermissionContext);
    if (context === undefined) {
        throw new Error("usePermissions must be used within a PermissionProvider");
    }
    return context;
};
