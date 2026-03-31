import { collection, deleteDoc, doc, onSnapshot, query, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";
import { Offer } from "../types/offers";

export const useOffersAdmin = () => {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "offers"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Offer[];
            setOffers(data);
            setLoading(false);
        }, () => setLoading(false));
        return unsubscribe;
    }, []);

    const deleteOffer = async (id: string) => {
        await deleteDoc(doc(db, "offers", id));
    };

    const toggleOffer = async (id: string, isActive: boolean) => {
        await updateDoc(doc(db, "offers", id), { isActive });
    };

    return { offers, loading, deleteOffer, toggleOffer };
};

export const useOfferStats = () => {
    const [stats, setStats] = useState({ totalOffers: 0, activeOffers: 0, totalSavings: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "offers"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const offers = snapshot.docs.map(d => d.data());
            setStats({
                totalOffers: offers.length,
                activeOffers: offers.filter((o: any) => o.isActive).length,
                totalSavings: 0,
            });
            setLoading(false);
        }, () => setLoading(false));
        return unsubscribe;
    }, []);

    return { stats, loading };
};
