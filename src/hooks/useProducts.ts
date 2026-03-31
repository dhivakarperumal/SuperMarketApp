import { collection, deleteDoc, doc, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";

export const useProducts = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "products"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(productsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching products:", error);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const deleteProduct = async (id: string) => {
        await deleteDoc(doc(db, "products", id));
    };

    const refresh = () => {
        // Since data is real-time via onSnapshot, no manual refresh needed
        return Promise.resolve();
    };

    return { products, loading, deleteProduct, refresh };
};
