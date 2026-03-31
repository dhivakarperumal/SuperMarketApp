export type GSTDisplayType = "none" | "inclusive" | "exclusive" | "breakdown";

export interface ReceiptSettings {
    storeName?: string;
    tagline?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    showLogo?: boolean;
    footerMessage?: string;
    footerSubMessage?: string;
    upiEnabled?: boolean;
    upiId?: string;
    upiMerchantName?: string;
    gstEnabled?: boolean;
    gstDisplayType?: GSTDisplayType;
    gstRate?: number;
    gstin?: string;
    stateCode?: string;
    fontSize?: "small" | "medium" | "large";
}

export type DiscountType = "flat" | "percentage" | "free";

export interface DeliveryZone {
    id: string;
    name: string;
    pincodes: string[];
    baseCharge: number;
    minOrderAmount?: number;
    freeDeliveryThreshold?: number;
    priority?: number;
    isActive?: boolean;
}

export interface OrderValueRule {
    id: string;
    name: string;
    minOrderValue: number;
    maxOrderValue?: number;
    discountType: DiscountType;
    discountValue?: number;
    isActive?: boolean;
}

export interface DeliveryTimeSlot {
    id: string;
    label: string;
    startTime: string;
    endTime: string;
    isActive?: boolean;
}

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

export interface SavedAddress {
    id: string;
    firstname: string;
    lastname?: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    isDefault?: boolean;
    label?: string;
}

export interface UserProfile {
    displayName?: string;
    email?: string;
    role?: string;
    phone?: string;
}

export interface Category {
    id: string;
    name: string;
    categoryId?: string;
    images?: string[];
    subcategories?: string[];
}

export interface Product {
    id: string;
    name: string;
    productId?: string;
    barcode?: string;
    category?: string;
    categoryId?: string;
    price?: number;
    prices?: Record<string, number>;
    stock?: number;
    stockUnit?: string;
    images?: string[];
}

export interface PurchaseOrder {
    id: string;
    orderId?: string;
    supplier?: string;
    supplierId?: string;
    items?: any[];
    totalAmount?: number;
    status?: "draft" | "ordered" | "received" | "cancelled";
    createdAt?: any;
    expectedDate?: any;
}

export interface Subscription {
    id: string;
    plan?: string;
    status?: string;
    validUntil?: any;
}

export type WhatsAppOrderStatus =
    | "Pending"
    | "Confirmed"
    | "Converted"
    | "Rejected"
    | "Completed"
    | "pending"
    | "processing"
    | "completed"
    | "cancelled";

export interface WhatsAppOrderItem {
    productId?: string;
    productName: string;
    quantity: number;
    price: number;
    selectedWeight?: string;
    image?: string;
}

export interface WhatsAppOrderStatusEntry {
    status: WhatsAppOrderStatus;
    timestamp: any;
    note?: string;
    updatedBy?: string;
}

export interface WhatsAppOrder {
    id: string;
    whatsappOrderId?: string;
    customerName: string;
    customerPhone?: string;
    phone?: string;
    message?: string;
    status: WhatsAppOrderStatus;
    items?: WhatsAppOrderItem[];
    subtotal?: number;
    deliveryFee?: number;
    discount?: number;
    totalAmount?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    customerMessage?: string;
    deliveryNotes?: string;
    deliveryAddress?: any;
    adminNotes?: string;
    convertedOrderId?: string;
    statusHistory?: WhatsAppOrderStatusEntry[];
    receivedAt?: any;
    createdAt?: any;
    updatedAt?: any;
}

export interface ReturnItem {
    productId: string;
    quantity: number;
    reason: string;
    price?: number;
    name?: string;
}

export interface ReturnRequest {
    id: string;
    returnId?: string;
    orderId: string;
    customerId: string;
    items: ReturnItem[];
    status: "Pending" | "Approved" | "Rejected" | "Processed";
    reason?: string;
    adminNotes?: string;
    createdAt: any;
    processedAt?: any;
}

export interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    selectedWeight?: string;
    image?: string;
    weights?: string[];
    prices?: Record<string, number>;
}
