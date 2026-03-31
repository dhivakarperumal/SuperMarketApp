import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";
import { ReceiptSettings } from "../types";

export const defaultReceiptSettings: ReceiptSettings = {
    storeName: "Dhiva Deva Supermarket",
    tagline: "SUPER MARKET",
    address: "122 Sollaikolaimedu, Nayakaneri Post",
    city: "Tirupathur",
    state: "Tamil Nadu",
    pincode: "635802",
    phone: "8940450960",
    email: "dhivakarp305@gmail.com",
    logoUrl: "",
    showLogo: false,
    footerMessage: "Thank you for shopping with us!",
    footerSubMessage: "",
    upiEnabled: false,
    upiId: "",
    upiMerchantName: "",
    gstEnabled: false,
    gstDisplayType: "none",
    gstRate: 5,
    gstin: "",
    stateCode: "",
    fontSize: "medium",
};

export const useReceiptSettings = () => {
    const [settings, setSettings] = useState<ReceiptSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "settings", "receipt"), (snap) => {
            if (snap.exists()) {
                setSettings(snap.data() as ReceiptSettings);
            } else {
                setSettings(defaultReceiptSettings);
            }
            setIsLoading(false);
        }, () => {
            setSettings(defaultReceiptSettings);
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    const saveSettings = async (data: Partial<ReceiptSettings>) => {
        await setDoc(doc(db, "settings", "receipt"), data, { merge: true });
    };

    return { settings, isLoading, saveSettings };
};
