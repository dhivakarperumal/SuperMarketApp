import { collection, onSnapshot, query } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { db } from "../services/firebase/config";
import { WhatsAppOrder, WhatsAppOrderStatus } from "../types/whatsapp";
import {
    addWhatsAppOrderNote,
    confirmWhatsAppOrder,
    convertToRegularOrder,
    getWhatsAppOrder,
    rejectWhatsAppOrder,
    updateWhatsAppOrderStatus,
} from "../services/whatsapp/WhatsAppOrderService";

interface UseWhatsAppOrdersOptions {
    status?: string;
}

const normalizeStatus = (status?: string): WhatsAppOrderStatus => {
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

const mapOrder = (data: any, id: string): WhatsAppOrder => ({
    id,
    ...data,
    status: normalizeStatus(data?.status),
    customerPhone: data?.customerPhone || data?.phone || "",
    items: Array.isArray(data?.items) ? data.items : [],
    statusHistory: Array.isArray(data?.statusHistory) ? data.statusHistory : [],
});

export const useWhatsAppOrders = (options?: UseWhatsAppOrdersOptions) => {
    const [orders, setOrders] = useState<WhatsAppOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "whatsappOrders"));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data = snapshot.docs
                    .map((d) => mapOrder(d.data(), d.id))
                    .filter((order) => {
                        if (!options?.status) return true;
                        return normalizeStatus(order.status) === normalizeStatus(options.status);
                    });

                setOrders(data);
                setLoading(false);
            },
            (error) => {
                console.error("Error loading WhatsApp orders:", error);
                setOrders([]);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [options?.status]);

    const getOrder = useCallback(async (id: string) => {
        const order = await getWhatsAppOrder(id);
        return order ? mapOrder(order, order.id) : null;
    }, []);

    const updateStatus = useCallback(async (id: string, status: string, adminId: string = "system") => {
        await updateWhatsAppOrderStatus(id, normalizeStatus(status), adminId);
    }, []);

    const confirmOrder = useCallback(async (id: string, adminId: string, note?: string) => {
        await confirmWhatsAppOrder(id, adminId, note);
    }, []);

    const rejectOrder = useCallback(async (id: string, adminId: string, reason: string) => {
        await rejectWhatsAppOrder(id, adminId, reason);
    }, []);

    const convertOrder = useCallback(async (id: string, adminId: string) => {
        return await convertToRegularOrder(id, adminId);
    }, []);

    const addNote = useCallback(async (id: string, adminId: string, note: string) => {
        await addWhatsAppOrderNote(id, adminId, note);
    }, []);

    const getCounts = useCallback(() => {
        const normalized = orders.map((order) => normalizeStatus(order.status));

        return {
            all: orders.length,
            pending: normalized.filter((status) => status === "Pending").length,
            processing: normalized.filter((status) => status === "Confirmed").length,
            completed: normalized.filter((status) => status === "Completed" || status === "Converted").length,
            cancelled: normalized.filter((status) => status === "Rejected").length,
        };
    }, [orders]);

    return {
        orders,
        loading,
        getOrder,
        updateStatus,
        confirmOrder,
        rejectOrder,
        convertOrder,
        addNote,
        getCounts,
    };
};

export const useWhatsAppPendingCount = () => {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "whatsappOrders"));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const pendingOrders = snapshot.docs.filter(
                    (docSnapshot) => normalizeStatus(docSnapshot.data()?.status) === "Pending"
                );
                setCount(pendingOrders.length);
                setLoading(false);
            },
            (error) => {
                console.error("Error loading WhatsApp pending count:", error);
                setCount(0);
                setLoading(false);
            }
        );
        return unsubscribe;
    }, []);

    return { count, loading };
};
