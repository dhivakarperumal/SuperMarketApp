import { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ReturnRequest, ReturnItem } from '../types';

export const useReturns = () => {
    const createReturnRequest = async (
        orderId: string,
        customerId: string,
        items: ReturnItem[],
        reason: string
    ): Promise<string> => {
        try {
            const returnData = {
                orderId,
                customerId,
                items,
                reason,
                status: "Pending" as const,
                createdAt: new Date(),
            };

            const docRef = await addDoc(collection(db, "returnRequests"), returnData);
            return docRef.id;
        } catch (error) {
            console.error("Error creating return request:", error);
            throw error;
        }
    };

    return { createReturnRequest };
};

export const useReturnRequest = (returnId: string | null) => {
    const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!returnId) {
            setLoading(false);
            return;
        }

        const fetchReturnRequest = async () => {
            try {
                const docRef = doc(db, "returnRequests", returnId);
                const unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setReturnRequest({
                            id: docSnap.id,
                            ...docSnap.data()
                        } as ReturnRequest);
                    } else {
                        setError("Return request not found");
                    }
                    setLoading(false);
                }, (err) => {
                    console.error("Error fetching return request:", err);
                    setError("Failed to load return request");
                    setLoading(false);
                });

                return unsubscribe;
            } catch (err) {
                console.error("Error setting up return request listener:", err);
                setError("Failed to load return request");
                setLoading(false);
            }
        };

        const unsubscribe = fetchReturnRequest();
        return () => {
            if (unsubscribe) unsubscribe.then(fn => fn?.());
        };
    }, [returnId]);

    return { returnRequest, loading, error };
};