import { collection, deleteDoc, doc, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";

export interface AppUser {
    id: string;
    email?: string;
    displayName?: string;
    phone?: string;
    role?: "admin" | "customer" | "cashier";
    isActive?: boolean;
    createdAt?: any;
}

export const useUsers = () => {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AppUser[];
            setUsers(data);
            setLoading(false);
        }, () => setLoading(false));
        return unsubscribe;
    }, []);

    const deleteUser = async (id: string) => {
        await deleteDoc(doc(db, "users", id));
    };

    return { users, loading, deleteUser };
};
