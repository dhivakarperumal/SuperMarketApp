import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";
import { Subscription } from "../types";

export const useSubscription = (userId?: string) => {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) { setLoading(false); return; }
        const docRef = doc(db, "subscriptions", userId);
        const unsubscribe = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                setSubscription({ id: snap.id, ...snap.data() } as Subscription);
            } else {
                setSubscription(null);
            }
            setLoading(false);
        }, () => setLoading(false));
        return unsubscribe;
    }, [userId]);

    return { subscription, loading };
};
