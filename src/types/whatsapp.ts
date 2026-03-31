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

export interface WhatsAppConfig {
    isEnabled: boolean;
    phoneNumber: string;
    displayNumber: string;
    isAvailable24x7: boolean;
    availableDays: string[];
    availableFromTime: string;
    availableToTime: string;
    enableProductOrders: boolean;
    enableCartOrders: boolean;
    enablePOSOrders: boolean;
    enableSupport: boolean;
    allowCOD: boolean;
    allowOnlinePayment: boolean;
    welcomeMessage: string;
    orderConfirmationMessage: string;
}
