import { arrayRemove, arrayUnion, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { db } from "../services/firebase/config";
import { DeliveryConfig, DeliveryTimeSlot, DeliveryZone, OrderValueRule } from "../types/delivery";

const CONFIG_DOC = "settings/deliveryConfig";

export const useDeliveryCharges = () => {
    const [config, setConfig] = useState<DeliveryConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEnabled, setIsEnabled] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "settings", "deliveryConfig"), (snap) => {
            if (snap.exists()) {
                const data = snap.data() as DeliveryConfig;
                setConfig(data);
                setIsEnabled(data.isEnabled ?? true);
            }
            setIsLoading(false);
        }, () => setIsLoading(false));
        return unsubscribe;
    }, []);

    const initializeConfig = useCallback(async () => {
        const defaultConfig: DeliveryConfig = {
            isEnabled: true, defaultCharge: 40, freeDeliveryMessage: "Free delivery on orders above Rs. 500",
            showBreakdown: true, zones: [], orderValueRules: [], timeSlots: [],
        };
        await setDoc(doc(db, "settings", "deliveryConfig"), defaultConfig);
    }, []);

    const toggleEnabled = useCallback(async (value: boolean) => {
        setIsSaving(true);
        await updateDoc(doc(db, "settings", "deliveryConfig"), { isEnabled: value });
        setIsEnabled(value);
        setIsSaving(false);
    }, []);

    const updateGlobalSettings = useCallback(async (data: Partial<DeliveryConfig>) => {
        setIsSaving(true);
        await updateDoc(doc(db, "settings", "deliveryConfig"), data);
        setIsSaving(false);
    }, []);

    const addZone = useCallback(async (zone: Omit<DeliveryZone, "id">) => {
        const id = Date.now().toString();
        await updateDoc(doc(db, "settings", "deliveryConfig"), {
            zones: arrayUnion({ ...zone, id }),
        });
    }, []);

    const updateZone = useCallback(async (id: string, data: Partial<DeliveryZone>) => {
        const updated = (config?.zones || []).map(z => z.id === id ? { ...z, ...data } : z);
        await updateDoc(doc(db, "settings", "deliveryConfig"), { zones: updated });
    }, [config]);

    const deleteZone = useCallback(async (id: string) => {
        const zone = config?.zones?.find(z => z.id === id);
        if (zone) await updateDoc(doc(db, "settings", "deliveryConfig"), { zones: arrayRemove(zone) });
    }, [config]);

    const addOrderValueRule = useCallback(async (rule: Omit<OrderValueRule, "id">) => {
        const id = Date.now().toString();
        await updateDoc(doc(db, "settings", "deliveryConfig"), {
            orderValueRules: arrayUnion({ ...rule, id }),
        });
    }, []);

    const updateOrderValueRule = useCallback(async (id: string, data: Partial<OrderValueRule>) => {
        const updated = (config?.orderValueRules || []).map(r => r.id === id ? { ...r, ...data } : r);
        await updateDoc(doc(db, "settings", "deliveryConfig"), { orderValueRules: updated });
    }, [config]);

    const deleteOrderValueRule = useCallback(async (id: string) => {
        const rule = config?.orderValueRules?.find(r => r.id === id);
        if (rule) await updateDoc(doc(db, "settings", "deliveryConfig"), { orderValueRules: arrayRemove(rule) });
    }, [config]);

    const updateTimeSlot = useCallback(async (id: string, data: Partial<DeliveryTimeSlot>) => {
        const updated = (config?.timeSlots || []).map(s => s.id === id ? { ...s, ...data } : s);
        await updateDoc(doc(db, "settings", "deliveryConfig"), { timeSlots: updated });
    }, [config]);

    return { config, isLoading, isSaving, isEnabled, initializeConfig, toggleEnabled, updateGlobalSettings, addZone, updateZone, deleteZone, addOrderValueRule, updateOrderValueRule, deleteOrderValueRule, updateTimeSlot };
};
