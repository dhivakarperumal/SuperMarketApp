// returnUtils - utilities for handling order returns

export interface ReturnEligibility {
    eligible: boolean;
    daysRemaining?: number;
    reason?: string;
}

export const checkReturnEligibility = (order: any): ReturnEligibility => {
    if (!order) {
        return { eligible: false, reason: "Order not found" };
    }

    if (order.status !== "Delivered") {
        return { eligible: false, reason: "Order must be delivered to be eligible for return" };
    }

    const deliveredAt = order.deliveredAt?.toDate?.() || (order.deliveredAt ? new Date(order.deliveredAt) : null);
    if (!deliveredAt) {
        return { eligible: false, reason: "Delivery date not available" };
    }

    const now = new Date();
    const daysDiff = (now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
        return { eligible: false, reason: "Return period has expired (7 days from delivery)" };
    }

    const daysRemaining = Math.ceil(7 - daysDiff);
    return { 
        eligible: true, 
        daysRemaining,
        reason: `Return available for ${daysRemaining} more day${daysRemaining !== 1 ? 's' : ''}`
    };
};

export const getReturnableItems = (order: any): any[] => {
    if (!order || !order.items) return [];
    
    // For now, return all items. In a real implementation, you might filter out
    // items that cannot be returned (e.g., perishable goods, digital products, etc.)
    return order.items.map((item: any) => ({
        ...item,
        returnQuantity: 0, // Will be set by user
        maxReturnQuantity: item.quantity,
    }));
};

export const calculateRefundAmount = (items: Array<{ price: number; quantity: number }>): number => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const canReturnOrder = (order: any): boolean => {
    if (!order) return false;
    if (order.status !== "Delivered") return false;
    const deliveredAt = order.deliveredAt?.toDate?.() || (order.deliveredAt ? new Date(order.deliveredAt) : null);
    if (!deliveredAt) return false;
    const daysDiff = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
};

export const getReturnDeadline = (order: any): Date | null => {
    const deliveredAt = order?.deliveredAt?.toDate?.() || (order?.deliveredAt ? new Date(order.deliveredAt) : null);
    if (!deliveredAt) return null;
    const deadline = new Date(deliveredAt);
    deadline.setDate(deadline.getDate() + 7);
    return deadline;
};

export const getReturnStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        requested: "Return Requested",
        approved: "Return Approved",
        picked: "Item Picked Up",
        refunded: "Refund Processed",
        rejected: "Return Rejected",
    };
    return labels[status] || status;
};
