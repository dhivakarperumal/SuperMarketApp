import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase/config";
import { SavedAddress } from "../types";

export const useAddresses = () => {
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, `users/${user.uid}/addresses`));
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
    }, [user?.uid]);

    const addAddress = async (addressData: Omit<SavedAddress, 'id'>) => {
        if (!user?.uid) throw new Error("User not authenticated");
        try {
            const docRef = await addDoc(
                collection(db, `users/${user.uid}/addresses`),
                addressData
            );
            return { id: docRef.id, ...addressData };
        } catch (error) {
            console.error("Error adding address:", error);
            throw error;
        }
    };

    const updateAddress = async (addressId: string, addressData: Partial<SavedAddress>) => {
        if (!user?.uid) throw new Error("User not authenticated");
        try {
            await updateDoc(
                doc(db, `users/${user.uid}/addresses`, addressId),
                addressData
            );
        } catch (error) {
            console.error("Error updating address:", error);
            throw error;
        }
    };

    const deleteAddress = async (addressId: string) => {
        if (!user?.uid) throw new Error("User not authenticated");
        try {
            await deleteDoc(
                doc(db, `users/${user.uid}/addresses`, addressId)
            );
        } catch (error) {
            console.error("Error deleting address:", error);
            throw error;
        }
    };

    return { addresses, loading, addAddress, updateAddress, deleteAddress };
};
