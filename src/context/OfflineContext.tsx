import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { offlineManager } from "../services/offline/OfflineManager";

interface OfflineContextType {
    isOffline: boolean;
    isOnline: boolean;
    pendingCount: number;
    isSyncing: boolean;
    syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            const online = await offlineManager.checkNetworkStatus();
            const pending = await offlineManager.getPendingCount();

            if (isMounted) {
                setIsOnline(online);
                setPendingCount(pending);
            }
        };

        init();

        const unsubscribe = offlineManager.addNetworkListener(async (online) => {
            setIsOnline(online);
            const pending = await offlineManager.getPendingCount();
            setPendingCount(pending);
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const syncNow = useCallback(async () => {
        setIsSyncing(true);
        try {
            await offlineManager.syncPendingOperations();
            const pending = await offlineManager.getPendingCount();
            setPendingCount(pending);
        } finally {
            setIsSyncing(false);
        }
    }, []);

    return (
        <OfflineContext.Provider value={{ isOffline: !isOnline, isOnline, pendingCount, isSyncing, syncNow }}>
            {children}
        </OfflineContext.Provider>
    );
};

export const useOffline = () => {
    const context = useContext(OfflineContext);
    if (context === undefined) {
        throw new Error("useOffline must be used within an OfflineProvider");
    }
    return context;
};
