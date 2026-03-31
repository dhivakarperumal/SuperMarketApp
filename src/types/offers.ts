export interface Offer {
    id: string;
    name: string;
    type: string;
    description?: string;
    couponCode?: string;
    discountValue?: number;
    discountType?: "flat" | "percentage";
    minOrderValue?: number;
    isActive?: boolean;
    validFrom?: any;
    validUntil?: any;
    usageLimit?: number;
    usageCount?: number;
}

export interface AppliedOfferSummary {
    offerId: string;
    offerName: string;
    offerType: string;
    discountAmount: number;
}

export const OFFER_TYPE_LABELS: Record<string, string> = {
    flat_discount: "Flat Discount",
    percentage_discount: "% Discount",
    buy_x_get_y: "Buy X Get Y",
    coupon: "Coupon Code",
    free_shipping: "Free Shipping",
};

export const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
    flat_discount: { bg: "#DBEAFE", text: "#1D4ED8" },
    percentage_discount: { bg: "#D1FAE5", text: "#065F46" },
    buy_x_get_y: { bg: "#FEF3C7", text: "#92400E" },
    coupon: { bg: "#EDE9FE", text: "#5B21B6" },
    free_shipping: { bg: "#FCE7F3", text: "#9D174D" },
};
