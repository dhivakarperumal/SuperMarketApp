import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";

export const useOrders = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.uid) {
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(db, `users/${user.uid}/orders`),
            orderBy("createdAt", "desc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setOrders(ordersData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching orders:", error);
            setIsLoading(false);
        });

        return unsubscribe;
    }, [user?.uid]);

    return { orders, isLoading };
};
