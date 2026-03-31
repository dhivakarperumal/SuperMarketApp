import { collection, doc, onSnapshot, query, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";

export interface InventoryItem {
    id: string;
    name: string;
    stock: number;
    stockUnit: string;
    productId?: string;
    category?: string;
    images?: string[];
    minStock?: number;
    status?: "normal" | "low" | "out";
}

export const useInventory = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "products"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: InventoryItem[] = snapshot.docs.map(d => {
                const data = d.data();
                const stock = data.stock || 0;
                const unit = data.stockUnit || "pcs";
                let status: "normal" | "low" | "out" = "normal";
                if (stock === 0) status = "out";
                else if ((unit === "g" || unit === "ml") ? stock < 2000 : stock < 3) status = "low";
                return { id: d.id, ...data, status } as InventoryItem;
            });
            setInventory(items);
            setLoading(false);
        }, () => setLoading(false));
        return unsubscribe;
    }, []);

    const updateStock = async (id: string, newStock: number) => {
        await updateDoc(doc(db, "products", id), { stock: newStock });
    };

    const getInventoryStats = () => {
        const total = inventory.length;
        const low = inventory.filter((item) => item.status === "low").length;
        const critical = inventory.filter((item) => item.status === "out").length;
        const normal = inventory.filter((item) => item.status === "normal").length;

        return {
            total,
            normal,
            low,
            critical,
        };
    };

    return { inventory, loading, updateStock, getInventoryStats };
};
