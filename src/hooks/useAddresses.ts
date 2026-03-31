import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";
import { SavedAddress } from "../types";

export const useAddresses = () => {
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "addresses"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const addressesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SavedAddress[];
            setAddresses(addressesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching addresses:", error);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return { addresses, loading };
};
