import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";

export interface Supplier {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    gstNumber?: string;
    createdAt?: any;
}

export const useSuppliers = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "suppliers"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Supplier[];
            setSuppliers(data);
            setLoading(false);
        }, () => setLoading(false));
        return unsubscribe;
    }, []);

    const deleteSupplier = async (id: string) => {
        await deleteDoc(doc(db, "suppliers", id));
    };

    const createSupplier = async (data: Partial<Supplier>) => {
        return await addDoc(collection(db, "suppliers"), { ...data, createdAt: serverTimestamp() });
    };

    const updateSupplier = async (id: string, data: Partial<Supplier>) => {
        await updateDoc(doc(db, "suppliers", id), data);
    };

    return { suppliers, loading, deleteSupplier, createSupplier, updateSupplier };
};
