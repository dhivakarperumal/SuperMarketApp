import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";

export interface PurchaseOrder {
    id: string;
    orderId?: string;
    supplier?: string;
    supplierId?: string;
    items?: any[];
    totalAmount?: number;
    status?: "draft" | "ordered" | "received" | "cancelled";
    createdAt?: any;
    expectedDate?: any;
}

export const usePurchaseOrders = () => {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "purchase_orders"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as PurchaseOrder[];
            setOrders(data);
            setLoading(false);
        }, () => setLoading(false));
        return unsubscribe;
    }, []);

    const updateStatus = async (id: string, status: string) => {
        await updateDoc(doc(db, "purchase_orders", id), { status });
    };

    const createOrder = async (data: Partial<PurchaseOrder>) => {
        return await addDoc(collection(db, "purchase_orders"), { ...data, createdAt: serverTimestamp() });
    };

    return { orders, loading, updateStatus, createOrder };
};
