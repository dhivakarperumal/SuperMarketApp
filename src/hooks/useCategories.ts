import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";

export const useCategories = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "categories"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const categoriesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCategories(categoriesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching categories:", error);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return { categories, loading };
};
