import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";

export interface Branch {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    city?: string;
    state?: string;
    pincode?: string;
    isActive?: boolean;
    createdAt?: any;
}

export const useBranches = () => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "branches"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Branch[];
            setBranches(data);
            setLoading(false);
        }, () => setLoading(false));
        return unsubscribe;
    }, []);

    const deleteBranch = async (id: string) => {
        await deleteDoc(doc(db, "branches", id));
    };

    const createBranch = async (data: Partial<Branch>) => {
        return await addDoc(collection(db, "branches"), { ...data, createdAt: serverTimestamp() });
    };

    const updateBranch = async (id: string, data: Partial<Branch>) => {
        await updateDoc(doc(db, "branches", id), data);
    };

    return { branches, loading, deleteBranch, createBranch, updateBranch };
};
