import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { Offer } from "../types/offers";
import { db } from "../services/firebase/config";
import { useCart } from "./CartContext";

export interface AppliedOffer {
    offerId: string;
    offerName: string;
    offerType: string;
    discountAmount: number;
}

export interface CartTotals {
    subtotal: number;
    totalDiscount: number;
    appliedOffers: AppliedOffer[];
    total: number;
}

export interface OfferInfo {
    hasOffer: boolean;
    discountPercentage: number;
    offerName: string;
    originalPrice: number;
    effectivePrice: number;
}

interface AppliedCouponState {
    id: string;
    couponCode: string;
    discount: number;
    discountAmount: number;
}

interface CouponResult {
    isValid: boolean;
    discountAmount?: number;
    error?: string;
}

interface OfferContextType {
    activeOffers: Offer[];
    cartTotals: CartTotals;
    cartWithOffers: any[];
    appliedOffers: AppliedOffer[];
    couponDiscount: { discountAmount: number } | null;
    appliedCoupon?: AppliedCouponState | null;
    applyCoupon: (couponCode: string) => Promise<CouponResult>;
    removeCoupon: () => void;
    logAppliedOffers: (orderId: string, orderNumber: string, appliedOffers: AppliedOffer[], cartWithOffers: any[]) => Promise<void>;
    getOfferInfoForProduct: (productId: string, categoryId: string, price: number) => OfferInfo;
}

const OfferContext = createContext<OfferContextType | undefined>(undefined);

const getOfferInfoForProduct = (productId: string, categoryId: string, price: number): OfferInfo => {
    return {
        hasOffer: false,
        discountPercentage: 0,
        offerName: "",
        originalPrice: price,
        effectivePrice: price,
    };
};

export const OfferProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { cart } = useCart();
    const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
    const [couponDiscount, setCouponDiscount] = useState<{ discountAmount: number } | null>(null);
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponState | null>(null);

    useEffect(() => {
        const offersQuery = query(collection(db, "offers"));
        const unsubscribe = onSnapshot(
            offersQuery,
            (snapshot) => {
                const offers = snapshot.docs.map((offerDoc) => ({
                    id: offerDoc.id,
                    ...offerDoc.data(),
                })) as Offer[];
                setActiveOffers(offers);
            },
            (error) => {
                console.error("Error loading offers:", error);
                setActiveOffers([]);
            }
        );

        return unsubscribe;
    }, []);

    const subtotal = useMemo(
        () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [cart]
    );

    useEffect(() => {
        if (!appliedCoupon) {
            if (couponDiscount !== null) {
                setCouponDiscount(null);
            }
            return;
        }

        const nextDiscount = Math.min(subtotal, appliedCoupon.discountAmount);
        if (nextDiscount <= 0) {
            setAppliedCoupon(null);
            setCouponDiscount(null);
            return;
        }

        if (couponDiscount?.discountAmount !== nextDiscount) {
            setCouponDiscount({ discountAmount: nextDiscount });
            setAppliedCoupon((prev) =>
                prev
                    ? { ...prev, discount: nextDiscount, discountAmount: nextDiscount }
                    : prev
            );
        }
    }, [subtotal, appliedCoupon, couponDiscount]);

    const appliedOffers = useMemo<AppliedOffer[]>(() => {
        if (!appliedCoupon || !couponDiscount?.discountAmount) {
            return [];
        }

        return [
            {
                offerId: appliedCoupon.id,
                offerName: `Coupon: ${appliedCoupon.couponCode}`,
                offerType: "coupon",
                discountAmount: couponDiscount.discountAmount,
            },
        ];
    }, [appliedCoupon, couponDiscount]);

    const cartTotals = useMemo<CartTotals>(() => {
        const totalDiscount = couponDiscount?.discountAmount || 0;
        return {
            subtotal,
            totalDiscount,
            appliedOffers,
            total: Math.max(0, subtotal - totalDiscount),
        };
    }, [subtotal, couponDiscount, appliedOffers]);

    const cartWithOffers = useMemo(
        () =>
            cart.map((item) => ({
                ...item,
                effectivePrice: item.price,
                effectiveTotal: item.price * item.quantity,
                savings: 0,
            })),
        [cart]
    );

    const applyCoupon = useCallback(
        async (couponCode: string): Promise<CouponResult> => {
            const normalizedCode = couponCode.trim().toUpperCase();

            if (!normalizedCode) {
                return { isValid: false, error: "Please enter a coupon code" };
            }

            const matchingOffer = activeOffers.find(
                (offer) =>
                    offer.isActive &&
                    offer.type === "coupon" &&
                    offer.couponCode?.toUpperCase() === normalizedCode
            );

            if (!matchingOffer) {
                return { isValid: false, error: "Invalid coupon code" };
            }

            const minOrderValue = matchingOffer.minOrderValue || 0;
            if (subtotal < minOrderValue) {
                return {
                    isValid: false,
                    error: `Minimum order amount is ₹${minOrderValue}`,
                };
            }

            const discountValue = matchingOffer.discountValue || 0;
            const rawDiscount = matchingOffer.discountType === "percentage"
                ? (subtotal * discountValue) / 100
                : discountValue;
            const discountAmount = Math.min(subtotal, Math.max(0, rawDiscount));

            setAppliedCoupon({
                id: matchingOffer.id,
                couponCode: matchingOffer.couponCode || normalizedCode,
                discount: discountAmount,
                discountAmount,
            });
            setCouponDiscount({ discountAmount });

            return { isValid: true, discountAmount };
        },
        [activeOffers, subtotal]
    );

    const removeCoupon = useCallback(() => {
        setAppliedCoupon(null);
        setCouponDiscount(null);
    }, []);

    const logAppliedOffers = async (
        orderId: string,
        orderNumber: string,
        appliedOffers: AppliedOffer[],
        cartWithOffers: any[]
    ) => {
        console.log("Logging applied offers for order:", orderId, orderNumber, appliedOffers.length, cartWithOffers.length);
    };

    return (
        <OfferContext.Provider
            value={{
                activeOffers,
                cartTotals,
                cartWithOffers,
                appliedOffers,
                couponDiscount,
                appliedCoupon,
                applyCoupon,
                removeCoupon,
                getOfferInfoForProduct,
                logAppliedOffers,
            }}
        >
            {children}
        </OfferContext.Provider>
    );
};

export const useOffers = () => {
    const context = useContext(OfferContext);
    if (context === undefined) {
        throw new Error("useOffers must be used within an OfferProvider");
    }
    return context;
};
