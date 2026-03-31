import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase/config";

export interface FavoriteItem {
    id: string;
    productId: string;
    name: string;
    price?: number;
    images?: string[];
    category?: string;
    stock?: number;
    stockUnit?: string;
    userId: string;
    createdAt?: any;
}

export const useFavorites = () => {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) { setLoading(false); return; }

        const q = query(collection(db, "favorites"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as FavoriteItem[];
            setFavorites(data);
            setLoading(false);
        }, () => setLoading(false));
        return unsubscribe;
    }, []);

    const addToFavorites = async (product: Partial<FavoriteItem>) => {
        const user = auth.currentUser;
        if (!user) return;
        await addDoc(collection(db, "favorites"), {
            ...product,
            userId: user.uid,
            createdAt: serverTimestamp(),
        });
    };

    const removeFromFavorites = async (productId: string) => {
        const favorite = favorites.find(f => f.productId === productId);
        if (favorite) {
            await deleteDoc(doc(db, "favorites", favorite.id));
        }
    };

    const isFavorite = (productId: string) =>
        favorites.some(f => f.productId === productId);

    const toggleFavorite = async (product: Partial<FavoriteItem>) => {
        const existing = favorites.find(f => f.productId === product.productId);
        if (existing) {
            await removeFromFavorites(product.productId!);
        } else {
            await addToFavorites(product);
        }
    };

    return { favorites, loading, addToFavorites, removeFromFavorites, isFavorite, toggleFavorite };
};
